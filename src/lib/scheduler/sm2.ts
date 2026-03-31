import type { CardState } from "@prisma/client";
import {
  learningStepsMinutes,
  type SchedulerCardInput,
  type SchedulerResult,
  type StudyRating,
} from "@/lib/scheduler/types";

const MIN_EASE = 1.3;

function addMinutes(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60 * 1000);
}

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

function clampEase(value: number) {
  return Math.max(MIN_EASE, Number(value.toFixed(2)));
}

function isInLearning(state: CardState) {
  return state === "NEW" || state === "LEARNING" || state === "RELEARNING";
}

export function scheduleCard(
  card: SchedulerCardInput,
  rating: StudyRating,
  now: Date = new Date(),
): SchedulerResult {
  const next: SchedulerResult = {
    state: card.state,
    dueAt: now,
    intervalDays: card.intervalDays,
    easeFactor: card.easeFactor,
    reps: card.reps,
    lapses: card.lapses,
    stepIndex: card.stepIndex,
  };

  if (rating === "again") {
    next.state = card.state === "REVIEW" ? "RELEARNING" : "LEARNING";
    next.stepIndex = 0;
    next.intervalDays = 0;
    next.lapses += 1;
    next.easeFactor = clampEase(card.easeFactor - 0.2);
    next.dueAt = addMinutes(now, learningStepsMinutes[0]);
    return next;
  }

  if (isInLearning(card.state)) {
    if (rating === "hard") {
      const hardStep = Math.min(card.stepIndex, learningStepsMinutes.length - 1);
      next.state = "LEARNING";
      next.stepIndex = hardStep;
      next.dueAt = addMinutes(now, learningStepsMinutes[hardStep]);
      next.easeFactor = clampEase(card.easeFactor - 0.05);
      return next;
    }

    if (rating === "good") {
      const nextStep = card.stepIndex + 1;
      if (nextStep >= learningStepsMinutes.length) {
        next.state = "REVIEW";
        next.intervalDays = 1;
        next.stepIndex = learningStepsMinutes.length;
        next.reps += 1;
        next.dueAt = addDays(now, 1);
      } else {
        next.state = "LEARNING";
        next.stepIndex = nextStep;
        next.dueAt = addMinutes(now, learningStepsMinutes[nextStep]);
      }
      return next;
    }

    next.state = "REVIEW";
    next.intervalDays = 4;
    next.stepIndex = learningStepsMinutes.length;
    next.reps += 1;
    next.easeFactor = clampEase(card.easeFactor + 0.15);
    next.dueAt = addDays(now, 4);
    return next;
  }

  const baseInterval = Math.max(1, card.intervalDays);
  const baseEase = Math.max(MIN_EASE, card.easeFactor);
  let nextInterval = baseInterval;
  let nextEase = baseEase;

  if (rating === "hard") {
    nextInterval = Math.max(baseInterval + 1, Math.round(baseInterval * 1.2));
    nextEase = clampEase(baseEase - 0.15);
  } else if (rating === "good") {
    nextInterval = Math.max(baseInterval + 1, Math.round(baseInterval * baseEase));
  } else if (rating === "easy") {
    nextInterval = Math.max(baseInterval + 2, Math.round(baseInterval * baseEase * 1.3));
    nextEase = clampEase(baseEase + 0.15);
  }

  next.state = "REVIEW";
  next.intervalDays = nextInterval;
  next.easeFactor = nextEase;
  next.reps += 1;
  next.dueAt = addDays(now, nextInterval);
  next.stepIndex = learningStepsMinutes.length;
  return next;
}
