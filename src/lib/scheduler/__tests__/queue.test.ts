import { describe, expect, it } from "vitest";
import { getNextDueCard } from "@/lib/scheduler/queue";

function makeCard(id: string, state: "NEW" | "LEARNING" | "REVIEW", dueAt: Date) {
  return {
    id,
    state,
    dueAt,
    deckId: "deck-1",
    front: "front",
    back: "back",
    noteId: "note-1",
    ordinal: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    reps: 0,
    lapses: 0,
    stepIndex: 0,
    lastReviewedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("getNextDueCard", () => {
  it("prioritizes learning cards over review and new", async () => {
    const now = new Date("2026-01-01T01:00:00.000Z");
    const cards = [
      makeCard("new-1", "NEW", new Date("2026-01-01T00:00:00.000Z")),
      makeCard("review-1", "REVIEW", new Date("2026-01-01T00:00:00.000Z")),
      makeCard("learning-1", "LEARNING", new Date("2026-01-01T00:00:00.000Z")),
    ];
    const db = {
      card: {
        findFirst: async ({ where }: { where: { state?: { in?: string[] } | string } }) => {
          if (typeof where.state === "object" && where.state?.in?.includes("LEARNING")) {
            return cards.find((card) => card.state === "LEARNING") ?? null;
          }
          if (where.state === "REVIEW") {
            return cards.find((card) => card.state === "REVIEW") ?? null;
          }
          return cards.find((card) => card.state === "NEW") ?? null;
        },
      },
    };

    const next = await getNextDueCard(
      db as never,
      "user-1",
      "deck-1",
      now,
    );
    expect(next?.id).toBe("learning-1");
  });
});
