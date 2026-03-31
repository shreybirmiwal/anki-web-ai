"use server";

import type { StudyRating } from "@/lib/scheduler/types";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildAskDeckNotesPrompt } from "@/lib/ai/prompts";
import { askDeckNotesResponseSchema } from "@/lib/ai/schema";
import { buildDeckSourceNotesText, getDeckSourceNotesForUser } from "@/lib/ai/source-notes";
import { db } from "@/lib/db";
import { computeReviewMutation } from "@/lib/review/computeReviewMutation";
import { getRequiredUserId } from "@/lib/require-user";
import { assertWithinRateLimit } from "@/lib/security/rateLimit";
import { getNextDueCard } from "@/lib/scheduler/queue";

const reviewEditSchema = z.object({
  front: z.string().trim().min(1).max(500),
  back: z.string().trim().min(1).max(2000),
});

const reviewAheadSchema = z.object({
  count: z.coerce.number().int().min(0).max(500),
});

function readImageUrl(extra: unknown) {
  if (!extra || typeof extra !== "object") {
    return undefined;
  }

  const maybeImageUrl = (extra as { imageUrl?: unknown }).imageUrl;
  return typeof maybeImageUrl === "string" && maybeImageUrl.length > 0 ? maybeImageUrl : undefined;
}

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

async function getPersistedActiveCard(
  userId: string,
  deckId: string,
  now: Date,
  allowFuture: boolean,
) {
  const progress = await db.deckReviewProgress.findUnique({
    where: {
      userId_deckId: {
        userId,
        deckId,
      },
    },
    select: {
      activeCardId: true,
    },
  });
  if (!progress?.activeCardId) {
    return null;
  }

  return db.card.findFirst({
    where: {
      id: progress.activeCardId,
      deckId,
      ...(allowFuture ? {} : { dueAt: { lte: now } }),
      state: { not: "SUSPENDED" },
      deck: { userId, isArchived: false },
    },
  });
}

async function setActiveCardForDeck(userId: string, deckId: string, activeCardId: string | null) {
  await db.deckReviewProgress.upsert({
    where: {
      userId_deckId: {
        userId,
        deckId,
      },
    },
    create: {
      userId,
      deckId,
      activeCardId,
    },
    update: {
      activeCardId,
    },
  });
}

