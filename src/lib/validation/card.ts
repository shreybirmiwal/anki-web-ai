import { z } from "zod";

export const basicCardSchema = z.object({
  front: z.string().trim().min(1).max(500),
  back: z.string().trim().min(1).max(2000),
});

export const clozeSchema = z.object({
  text: z.string().trim().min(1).max(8000),
});

export const deckNameSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const sourceNoteTitleSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const sourceNoteContentSchema = z.object({
  content: z.string().trim().min(1).max(50_000),
});

export const createSourceNoteSchema = sourceNoteTitleSchema.merge(sourceNoteContentSchema);
