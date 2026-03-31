"use server";

import { randomBytes } from "node:crypto";
import { NoteType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getRequiredUserId } from "@/lib/require-user";
import {
  basicCardSchema,
  clozeSchema,
  createSourceNoteSchema,
  deckNameSchema,
  sourceNoteContentSchema,
  sourceNoteTitleSchema,
} from "@/lib/validation/card";

function extractClozeDeletions(text: string) {
  const regex = /\{\{c\d+::(.*?)(?:::(.*?))?\}\}/g;
  const matches = [...text.matchAll(regex)];
  return matches.map((match, index) => ({
    ordinal: index,
    hiddenText: match[1] || "",
    hint: match[2] || "",
  }));
}

async function generateDeckShareId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shareId = randomBytes(16).toString("hex");
    const existingDeck = await db.deck.findUnique({ where: { shareId } });
    if (!existingDeck) {
      return shareId;
    }
  }
  throw new Error("Could not generate a unique share link. Please try again.");
}

async function requireDeckOwnership(userId: string, deckId: string) {
  const deck = await db.deck.findFirst({
    where: { id: deckId, userId, isArchived: false },
    select: { id: true },
  });
  if (!deck) {
    throw new Error("Deck not found.");
  }
}

function normalizeSourceNoteContent(content: string) {
  return content.replace(/\r\n/g, "\n").trim();
}

async function parseSourceFile(file: File) {
  if (file.size > 2_000_000) {
    throw new Error("File is too large. Keep uploads under 2MB.");
  }

  const lowerName = file.name.toLowerCase();
  const isTextLike =
    file.type === "text/plain" ||
    file.type === "text/markdown" ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md");
  const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");

  if (!isTextLike && !isPdf) {
    throw new Error("Unsupported file type. Upload .txt, .md, or .pdf files.");
  }

  const rawBuffer = await file.arrayBuffer();

  if (isPdf) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: Buffer.from(rawBuffer) });
    const parsed = await parser.getText();
    await parser.destroy();
    return normalizeSourceNoteContent(parsed.text ?? "");
  }

  return normalizeSourceNoteContent(new TextDecoder("utf-8").decode(rawBuffer));
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