async function getNextCardIncludingFuture(userId: string, deckId: string) {
  return db.card.findFirst({
    where: {
      deckId,
      state: { not: "SUSPENDED" },
      deck: { userId, isArchived: false },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
  });
}

export async function getNextReviewCard(deckId: string) {
  const userId = await getRequiredUserId();
  const now = new Date();
  const progress = await db.deckReviewProgress.findUnique({
    where: {
      userId_deckId: {
        userId,
        deckId,
      },
    },
    select: {
      reviewAheadRemaining: true,
    },
  });
  const allowFuture = (progress?.reviewAheadRemaining ?? 0) > 0;
  let card = await getPersistedActiveCard(userId, deckId, now, allowFuture);
  if (!card) {
    card = allowFuture ? await getNextCardIncludingFuture(userId, deckId) : await getNextDueCard(db, userId, deckId, now);
    await setActiveCardForDeck(userId, deckId, card?.id ?? null);
  }
  if (!card) {
    return null;
  }

  const note = await db.note.findUnique({
    where: { id: card.noteId },
    select: { extra: true },
  });

  return {
    ...card,
    imageUrl: readImageUrl(note?.extra),
  };
}

export type DeckReviewForecast = {
  tomorrow: number;
  twoDays: number;
  sevenDays: number;
};

export type DeckReviewStats = {
  dueCount: number;
  forecast: DeckReviewForecast;
  reviewAheadRemaining: number;
};

export async function getDeckReviewStats(deckId: string): Promise<DeckReviewStats> {
  const userId = await getRequiredUserId();
  const now = new Date();
  const tomorrow = addDays(now, 1);
  const twoDays = addDays(now, 2);
  const sevenDays = addDays(now, 7);
  const whereBase = {
    deckId,
    state: { not: "SUSPENDED" as const },
    deck: { userId, isArchived: false },
  };

  const [dueCount, tomorrowCount, twoDayCount, sevenDayCount, progress] = await Promise.all([
    db.card.count({
      where: {
        ...whereBase,
        dueAt: { lte: now },
      },
    }),
    db.card.count({
      where: {
        ...whereBase,
        dueAt: { gt: now, lte: tomorrow },
      },
    }),
    db.card.count({
      where: {
        ...whereBase,
        dueAt: { gt: tomorrow, lte: twoDays },
      },
    }),
    db.card.count({
      where: {
        ...whereBase,
        dueAt: { gt: twoDays, lte: sevenDays },
      },
    }),
    db.deckReviewProgress.findUnique({
      where: {
        userId_deckId: {
          userId,
          deckId,
        },
      },
      select: {
        reviewAheadRemaining: true,
      },
    }),
  ]);

  return {
    dueCount,
    forecast: {
      tomorrow: tomorrowCount,
      twoDays: twoDayCount,
      sevenDays: sevenDayCount,
    },
    reviewAheadRemaining: progress?.reviewAheadRemaining ?? 0,
  };
}

export async function submitReview(formData: FormData) {
  const userId = await getRequiredUserId();
  const cardId = String(formData.get("cardId") || "");
  const deckId = String(formData.get("deckId") || "");
  const rating = String(formData.get("rating") || "") as StudyRating;
  if (!["again", "hard", "good", "easy"].includes(rating)) {
    throw new Error("Invalid rating.");
  }

  const card = await db.card.findFirst({
    where: {
      id: cardId,
      deckId,
      deck: { userId },
    },
  });

  if (!card) {
    throw new Error("Card not found.");
  }

  const now = new Date();
  const mutation = computeReviewMutation(card, rating, now);
  const wasReviewedAhead = card.dueAt > now;

  await db.$transaction(async (tx) => {
    const progress = await tx.deckReviewProgress.findUnique({
      where: {
        userId_deckId: {
          userId,
          deckId,
        },
      },
      select: {
        reviewAheadRemaining: true,
      },
    });
    const currentReviewAhead = progress?.reviewAheadRemaining ?? 0;
    const nextReviewAhead = wasReviewedAhead ? Math.max(0, currentReviewAhead - 1) : currentReviewAhead;

    await tx.card.update({
      where: { id: card.id },
      data: mutation.cardData,
    });
    await tx.reviewLog.create({
      data: mutation.logData,
    });
    await tx.deckReviewProgress.upsert({
      where: {
        userId_deckId: {
          userId,
          deckId,
        },
      },
      create: {
        userId,
        deckId,
        activeCardId: null,
        reviewAheadRemaining: nextReviewAhead,
      },
      update: {
        activeCardId: null,
        reviewAheadRemaining: nextReviewAhead,
      },
    });
  });

  revalidatePath(`/review/${deckId}`);
  redirect(`/review/${deckId}`);
}

export async function setReviewAheadMode(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  const parsed = reviewAheadSchema.safeParse({
    count: formData.get("count"),
  });
  if (!parsed.success) {
    throw new Error("Invalid review-ahead count.");
  }

  const deck = await db.deck.findFirst({
    where: {
      id: deckId,
      userId,
      isArchived: false,
    },
    select: {
      id: true,
    },
  });
  if (!deck) {
    throw new Error("Deck not found.");
  }

  await db.deckReviewProgress.upsert({
    where: {
      userId_deckId: {
        userId,
        deckId,
      },
    },
    create: {
      userId,
      deckId,
      activeCardId: null,
      reviewAheadRemaining: parsed.data.count,
    },
    update: {
      activeCardId: null,
      reviewAheadRemaining: parsed.data.count,
    },
  });

  revalidatePath(`/review/${deckId}`);
  redirect(`/review/${deckId}`);
}

export async function updateReviewCard(formData: FormData) {
  const userId = await getRequiredUserId();
  const cardId = String(formData.get("cardId") || "");
  const deckId = String(formData.get("deckId") || "");
  const parsed = reviewEditSchema.safeParse({
    front: formData.get("front"),
    back: formData.get("back"),
  });
  if (!parsed.success) {
    throw new Error("Invalid card content.");
  }

  const updated = await db.card.updateMany({
    where: {
      id: cardId,
      deckId,
      deck: { userId },
    },
    data: {
      front: parsed.data.front,
      back: parsed.data.back,
    },
  });
  if (updated.count === 0) {
    throw new Error("Card not found.");
  }

  revalidatePath(`/review/${deckId}`);
  redirect(`/review/${deckId}`);
}

function extractJsonObject(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  throw new Error("AI response was not valid JSON.");
}

const aiAdditionSchema = z.object({
  addition: z.string().trim().min(1).max(1200),
});

export type AskDeckNotesState = {
  error?: string;
  answer?: string;
  citedNoteTitles?: string[];
  question?: string;
};

export async function enhanceReviewCardWithAi(formData: FormData) {
  const userId = await getRequiredUserId();
  assertWithinRateLimit(`review-ai:${userId}`, 8, 60_000);

  const cardId = String(formData.get("cardId") || "");
  const deckId = String(formData.get("deckId") || "");
  const instruction = String(formData.get("instruction") || "").trim();
  if (!instruction) {
    throw new Error("Add an instruction for AI first.");
  }

  const card = await db.card.findFirst({
    where: {
      id: cardId,
      deckId,
      deck: { userId },
    },
  });
  if (!card) {
    throw new Error("Card not found.");
  }

  const baseBack = card.back.trim();
  let addition = "";

  if (process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        "You add extra study details to an existing flashcard answer.",
        "Return strict JSON only:",
        '{"addition":"..."}',
        "Do NOT rewrite or repeat the original card content.",
        "Generate only new additive content based on the instruction.",
        "Use concise bullet-style lines when possible.",
        "Keep addition <= 700 characters.",
        `Instruction: ${instruction}`,
        `Current question: ${card.front}`,
        `Current answer: ${card.back}`,
      ].join("\n"),
      max_output_tokens: 500,
    });

    const parsed = aiAdditionSchema.parse(JSON.parse(extractJsonObject(response.output_text)));
    addition = parsed.addition;
  } else {
    addition = `AI add-on (${instruction}):\n- Add one supporting detail.\n- Add one memorable example.`;
  }

  const nextBack = `${baseBack}\n\n---\nAI Add-on (${instruction}):\n${addition}`.slice(0, 2000);

  await db.card.update({
    where: { id: card.id },
    data: {
      front: card.front,
      back: nextBack,
    },
  });

  revalidatePath(`/review/${deckId}`);
  redirect(`/review/${deckId}`);
}

