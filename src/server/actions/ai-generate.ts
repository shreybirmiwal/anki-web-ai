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
  cards?: Array<{ front: string; back: string; noteType: "BASIC" | "CLOZE" }>;
  sourceText?: string;
  prompt?: string;
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

export async function generateCardsAction(
  _previousState: GeneratedState,
  formData: FormData,
): Promise<GeneratedState> {
  try {
    const userId = await getRequiredUserId();
    assertWithinRateLimit(`ai:${userId}`, 5, 60_000);

    const sourceText = String(formData.get("sourceText") || "").trim();
    const prompt = String(formData.get("prompt") || "").trim();
    if (!sourceText && !prompt) {
      return { error: "Add notes or a prompt first." };
    }

    const combined = [sourceText, prompt].filter(Boolean).join("\n");
    if (combined.length > 20_000) {
      return { error: "Input too long. Keep notes under 20,000 characters." };
    }

    if (!process.env.OPENAI_API_KEY) {
      const cards = fallbackCardGeneration(combined);
      return { cards, sourceText, prompt };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: buildCardGenerationPrompt(sourceText, prompt),
      max_output_tokens: 2000,
    });

    const outputText = response.output_text;
    const cards = parseGeneratedCards(outputText);
    return { cards, sourceText, prompt };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate cards.";
    return { error: message };
  }
}

export async function saveGeneratedCardsAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  const rawCards = String(formData.get("cards") || "");

  if (!rawCards) {
    throw new Error("No generated cards to save.");
  }

  const parsedCards = parseGeneratedCards(rawCards);
  const deck = await db.deck.findFirst({ where: { id: deckId, userId, isArchived: false } });
  if (!deck) {
    throw new Error("Deck not found.");
  }

  for (const card of parsedCards) {
    if (card.noteType === "CLOZE") {
      const note = await db.note.create({
        data: {
          deckId,
          type: NoteType.CLOZE,
          text: card.back,
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
