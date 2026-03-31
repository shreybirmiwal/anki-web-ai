"use server";

import { NoteType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getRequiredUserId } from "@/lib/require-user";
import { basicCardSchema, clozeSchema, deckNameSchema } from "@/lib/validation/card";

function extractClozeDeletions(text: string) {
  const regex = /\{\{c\d+::(.*?)(?:::(.*?))?\}\}/g;
  const matches = [...text.matchAll(regex)];
  return matches.map((match, index) => ({
    ordinal: index,
    hiddenText: match[1] || "",
    hint: match[2] || "",
  }));
}

export async function createDeck(formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = deckNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    throw new Error("Invalid deck name.");
  }

  await db.deck.create({
    data: {
      userId,
      name: parsed.data.name,
    },
  });

  revalidatePath("/decks");
}

export async function renameDeck(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  const parsed = deckNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    throw new Error("Invalid deck name.");
  }

  await db.deck.updateMany({
    where: { id: deckId, userId },
    data: { name: parsed.data.name },
  });
  revalidatePath("/decks");
  revalidatePath(`/decks/${deckId}`);
}

export async function archiveDeck(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  await db.deck.updateMany({
    where: { id: deckId, userId },
    data: { isArchived: true },
  });
  revalidatePath("/decks");
}

export async function deleteDeck(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  await db.deck.deleteMany({
    where: { id: deckId, userId },
  });
  revalidatePath("/decks");
}

export async function createBasicCard(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  const parsed = basicCardSchema.safeParse({
    front: formData.get("front"),
    back: formData.get("back"),
  });
  if (!parsed.success) {
    throw new Error("Invalid card input.");
  }

  const deck = await db.deck.findFirst({ where: { id: deckId, userId, isArchived: false } });
  if (!deck) {
    throw new Error("Deck not found.");
  }

  const note = await db.note.create({
    data: {
      deckId,
      type: NoteType.BASIC,
      front: parsed.data.front,
      back: parsed.data.back,
    },
  });
  await db.card.create({
    data: {
      deckId,
      noteId: note.id,
      front: parsed.data.front,
      back: parsed.data.back,
    },
  });

  revalidatePath(`/decks/${deckId}`);
}

export async function createBasicReversedCard(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  const parsed = basicCardSchema.safeParse({
    front: formData.get("front"),
    back: formData.get("back"),
  });
  if (!parsed.success) {
    throw new Error("Invalid card input.");
  }

  const deck = await db.deck.findFirst({ where: { id: deckId, userId, isArchived: false } });
  if (!deck) {
    throw new Error("Deck not found.");
  }

  const note = await db.note.create({
    data: {
      deckId,
      type: NoteType.BASIC_REVERSED,
      front: parsed.data.front,
      back: parsed.data.back,
    },
  });
  await db.card.createMany({
    data: [
      {
        deckId,
        noteId: note.id,
        ordinal: 0,
        front: parsed.data.front,
        back: parsed.data.back,
      },
      {
        deckId,
        noteId: note.id,
        ordinal: 1,
        front: parsed.data.back,
        back: parsed.data.front,
      },
    ],
  });

  revalidatePath(`/decks/${deckId}`);
}

export async function createClozeCards(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  const parsed = clozeSchema.safeParse({
    text: formData.get("text"),
  });
  if (!parsed.success) {
    throw new Error("Invalid cloze text.");
  }

  const deck = await db.deck.findFirst({ where: { id: deckId, userId, isArchived: false } });
  if (!deck) {
    throw new Error("Deck not found.");
  }

  const clozes = extractClozeDeletions(parsed.data.text);
  if (clozes.length === 0) {
    throw new Error("No cloze patterns found. Use {{c1::...}} format.");
  }

  const note = await db.note.create({
    data: {
      deckId,
      type: NoteType.CLOZE,
      text: parsed.data.text,
    },
  });
  await db.card.createMany({
    data: clozes.map((cloze) => ({
      deckId,
      noteId: note.id,
      ordinal: cloze.ordinal,
      front: parsed.data.text.replace(
        /\{\{c\d+::(.*?)(?:::(.*?))?\}\}/g,
        (_, text: string) => (text === cloze.hiddenText ? "[...]" : text),
      ),
      back: `${cloze.hiddenText}${cloze.hint ? ` (${cloze.hint})` : ""}`,
    })),
  });

  revalidatePath(`/decks/${deckId}`);
}

export async function updateCard(formData: FormData) {
  const userId = await getRequiredUserId();
  const cardId = String(formData.get("cardId") || "");
  const deckId = String(formData.get("deckId") || "");
  const parsed = basicCardSchema.safeParse({
    front: formData.get("front"),
    back: formData.get("back"),
  });
  if (!parsed.success) {
    throw new Error("Invalid card input.");
  }

  await db.card.updateMany({
    where: {
      id: cardId,
      deckId,
      deck: { userId },
    },
    data: {
      front: parsed.data.front,
      back: parsed.data.back,
    },
  });
  revalidatePath(`/decks/${deckId}`);
}

export async function deleteCard(formData: FormData) {
  const userId = await getRequiredUserId();
  const cardId = String(formData.get("cardId") || "");
  const deckId = String(formData.get("deckId") || "");
  await db.card.deleteMany({
    where: {
      id: cardId,
      deckId,
      deck: { userId },
    },
  });
  revalidatePath(`/decks/${deckId}`);
}