export async function enableDeckSharing(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  const existingDeck = await db.deck.findFirst({
    where: { id: deckId, userId, isArchived: false },
    select: { id: true, shareId: true },
  });
  if (!existingDeck) {
    throw new Error("Deck not found.");
  }

  const shareId = existingDeck.shareId ?? (await generateDeckShareId());
  await db.deck.update({
    where: { id: existingDeck.id },
    data: {
      isShareEnabled: true,
      shareId,
    },
  });

  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/shared/${shareId}`);
}

export async function disableDeckSharing(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  const deck = await db.deck.findFirst({
    where: { id: deckId, userId },
    select: { shareId: true },
  });
  if (!deck) {
    throw new Error("Deck not found.");
  }

  await db.deck.update({
    where: { id: deckId },
    data: { isShareEnabled: false },
  });

  revalidatePath(`/decks/${deckId}`);
  if (deck.shareId) {
    revalidatePath(`/shared/${deck.shareId}`);
  }
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

export async function createSourceNote(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  await requireDeckOwnership(userId, deckId);

  const parsed = createSourceNoteSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    throw new Error("Invalid note input.");
  }

  await db.deckSourceNote.create({
    data: {
      deckId,
      title: parsed.data.title,
      content: normalizeSourceNoteContent(parsed.data.content),
    },
  });

  revalidatePath(`/decks/${deckId}`);
}

export async function uploadSourceNote(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  await requireDeckOwnership(userId, deckId);

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    throw new Error("Choose a file to upload.");
  }

  const parsedTitle = sourceNoteTitleSchema.safeParse({
    title: String(formData.get("title") || "").trim() || fileEntry.name.replace(/\.[^.]+$/, ""),
  });
  if (!parsedTitle.success) {
    throw new Error("Invalid note title.");
  }

  const content = await parseSourceFile(fileEntry);
  const parsedContent = sourceNoteContentSchema.safeParse({ content });
  if (!parsedContent.success) {
    throw new Error("Uploaded note is empty or too long.");
  }

  await db.deckSourceNote.create({
    data: {
      deckId,
      title: parsedTitle.data.title,
      content: parsedContent.data.content,
      fileName: fileEntry.name,
      mimeType: fileEntry.type || null,
    },
  });

  revalidatePath(`/decks/${deckId}`);
}

export async function updateSourceNote(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  const sourceNoteId = String(formData.get("sourceNoteId") || "");
  await requireDeckOwnership(userId, deckId);

  const parsed = createSourceNoteSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    throw new Error("Invalid note input.");
  }

  await db.deckSourceNote.updateMany({
    where: {
      id: sourceNoteId,
      deckId,
      deck: { userId },
    },
    data: {
      title: parsed.data.title,
      content: normalizeSourceNoteContent(parsed.data.content),
    },
  });

  revalidatePath(`/decks/${deckId}`);
}

export async function deleteSourceNote(formData: FormData) {
  const userId = await getRequiredUserId();
  const deckId = String(formData.get("deckId") || "");
  const sourceNoteId = String(formData.get("sourceNoteId") || "");
  await db.deckSourceNote.deleteMany({
    where: {
      id: sourceNoteId,
      deckId,
      deck: { userId },
    },
  });
  revalidatePath(`/decks/${deckId}`);
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

export async function copySharedDeck(formData: FormData) {
  const userId = await getRequiredUserId();
  const shareId = String(formData.get("shareId") || "");
  if (!shareId) {
    throw new Error("Missing share link.");
  }

  const sourceDeck = await db.deck.findFirst({
    where: {
      shareId,
      isShareEnabled: true,
      isArchived: false,
    },
    include: {
      sourceNotes: {
        orderBy: { createdAt: "asc" },
      },
      notes: {
        orderBy: { createdAt: "asc" },
      },
      cards: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!sourceDeck) {
    throw new Error("Shared deck not found.");
  }

  const now = new Date();
  const copiedDeckId = await db.$transaction(async (tx) => {
    const copiedDeck = await tx.deck.create({
      data: {
        userId,
        name: `${sourceDeck.name} (Copy)`,
      },
      select: { id: true },
    });

    const noteIdMap = new Map<string, string>();
    if (sourceDeck.sourceNotes.length > 0) {
      await tx.deckSourceNote.createMany({
        data: sourceDeck.sourceNotes.map((sourceNote) => ({
          deckId: copiedDeck.id,
          title: sourceNote.title,
          content: sourceNote.content,
          fileName: sourceNote.fileName,
          mimeType: sourceNote.mimeType,
        })),
      });
    }

    for (const note of sourceDeck.notes) {
      const createdNote = await tx.note.create({
        data: {
          deckId: copiedDeck.id,
          type: note.type,
          front: note.front,
          back: note.back,
          text: note.text,
          ...(note.extra === null ? {} : { extra: note.extra }),
        },
        select: { id: true },
      });
      noteIdMap.set(note.id, createdNote.id);
    }

    if (sourceDeck.cards.length > 0) {
      await tx.card.createMany({
        data: sourceDeck.cards.map((card) => {
          const copiedNoteId = noteIdMap.get(card.noteId);
          if (!copiedNoteId) {
            throw new Error("Could not copy cards due to missing note mapping.");
          }

          return {
            deckId: copiedDeck.id,
            noteId: copiedNoteId,
            ordinal: card.ordinal,
            front: card.front,
            back: card.back,
            state: "NEW",
            dueAt: now,
            intervalDays: 0,
            easeFactor: 2.5,
            reps: 0,
            lapses: 0,
            stepIndex: 0,
            lastReviewedAt: null,
          };
        }),
      });
    }

    return copiedDeck.id;
  });

  revalidatePath("/decks");
  redirect(`/decks/${copiedDeckId}`);
}