export async function askDeckNotesAction(
  _prevState: AskDeckNotesState,
  formData: FormData,
): Promise<AskDeckNotesState> {
  try {
    const userId = await getRequiredUserId();
    assertWithinRateLimit(`ask-notes-ai:${userId}`, 10, 60_000);

    const cardId = String(formData.get("cardId") || "");
    const deckId = String(formData.get("deckId") || "");
    const question = String(formData.get("question") || "").trim();
    if (!question) {
      return { error: "Enter a question first." };
    }

    const card = await db.card.findFirst({
      where: {
        id: cardId,
        deckId,
        deck: { userId },
      },
      select: {
        id: true,
        front: true,
        back: true,
      },
    });
    if (!card) {
      return { error: "Card not found." };
    }

    const sourceNotes = await getDeckSourceNotesForUser({
      userId,
      deckId,
    });
    if (sourceNotes.length === 0) {
      return { error: "No lecture notes found for this deck yet." };
    }

    const notesContext = buildDeckSourceNotesText(sourceNotes, { perNoteChars: 2_000, maxChars: 12_000 });

    if (!process.env.OPENAI_API_KEY) {
      return {
        question,
        answer: "OpenAI API key is not configured. Add notes context and API key to use Ask AI.",
        citedNoteTitles: sourceNotes.slice(0, 2).map((note) => note.title),
      };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: buildAskDeckNotesPrompt({
        question,
        cardFront: card.front,
        cardBack: card.back,
        notesContext,
      }),
      max_output_tokens: 700,
    });

    const parsed = askDeckNotesResponseSchema.parse(JSON.parse(extractJsonObject(response.output_text)));
    return {
      question,
      answer: parsed.answer,
      citedNoteTitles: parsed.citedNoteTitles,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query notes.";
    return { error: message };
  }
}
