import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewCard } from "@/components/review/ReviewCard";
import { db } from "@/lib/db";
import { getRequiredUserId } from "@/lib/require-user";
import {
  enhanceReviewCardWithAi,
  getDeckReviewStats,
  getNextReviewCard,
  submitReview,
  updateReviewCard,
} from "@/server/actions/review";

type ReviewDeckPageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function ReviewDeckPage({ params }: ReviewDeckPageProps) {
  const userId = await getRequiredUserId();
  const { deckId } = await params;
  const deck = await db.deck.findFirst({
    where: {
      id: deckId,
      userId,
      isArchived: false,
    },
  });
  if (!deck) {
    notFound();
  }

  const [card, stats] = await Promise.all([getNextReviewCard(deckId), getDeckReviewStats(deckId)]);

  return (
    <div className="stack">
      <h1>Review: {deck.name}</h1>
      <p className="muted">Due cards now: {stats.dueCount}</p>
      {!card ? (
        <section className="card stack">
          <h2>Done for now</h2>
          <p className="muted">No due cards in this deck.</p>
          <Link className="button secondary" href={`/decks/${deckId}`}>
            Back to Deck
          </Link>
        </section>
      ) : (
        <ReviewCard
          back={card.back}
          cardId={card.id}
          deckId={deckId}
          enhanceWithAiAction={enhanceReviewCardWithAi}
          front={card.front}
          submitAction={submitReview}
          updateCardAction={updateReviewCard}
        />
      )}
    </div>
  );
}
