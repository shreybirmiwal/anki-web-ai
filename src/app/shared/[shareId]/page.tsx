import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getRequiredUserId } from "@/lib/require-user";
import { copySharedDeck } from "@/server/actions/decks";

type SharedDeckPageProps = {
  params: Promise<{ shareId: string }>;
};

export default async function SharedDeckPage({ params }: SharedDeckPageProps) {
  const userId = await getRequiredUserId();
  const { shareId } = await params;

  const deck = await db.deck.findFirst({
    where: {
      shareId,
      isShareEnabled: true,
      isArchived: false,
    },
    include: {
      _count: {
        select: { cards: true, notes: true },
      },
      cards: {
        take: 6,
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });
  if (!deck) {
    notFound();
  }

  return (
    <div className="stack">
      <Link className="button secondary" href="/decks">
        Back to Decks
      </Link>

      <section className="card stack">
        <h1>Shared Deck: {deck.name}</h1>
        <p className="muted">
          {deck._count.notes} notes · {deck._count.cards} cards
        </p>
        <p className="muted">Copy this deck into your account to start studying and editing it.</p>
        {deck.userId === userId ? (
          <p className="muted">You are the owner of this deck.</p>
        ) : null}
        <form action={copySharedDeck}>
          <input type="hidden" name="shareId" value={shareId} />
          <button className="button" type="submit">
            Copy to My Decks
          </button>
        </form>
      </section>

      <section className="stack">
        <h2>Sample Cards</h2>
        {deck.cards.length === 0 ? (
          <p className="muted">This deck has no cards yet.</p>
        ) : (
          deck.cards.map((card) => (
            <article className="card stack" key={card.id}>
              <p>
                <strong>Front:</strong> {card.front}
              </p>
              <p>
                <strong>Back:</strong> {card.back}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
