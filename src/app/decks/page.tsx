import Link from "next/link";
import { db } from "@/lib/db";
import { getRequiredUserId } from "@/lib/require-user";
import { archiveDeck, createDeck, deleteDeck, renameDeck } from "@/server/actions/decks";

export default async function DecksPage() {
  const userId = await getRequiredUserId();
  const decks = await db.deck.findMany({
    where: { userId, isArchived: false },
    include: {
      _count: {
        select: { cards: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="stack">
      <h1>Your Decks</h1>
      <form action={createDeck} className="card row">
        <input type="text" name="name" placeholder="New deck name" required />
        <button className="button" type="submit">
          Create Deck
        </button>
      </form>

      <div className="grid">
        {decks.map((deck) => (
          <article className="card stack" key={deck.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <h2>{deck.name}</h2>
                <p className="muted">{deck._count.cards} cards</p>
              </div>
              <div className="row">
                <Link className="button secondary" href={`/decks/${deck.id}`}>
                  Open
                </Link>
                <Link className="button secondary" href={`/review/${deck.id}`}>
                  Review
                </Link>
              </div>
            </div>

            <div className="row">
              <form action={renameDeck} className="row">
                <input type="hidden" name="deckId" value={deck.id} />
                <input type="text" name="name" placeholder="Rename deck" required />
                <button className="button secondary" type="submit">
                  Rename
                </button>
              </form>
              <form action={archiveDeck}>
                <input type="hidden" name="deckId" value={deck.id} />
                <button className="button secondary" type="submit">
                  Archive
                </button>
              </form>
              <form action={deleteDeck}>
                <input type="hidden" name="deckId" value={deck.id} />
                <button className="button danger" type="submit">
                  Delete
                </button>
              </form>
            </div>
          </article>
        ))}
        {decks.length === 0 ? <p className="muted">No decks yet. Create your first one.</p> : null}
      </div>
    </div>
  );
}
