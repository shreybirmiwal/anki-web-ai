import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getRequiredUserId } from "@/lib/require-user";
import {
  createBasicCard,
  createBasicReversedCard,
  createClozeCards,
  disableDeckSharing,
  deleteCard,
  enableDeckSharing,
  updateCard,
} from "@/server/actions/decks";

type DeckDetailPageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function DeckDetailPage({ params }: DeckDetailPageProps) {
  const userId = await getRequiredUserId();
  const { deckId } = await params;
  const deck = await db.deck.findFirst({
    where: { id: deckId, userId, isArchived: false },
    include: {
      cards: {
        orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!deck) {
    notFound();
  }

  const sharePath = deck.shareId ? `/shared/${deck.shareId}` : "";
  const shareUrl = deck.shareId
    ? process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}${sharePath}`
      : sharePath
    : "";

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>{deck.name}</h1>
        <Link className="button secondary" href={`/review/${deck.id}`}>
          Start Review
        </Link>
      </div>

      <section className="card stack">
        <h2>Share Deck</h2>
        <p className="muted">Anyone logged in with this link can copy this deck.</p>
        {deck.isShareEnabled ? (
          <>
            <label className="field">
              Share link
              <input readOnly value={shareUrl} />
            </label>
            <div className="row">
              <Link className="button secondary" href={sharePath}>
                Open Shared View
              </Link>
              <form action={disableDeckSharing}>
                <input type="hidden" name="deckId" value={deck.id} />
                <button className="button danger" type="submit">
                  Disable Sharing
                </button>
              </form>
            </div>
          </>
        ) : (
          <form action={enableDeckSharing}>
            <input type="hidden" name="deckId" value={deck.id} />
            <button className="button" type="submit">
              Enable Sharing
            </button>
          </form>
        )}
      </section>

      <section className="card stack">
        <h2>Add Basic Card</h2>
        <form action={createBasicCard} className="stack">
          <input type="hidden" name="deckId" value={deck.id} />
          <label className="field">
            Front
            <textarea name="front" rows={3} required />
          </label>
          <label className="field">
            Back
            <textarea name="back" rows={4} required />
          </label>
          <button className="button" type="submit">
            Add Basic
          </button>
        </form>
      </section>

      <section className="card stack">
        <h2>Add Basic + Reversed</h2>
        <form action={createBasicReversedCard} className="stack">
          <input type="hidden" name="deckId" value={deck.id} />
          <label className="field">
            Front
            <textarea name="front" rows={3} required />
          </label>
          <label className="field">
            Back
            <textarea name="back" rows={4} required />
          </label>
          <button className="button" type="submit">
            Add Reversed Pair
          </button>
        </form>
      </section>

      <section className="card stack">
        <h2>Add Cloze Note</h2>
        <p className="muted">Use cloze syntax like {"{{c1::mitochondria}}"}.</p>
        <form action={createClozeCards} className="stack">
          <input type="hidden" name="deckId" value={deck.id} />
          <textarea name="text" rows={5} required />
          <button className="button" type="submit">
            Add Cloze Cards
          </button>
        </form>
      </section>

      <section className="stack">
        <h2>Cards ({deck.cards.length})</h2>
        {deck.cards.map((card) => (
          <article className="card stack" key={card.id}>
            <p>
              <strong>Front:</strong> {card.front}
            </p>
            <p>
              <strong>Back:</strong> {card.back}
            </p>
            <p className="muted">
              {card.state} · Due {card.dueAt.toLocaleString()}
            </p>
            <form action={updateCard} className="grid two">
              <input type="hidden" name="deckId" value={deck.id} />
              <input type="hidden" name="cardId" value={card.id} />
              <textarea name="front" defaultValue={card.front} rows={2} required />
              <textarea name="back" defaultValue={card.back} rows={2} required />
              <button className="button secondary" type="submit">
                Save Edits
              </button>
            </form>
            <form action={deleteCard}>
              <input type="hidden" name="deckId" value={deck.id} />
              <input type="hidden" name="cardId" value={card.id} />
              <button className="button danger" type="submit">
                Delete Card
              </button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
