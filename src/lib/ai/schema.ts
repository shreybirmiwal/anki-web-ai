import { z } from "zod";

export const generatedCardSchema = z.object({
  front: z.string().trim().min(1).max(500),
  back: z.string().trim().min(1).max(2000),
  noteType: z.enum(["BASIC", "CLOZE"]).default("BASIC"),
});

export const generatedCardsSchema = z.array(generatedCardSchema).min(1).max(60);
