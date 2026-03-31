"use server";

import { NoteType } from "@prisma/client";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { buildCardGenerationPrompt, buildQuizGenerationPrompt } from "@/lib/ai/prompts";
import { parseGeneratedCards, parseGeneratedQuiz } from "@/lib/ai/parse";
import { buildDeckSourceNotesText, getDeckSourceNotesForUser } from "@/lib/ai/source-notes";
import { db } from "@/lib/db";
import { getRequiredUserId } from "@/lib/require-user";
import { assertWithinRateLimit } from "@/lib/security/rateLimit";

type ImageSource = "real" | "ai" | "auto";
type CardImageAttribution = {
  source: "wikimedia" | "ai";
  author?: string;
  license?: string;
  sourceUrl?: string;
};
type GeneratedCard = {
  front: string;
  back: string;
  noteType: "BASIC" | "CLOZE";
  imagePrompt?: string;
  imageUrl?: string;
  imageAttribution?: CardImageAttribution;
};

type GeneratedQuizQuestion = {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
};

export type GeneratedState = {
  error?: string;
  cards?: GeneratedCard[];
  sourceText?: string;
  prompt?: string;
  imageSource?: ImageSource;
  deckId?: string;
  includeDeckNotes?: boolean;
  selectedSourceNoteIds?: string[];
  selectedSourceNoteTitles?: string[];
};

export type GeneratedQuizState = {
  error?: string;
  questions?: GeneratedQuizQuestion[];
  selectedSourceNoteIds?: string[];
  selectedSourceNoteTitles?: string[];
};

function fallbackCardGeneration(notes: string): GeneratedCard[] {
  const lines = notes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 20)
    .slice(0, 12);

  return lines.map((line, index) => ({
    front: `Explain: ${line.slice(0, 70)}${line.length > 70 ? "..." : ""}`,
    back: line,
    noteType: index % 4 === 0 ? ("CLOZE" as const) : ("BASIC" as const),
    imagePrompt: `Educational illustration of ${line.slice(0, 80)}`,
  }));
}

function parseImageSource(value: FormDataEntryValue | null): ImageSource {
  if (value === "real" || value === "ai" || value === "auto") {
    return value;
  }
  return "auto";
}

function parseCheckboxValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function toDataImageUrl(base64: string, mimeType: "image/png" | "image/webp" = "image/png") {
  return `data:${mimeType};base64,${base64}`;
}

function cleanHtml(value?: string) {
  if (!value) {
    return undefined;
  }

  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cardQuery(card: GeneratedCard) {
  const prompt = card.imagePrompt?.trim();
  if (prompt) {
    return prompt;
  }

  return card.front.slice(0, 180).trim();
}

function selectCardsForImages(cards: GeneratedCard[], maxImagesPerBatch = 4) {
  const withPrompt = cards.filter((card) => !card.imageUrl && card.imagePrompt?.trim());
  const withoutPrompt = cards.filter((card) => !card.imageUrl && !card.imagePrompt?.trim());
  return [...withPrompt, ...withoutPrompt].slice(0, maxImagesPerBatch);
}

async function fetchWikimediaImage(query: string) {
  const search = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime",
    iiurlwidth: "1024",
  });

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${search.toString()}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          imageinfo?: Array<{
            thumburl?: string;
            url?: string;
            descriptionurl?: string;
            mime?: string;
            extmetadata?: {
              Artist?: { value?: string };
              LicenseShortName?: { value?: string };
            };
          }>;
        }
      >;
    };
  };

  const pages = payload.query?.pages ? Object.values(payload.query.pages) : [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) {
      continue;
    }
    if (info.mime === "image/svg+xml") {
      continue;
    }

    const imageUrl = info.thumburl || info.url;
    if (!imageUrl) {
      continue;
    }

    return {
      imageUrl,
      imageAttribution: {
        source: "wikimedia" as const,
        author: cleanHtml(info.extmetadata?.Artist?.value),
        license: cleanHtml(info.extmetadata?.LicenseShortName?.value),
        sourceUrl: info.descriptionurl || info.url,
      },
    };
  }

  return null;
}

async function attachWikimediaImages(cards: GeneratedCard[]) {
  const selectedCards = selectCardsForImages(cards);
  for (const card of selectedCards) {
    const query = cardQuery(card);
    if (!query) {
      continue;
    }

    try {
      const found = await fetchWikimediaImage(query);
      if (!found) {
        continue;
      }
      card.imageUrl = found.imageUrl;
      card.imageAttribution = found.imageAttribution;
    } catch {
      // Skip failed image lookup for individual cards.
    }
  }

  return cards;
}

