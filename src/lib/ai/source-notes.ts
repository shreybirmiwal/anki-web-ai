import { db } from "@/lib/db";

export type DeckSourceNoteContext = {
  id: string;
  title: string;
  content: string;
};

function normalize(content: string) {
  return content.replace(/\r\n/g, "\n").trim();
}

export async function getDeckSourceNotesForUser(options: {
  userId: string;
  deckId: string;
  selectedSourceNoteIds?: string[];
  includeAllWhenNoSelection?: boolean;
}) {
  const { userId, deckId, selectedSourceNoteIds = [], includeAllWhenNoSelection = true } = options;
  const deck = await db.deck.findFirst({
    where: { id: deckId, userId, isArchived: false },
    select: { id: true },
  });
  if (!deck) {
    throw new Error("Deck not found.");
  }

  const uniqueSelectedIds = [...new Set(selectedSourceNoteIds.filter(Boolean))];
  const notes = await db.deckSourceNote.findMany({
    where: {
      deckId,
      ...(uniqueSelectedIds.length > 0
        ? { id: { in: uniqueSelectedIds } }
        : includeAllWhenNoSelection
          ? {}
          : { id: { in: [] } }),
    },
    select: {
      id: true,
      title: true,
      content: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return notes.map((note) => ({
    id: note.id,
    title: note.title,
    content: normalize(note.content),
  }));
}

export function buildDeckSourceNotesText(
  notes: DeckSourceNoteContext[],
  options?: { perNoteChars?: number; maxChars?: number },
) {
  const perNoteChars = options?.perNoteChars ?? 3_500;
  const maxChars = options?.maxChars ?? 14_000;
  const segments: string[] = [];
  let currentLength = 0;

  for (const note of notes) {
    const bounded = note.content.slice(0, perNoteChars);
    if (!bounded) {
      continue;
    }

    const header = `### ${note.title}`;
    const segment = `${header}\n${bounded}`;
    if (currentLength + segment.length > maxChars) {
      break;
    }

    segments.push(segment);
    currentLength += segment.length;
  }

  return segments.join("\n\n");
}
