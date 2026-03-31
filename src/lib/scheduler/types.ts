import type { CardState } from "@prisma/client";

export type StudyRating = "again" | "hard" | "good" | "easy";

export type SchedulerCardInput = {
  state: CardState;
  dueAt: Date;
  intervalDays: number;
  easeFactor: number;
  reps: number;
  lapses: number;
  stepIndex: number;
};

export type SchedulerResult = {
  state: CardState;
  dueAt: Date;
  intervalDays: number;
  easeFactor: number;
  reps: number;
  lapses: number;
  stepIndex: number;
};

export const learningStepsMinutes = [1, 10] as const;
