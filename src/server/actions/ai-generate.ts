"use server";

import { NoteType } from "@prisma/client";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { buildCardGenerationPrompt } from "@/lib/ai/prompts";
import { parseGeneratedCards } from "@/lib/ai/parse";
import { db } from "@/lib/db";
import { getRequiredUserId } from "@/lib/require-user";
import { assertWithinRateLimit } from "@/lib/security/rateLimit";

export type GeneratedState = {
  error?: string;
  cards?: Array<{
    front: string;
    back: string;
    noteType: "BASIC" | "CLOZE";
    imagePrompt?: string;
    imageUrl?: string;
  }>;
  sourceText?: string;
  prompt?: string;
  includeImages?: boolean;
};

function fallbackCardGeneration(notes: string) {
  const lines = notes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 20)
    .slice(0, 12);

  return lines.map((line, index) => ({
    front: `Explain: ${line.slice(0, 70)}${line.length > 70 ? "..." : ""}`,
    back: line,
    noteType: index % 4 === 0 ? ("CLOZE" as const) : ("BASIC" as const),
  }));
}

function parseCheckboxValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function toDataImageUrl(base64: string, mimeType: "image/png" | "image/webp" = "image/png") {
  return `data:${mimeType};base64,${base64}`;
}

async function attachGeneratedImages(
  openai: OpenAI,
  cards: Array<{
    front: string;
    back: string;
    noteType: "BASIC" | "CLOZE";
    imagePrompt?: string;
    imageUrl?: string;
  }>,
) {
  const maxImagesPerBatch = 4;
  const cardsWithPrompts = cards.filter((card) => card.imagePrompt?.trim());
  const selectedCards = cardsWithPrompts.slice(0, maxImagesPerBatch);

  for (const card of selectedCards) {
    try {
      const image = await openai.images.generate({
        model: "gpt-image-1-mini",
        prompt: [
          "Create a clean educational illustration for a study flashcard.",
          "No logos, no brand marks, and no overlaid text labels.",
          `Question context: ${card.front}`,
          `Answer context: ${card.back}`,
          `Requested scene: ${card.imagePrompt}`,
        ].join("\n"),
        quality: "low",
        size: "1024x1024",
        output_format: "webp",
      });
      const base64Image = image.data?.[0]?.b64_json;
      if (base64Image) {
        card.imageUrl = toDataImageUrl(base64Image, "image/webp");
      }
    } catch {
      // Skip failed image generation for individual cards.
    }
  }

  return cards;
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
    const includeImages = parseCheckboxValue(formData.get("includeImages"));
    if (!sourceText && !prompt) {
      return { error: "Add notes or a prompt first." };
    }

    const combined = [sourceText, prompt].filter(Boolean).join("\n");
    if (combined.length > 20_000) {
      return { error: "Input too long. Keep notes under 20,000 characters." };
    }

    if (!process.env.OPENAI_API_KEY) {
      const cards = fallbackCardGeneration(combined);
      return { cards, sourceText, prompt, includeImages };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: buildCardGenerationPrompt(sourceText, prompt, includeImages),
      max_output_tokens: 2000,
    });

    const outputText = response.output_text;
    const cards = parseGeneratedCards(outputText);
    return { cards, sourceText, prompt, includeImages };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate cards.";
    return { error: message };
  }
}

export async function saveGeneratedCardsAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  const rawCards = String(formData.get("cards") || "");
  const includeImages = parseCheckboxValue(formData.get("includeImages"));

  if (!rawCards) {
    throw new Error("No generated cards to save.");
  }

  const parsedCards = parseGeneratedCards(rawCards);
  const deck = await db.deck.findFirst({ where: { id: deckId, userId, isArchived: false } });
  if (!deck) {
    throw new Error("Deck not found.");
  }

  const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  const cardsToSave =
    includeImages && openai
      ? await attachGeneratedImages(openai, parsedCards.map((card) => ({ ...card })))
      : parsedCards;

  for (const card of cardsToSave) {
    if (card.noteType === "CLOZE") {
      const note = await db.note.create({
        data: {
          deckId,
          type: NoteType.CLOZE,
          text: card.back,
          ...(card.imageUrl ? { extra: { imageUrl: card.imageUrl } } : {}),
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
        ...(card.imageUrl ? { extra: { imageUrl: card.imageUrl } } : {}),
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
