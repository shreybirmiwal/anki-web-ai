import { describe, expect, it } from "vitest";
import { scheduleCard } from "@/lib/scheduler/sm2";

describe("scheduleCard", () => {
  it("moves new card to learning on again", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const next = scheduleCard(
      {
        state: "NEW",
        dueAt: now,
        intervalDays: 0,
        easeFactor: 2.5,
        reps: 0,
        lapses: 0,
        stepIndex: 0,
      },
      "again",
      now,
    );
    expect(next.state).toBe("LEARNING");
    expect(next.lapses).toBe(1);
    expect(next.dueAt.getTime()).toBeGreaterThan(now.getTime());
  });

  it("graduates learning card on good at last step", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const next = scheduleCard(
      {
        state: "LEARNING",
        dueAt: now,
        intervalDays: 0,
        easeFactor: 2.5,
        reps: 0,
        lapses: 0,
        stepIndex: 1,
      },
      "good",
      now,
    );
    expect(next.state).toBe("REVIEW");
    expect(next.intervalDays).toBe(1);
  });

  it("expands review interval on easy", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const next = scheduleCard(
      {
        state: "REVIEW",
        dueAt: now,
        intervalDays: 5,
        easeFactor: 2.5,
        reps: 3,
        lapses: 0,
        stepIndex: 2,
      },
      "easy",
      now,
    );
    expect(next.state).toBe("REVIEW");
    expect(next.intervalDays).toBeGreaterThan(5);
    expect(next.easeFactor).toBeGreaterThan(2.5);
  });
});
