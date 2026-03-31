import { generatedCardsSchema, generatedQuizSchema } from "@/lib/ai/schema";

function extractJsonArray(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  throw new Error("AI response did not contain JSON array.");
}

export function parseGeneratedCards(raw: string) {
  const json = extractJsonArray(raw);
  const parsed = JSON.parse(json);
  return generatedCardsSchema.parse(parsed);
}

export function parseGeneratedQuiz(raw: string) {
  const json = extractJsonArray(raw);
  const parsed = JSON.parse(json);
  return generatedQuizSchema.parse(parsed);
}
