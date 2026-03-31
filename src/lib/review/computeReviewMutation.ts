import type { StudyRating } from "@/lib/scheduler/types";
import { scheduleCard } from "@/lib/scheduler/sm2";

type ReviewMutationCard = {
  id: string;
  state: "NEW" | "LEARNING" | "REVIEW" | "RELEARNING" | "SUSPENDED";
  dueAt: Date;
  intervalDays: number;
  easeFactor: number;
  reps: number;
  lapses: number;
  stepIndex: number;
};

export function computeReviewMutation(card: ReviewMutationCard, rating: StudyRating, now: Date) {
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
