import type { Card, PrismaClient } from "@prisma/client";

const LEARNING_STATES = ["LEARNING", "RELEARNING"] as const;

type DatabaseClient = PrismaClient | { card: PrismaClient["card"] };

export async function getNextDueCard(
  db: DatabaseClient,
  userId: string,
  deckId: string,
  now: Date = new Date(),
): Promise<Card | null> {
  const whereBase = {
    deckId,
    dueAt: { lte: now },
    state: { not: "SUSPENDED" as const },
    deck: { userId, isArchived: false },
  };

  const learningCard = await db.card.findFirst({
    where: {
      ...whereBase,
      state: { in: [...LEARNING_STATES] },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
  });
  if (learningCard) {
    return learningCard;
  }

  const reviewCard = await db.card.findFirst({
    where: {
      ...whereBase,
      state: "REVIEW",
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
  });
  if (reviewCard) {
    return reviewCard;
  }

  return db.card.findFirst({
    where: {
      ...whereBase,
      state: "NEW",
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
  });
}
