-- CreateTable
CREATE TABLE "DeckReviewProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "activeCardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeckReviewProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeckReviewProgress_userId_deckId_key" ON "DeckReviewProgress"("userId", "deckId");

-- CreateIndex
CREATE INDEX "DeckReviewProgress_deckId_updatedAt_idx" ON "DeckReviewProgress"("deckId", "updatedAt");

-- CreateIndex
CREATE INDEX "DeckReviewProgress_activeCardId_idx" ON "DeckReviewProgress"("activeCardId");

-- AddForeignKey
ALTER TABLE "DeckReviewProgress" ADD CONSTRAINT "DeckReviewProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckReviewProgress" ADD CONSTRAINT "DeckReviewProgress_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckReviewProgress" ADD CONSTRAINT "DeckReviewProgress_activeCardId_fkey" FOREIGN KEY ("activeCardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
