import { describe, expect, it } from "vitest";
import { computeReviewMutation } from "@/lib/review/computeReviewMutation";

describe("computeReviewMutation", () => {
  it("creates consistent card and review log mutation payloads", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const mutation = computeReviewMutation(
      {
        id: "card-1",
        state: "REVIEW",
        dueAt: now,
        intervalDays: 3,
        easeFactor: 2.5,
        reps: 2,
        lapses: 0,
        stepIndex: 2,
      },
      "good",
      now,
    );

    expect(mutation.cardData.state).toBe("REVIEW");
    expect(mutation.cardData.intervalDays).toBeGreaterThan(3);
    expect(mutation.logData.cardId).toBe("card-1");
    expect(mutation.logData.rating).toBe(3);
    expect(mutation.logData.previousState).toBe("REVIEW");
    expect(mutation.logData.nextState).toBe("REVIEW");
  });
});