async function attachGeneratedImages(
  openai: OpenAI,
  cards: GeneratedCard[],
) {
  const selectedCards = selectCardsForImages(cards);

  for (const card of selectedCards) {
    if (card.imageUrl) {
      continue;
    }

    try {
      const image = await openai.images.generate({
        model: "gpt-image-1-mini",
        prompt: [
          "Create a clean educational illustration for a study flashcard.",
          "No logos, no brand marks, and no overlaid text labels.",
          `Question context: ${card.front}`,
          `Answer context: ${card.back}`,
          `Requested scene: ${cardQuery(card)}`,
        ].join("\n"),
        quality: "low",
        size: "1024x1024",
        output_format: "webp",
      });
      const base64Image = image.data?.[0]?.b64_json;
      if (base64Image) {
        card.imageUrl = toDataImageUrl(base64Image, "image/webp");
        card.imageAttribution = { source: "ai" };
      }
    } catch {
      // Skip failed image generation for individual cards.
    }
  }

  return cards;
}

function buildNoteExtra(card: GeneratedCard) {
  if (!card.imageUrl) {
    return undefined;
  }

  return {
    imageUrl: card.imageUrl,
    source: card.imageAttribution?.source ?? "ai",
    ...(card.imageAttribution?.author ? { author: card.imageAttribution.author } : {}),
    ...(card.imageAttribution?.license ? { license: card.imageAttribution.license } : {}),
    ...(card.imageAttribution?.sourceUrl ? { sourceUrl: card.imageAttribution.sourceUrl } : {}),
  };
}

function buildDeckCardsContext(cards: Array<{ front: string; back: string }>) {
  const maxCards = 80;
  const maxChars = 12_000;
  let current = 0;
  const lines: string[] = [];

  for (const card of cards.slice(0, maxCards)) {
    const line = `Q: ${card.front}\nA: ${card.back}`;
    if (current + line.length > maxChars) {
      break;
    }
    lines.push(line);
    current += line.length;
  }

  return lines.join("\n\n");
}

export async function generateCardsAction(
  _previousState: GeneratedState,
  formData: FormData,
): Promise<GeneratedState> {
  try {
    const userId = await getRequiredUserId();
    assertWithinRateLimit(`ai:${userId}`, 5, 60_000);

    const sourceText = String(formData.get("sourceText") || "").trim();
    const prompt = String(formData.get("prompt") || "").trim();
    const imageSource = parseImageSource(formData.get("imageSource"));
    const deckId = String(formData.get("deckId") || "").trim();
    const includeDeckNotes = parseCheckboxValue(formData.get("includeDeckNotes"));
    const selectedSourceNoteIds = formData
      .getAll("selectedSourceNoteIds")
      .map((value) => String(value))
      .filter(Boolean);

    let deckNotesText = "";
    let selectedSourceNoteTitles: string[] = [];
    if (deckId && includeDeckNotes) {
      const sourceNotes = await getDeckSourceNotesForUser({
        userId,
        deckId,
        selectedSourceNoteIds,
        includeAllWhenNoSelection: false,
      });
      deckNotesText = buildDeckSourceNotesText(sourceNotes);
      selectedSourceNoteTitles = sourceNotes.map((note) => note.title);
    }

    if (!sourceText && !prompt && !deckNotesText) {
      return { error: "Add notes or a prompt first." };
    }

    const combined = [sourceText, deckNotesText ? `Deck lecture notes:\n${deckNotesText}` : ""]
      .filter(Boolean)
      .join("\n\n");
    if (combined.length + prompt.length > 20_000) {
      return { error: "Input too long. Keep combined notes and prompt under 20,000 characters." };
    }

    if (!process.env.OPENAI_API_KEY) {
      const cards = fallbackCardGeneration(combined);
      return {
        cards,
        sourceText,
        prompt,
        imageSource,
        deckId,
        includeDeckNotes,
        selectedSourceNoteIds,
        selectedSourceNoteTitles,
      };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: buildCardGenerationPrompt(combined, prompt, imageSource),
      max_output_tokens: 2000,
    });

    const outputText = response.output_text;
    const cards = parseGeneratedCards(outputText);
    return {
      cards,
      sourceText,
      prompt,
      imageSource,
      deckId,
      includeDeckNotes,
      selectedSourceNoteIds,
      selectedSourceNoteTitles,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate cards.";
    return { error: message };
  }
}

