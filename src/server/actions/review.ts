"use server";

import type { StudyRating } from "@/lib/scheduler/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getRequiredUserId } from "@/lib/require-user";
import { getNextDueCard } from "@/lib/scheduler/queue";
import { scheduleCard } from "@/lib/scheduler/sm2";

export async function getNextReviewCard(deckId: string) {
  const userId = await getRequiredUserId();
  return getNextDueCard(db, userId, deckId);
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

export function computeReviewMutation(
  card: {
    id: string;
    state: "NEW" | "LEARNING" | "REVIEW" | "RELEARNING" | "SUSPENDED";
    dueAt: Date;
    intervalDays: number;
    easeFactor: number;
    reps: number;
    lapses: number;
    stepIndex: number;
  },
  rating: StudyRating,
  now: Date,
) {
  const next = scheduleCard(
    {
      state: card.state,
      dueAt: card.dueAt,
      intervalDays: card.intervalDays,
      easeFactor: card.easeFactor,
      reps: card.reps,
      lapses: card.lapses,
      stepIndex: card.stepIndex,
    },
    rating,
    now,
  );

  return {
    cardData: {
      state: next.state,
      dueAt: next.dueAt,
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
      reps: next.reps,
      lapses: next.lapses,
      stepIndex: next.stepIndex,
      lastReviewedAt: now,
    },
    logData: {
      cardId: card.id,
      rating: { again: 1, hard: 2, good: 3, easy: 4 }[rating],
      previousState: card.state,
      nextState: next.state,
      previousInterval: card.intervalDays,
      nextInterval: next.intervalDays,
      previousEase: card.easeFactor,
      nextEase: next.easeFactor,
    },
  };
}
