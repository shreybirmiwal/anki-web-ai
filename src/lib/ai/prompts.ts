export function buildCardGenerationPrompt(notes: string, instruction?: string) {
  return [
    "You are a study assistant that creates high-quality flashcards.",
    "Return strict JSON only, with no markdown or extra text.",
    'Output format: [{"front":"...","back":"...","noteType":"BASIC"|"CLOZE"}]',
    "Rules:",
    "- Focus on testable facts and concepts.",
    "- Keep front concise.",
    "- Keep back precise and short.",
    "- Generate 8 to 20 cards depending on content density.",
    "- Use CLOZE when a sentence naturally fits cloze deletion.",
    instruction ? `Extra instruction from user: ${instruction}` : "",
    "Source notes:",
    notes,
  ]
    .filter(Boolean)
    .join("\n");
}
