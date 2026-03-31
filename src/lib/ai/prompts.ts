export function buildCardGenerationPrompt(notes: string, instruction?: string, includeImages?: boolean) {
  const outputFormat = includeImages
    ? '[{"front":"...","back":"...","noteType":"BASIC"|"CLOZE","imagePrompt":"optional scene description for a helpful study image"}]'
    : '[{"front":"...","back":"...","noteType":"BASIC"|"CLOZE"}]';

  return [
    "You are a study assistant that creates high-quality flashcards.",
    "Return strict JSON only, with no markdown or extra text.",
    `Output format: ${outputFormat}`,
    "Rules:",
    "- Focus on testable facts and concepts.",
    "- Keep front concise.",
    "- Keep back precise and short.",
    "- Generate 8 to 20 cards depending on content density.",
    "- Use CLOZE when a sentence naturally fits cloze deletion.",
    includeImages
      ? "- Add imagePrompt only when a visual would improve recall. Keep imagePrompt short and concrete."
      : "",
    instruction ? `Extra instruction from user: ${instruction}` : "",
    "Source notes:",
    notes,
  ]
    .filter(Boolean)
    .join("\n");
}