export async function saveGeneratedCardsAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  const rawCards = String(formData.get("cards") || "");
  const imageSource = parseImageSource(formData.get("imageSource"));

  if (!rawCards) {
    throw new Error("No generated cards to save.");
  }

  const parsedCards = parseGeneratedCards(rawCards);
  const deck = await db.deck.findFirst({ where: { id: deckId, userId, isArchived: false } });
  if (!deck) {
    throw new Error("Deck not found.");
  }

  const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  let cardsToSave = parsedCards.map((card) => ({ ...card }));
  if (imageSource === "real" || imageSource === "auto") {
    cardsToSave = await attachWikimediaImages(cardsToSave);
  }
  if ((imageSource === "ai" || imageSource === "auto") && openai) {
    cardsToSave = await attachGeneratedImages(openai, cardsToSave);
  }

  for (const card of cardsToSave) {
    const noteExtra = buildNoteExtra(card);
    if (card.noteType === "CLOZE") {
      const note = await db.note.create({
        data: {
          deckId,
          type: NoteType.CLOZE,
          text: card.back,
          ...(noteExtra ? { extra: noteExtra } : {}),
        },
      });
      await db.card.create({
        data: {
          deckId,
          noteId: note.id,
          front: card.front,
          back: card.back,
        },
      });
      continue;
    }

    const note = await db.note.create({
      data: {
        deckId,
        type: NoteType.BASIC,
        front: card.front,
        back: card.back,
        ...(noteExtra ? { extra: noteExtra } : {}),
      },
    });
    await db.card.create({
      data: {
        deckId,
        noteId: note.id,
        front: card.front,
        back: card.back,
      },
    });
  }

  revalidatePath(`/decks/${deckId}`);
}

export async function generateDeckQuizAction(
  _prevState: GeneratedQuizState,
  formData: FormData,
): Promise<GeneratedQuizState> {
  try {
    const userId = await getRequiredUserId();
    assertWithinRateLimit(`ai-quiz:${userId}`, 6, 60_000);

    const deckId = String(formData.get("deckId") || "");
    const selectedSourceNoteIds = formData
      .getAll("selectedSourceNoteIds")
      .map((value) => String(value))
      .filter(Boolean);

    const deck = await db.deck.findFirst({
      where: { id: deckId, userId, isArchived: false },
      select: {
        id: true,
        name: true,
        cards: {
          select: { front: true, back: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!deck) {
      return { error: "Deck not found." };
    }

    const sourceNotes = await getDeckSourceNotesForUser({
      userId,
      deckId,
      selectedSourceNoteIds,
      includeAllWhenNoSelection: true,
    });
    const notesContext = buildDeckSourceNotesText(sourceNotes);
    const selectedSourceNoteTitles = sourceNotes.map((note) => note.title);
    const cardsContext = buildDeckCardsContext(deck.cards);

    if (!notesContext && !cardsContext) {
      return { error: "Add lecture notes or cards before generating a quiz." };
    }

    if (!process.env.OPENAI_API_KEY) {
      const fallbackQuestions: GeneratedQuizQuestion[] =
        deck.cards.length > 0
          ? deck.cards.slice(0, 8).map((card) => ({
              question: `From ${deck.name}: ${card.front}`,
              options: [
                card.back,
                "Not covered in this deck",
                "The opposite of the card answer",
                "A distractor option",
              ],
              correctOptionIndex: 0,
              explanation: `This comes from an existing card in ${deck.name}.`,
            }))
          : sourceNotes.slice(0, 6).map((note) => ({
              question: `Which lecture note is most related to: ${note.title}?`,
              options: [
                note.title,
                "None of these lecture notes",
                "A topic from another deck",
                "A random unrelated concept",
              ],
              correctOptionIndex: 0,
              explanation: "Fallback question created from lecture note titles.",
            }));
      return {
        questions: fallbackQuestions,
        selectedSourceNoteIds,
        selectedSourceNoteTitles,
      };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: buildQuizGenerationPrompt({
        deckName: deck.name,
        deckCardsContext: cardsContext,
        notesContext,
      }),
      max_output_tokens: 3_500,
    });

    const questions = parseGeneratedQuiz(response.output_text);
    return {
      questions,
      selectedSourceNoteIds,
      selectedSourceNoteTitles,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate quiz.";
    return { error: message };
  }
}
