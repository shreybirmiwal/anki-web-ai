-- CreateTable
CREATE TABLE "DeckSourceNote" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeckSourceNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeckSourceNote_deckId_createdAt_idx" ON "DeckSourceNote"("deckId", "createdAt");

-- AddForeignKey
ALTER TABLE "DeckSourceNote" ADD CONSTRAINT "DeckSourceNote_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
