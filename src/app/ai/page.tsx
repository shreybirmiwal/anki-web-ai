import { AiGeneratorForm } from "@/components/ai/AiGeneratorForm";
import { db } from "@/lib/db";
import { getRequiredUserId } from "@/lib/require-user";

export default async function AiPage() {
  const userId = await getRequiredUserId();
  const decks = await db.deck.findMany({
    where: { userId, isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="stack">
      <h1>AI Card Generation</h1>
      <p className="muted">
        Paste notes or a prompt, generate cards as JSON, edit them, and save to a deck.
      </p>
      <AiGeneratorForm decks={decks} />
    </div>
  );
}
