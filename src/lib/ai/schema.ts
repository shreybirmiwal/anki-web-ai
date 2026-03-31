import { z } from "zod";

export const generatedCardSchema = z.object({
  front: z.string().trim().min(1).max(500),
  back: z.string().trim().min(1).max(2000),
  noteType: z.enum(["BASIC", "CLOZE"]).default("BASIC"),
  imagePrompt: z.string().trim().min(1).max(500).optional(),
  imageUrl: z.string().trim().min(1).max(2_000_000).optional(),
  imageAttribution: z
    .object({
      source: z.enum(["wikimedia", "ai"]),
      author: z.string().trim().min(1).max(500).optional(),
      license: z.string().trim().min(1).max(200).optional(),
      sourceUrl: z.string().trim().min(1).max(2_000_000).optional(),
    })
    .optional(),
});

export const generatedCardsSchema = z.array(generatedCardSchema).min(1).max(60);

export const askDeckNotesResponseSchema = z.object({
  answer: z.string().trim().min(1).max(2_000),
  citedNoteTitles: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
});

export const quizQuestionSchema = z.object({
  question: z.string().trim().min(1).max(500),
  options: z.array(z.string().trim().min(1).max(240)).length(4),
  correctOptionIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1).max(1_000),
});

export const generatedQuizSchema = z.array(quizQuestionSchema).min(3).max(20);
