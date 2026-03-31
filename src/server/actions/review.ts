"use server";

import type { StudyRating } from "@/lib/scheduler/types";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { computeReviewMutation } from "@/lib/review/computeReviewMutation";
import { getRequiredUserId } from "@/lib/require-user";
import { assertWithinRateLimit } from "@/lib/security/rateLimit";
import { getNextDueCard } from "@/lib/scheduler/queue";

const reviewEditSchema = z.object({
  front: z.string().trim().min(1).max(500),
  back: z.string().trim().min(1).max(2000),
});

function readImageUrl(extra: unknown) {
  if (!extra || typeof extra !== "object") {
    return undefined;
  }

  const maybeImageUrl = (extra as { imageUrl?: unknown }).imageUrl;
  return typeof maybeImageUrl === "string" && maybeImageUrl.length > 0 ? maybeImageUrl : undefined;
}

export async function getNextReviewCard(deckId: string) {
  const userId = await getRequiredUserId();
  const card = await getNextDueCard(db, userId, deckId);
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

export async function getDeckReviewStats(deckId: string) {
  const userId = await getRequiredUserId();
  const dueCount = await db.card.count({
    where: {
      deckId,
      dueAt: { lte: new Date() },
      state: { not: "SUSPENDED" },
      deck: { userId, isArchived: false },
    },
  });

  return { dueCount };
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

  await db.$transaction([
    db.card.update({
      where: { id: card.id },
      data: mutation.cardData,
    }),
    db.reviewLog.create({
      data: mutation.logData,
    }),
  ]);

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
