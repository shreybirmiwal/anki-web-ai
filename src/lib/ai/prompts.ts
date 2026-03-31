export function buildCardGenerationPrompt(
  notes: string,
  instruction?: string,
  imageSource: "real" | "ai" | "auto" = "auto",
) {
  const includeImages = imageSource === "real" || imageSource === "ai" || imageSource === "auto";
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
      ? "- Add imagePrompt only when a visual would improve recall. Keep imagePrompt short and concrete (good for image search)."
      : "",
    includeImages ? `- Image source strategy selected by user: ${imageSource}.` : "",
    instruction ? `Extra instruction from user: ${instruction}` : "",
    "Source notes:",
    notes,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAskDeckNotesPrompt(params: {
  question: string;
  cardFront: string;
  cardBack: string;
  notesContext: string;
}) {
  const { question, cardFront, cardBack, notesContext } = params;
  return [
    "You are a study assistant answering a user's question using lecture notes.",
    "Return strict JSON only:",
    '{"answer":"...","citedNoteTitles":["Lecture 1"]}',
    "Rules:",
    "- Keep answer concise and practical for studying.",
    "- Prefer information grounded in provided lecture notes.",
    "- If notes are missing details, say so briefly.",
    "- citedNoteTitles must contain only note titles that appear in the notes context section.",
    `Card question context: ${cardFront}`,
    `Card answer context: ${cardBack}`,
    `User question: ${question}`,
    "Lecture notes context:",
    notesContext,
  ].join("\n");
}

export function buildQuizGenerationPrompt(params: {
  deckName: string;
  deckCardsContext: string;
  notesContext: string;
}) {
  const { deckName, deckCardsContext, notesContext } = params;
  return [
    "You generate MCQ quizzes for spaced repetition study.",
    "Return strict JSON only as an array of objects.",
    'Each object format: {"question":"...","options":["A","B","C","D"],"correctOptionIndex":0-3,"explanation":"..."}',
    "Rules:",
    "- Generate 8 questions.",
    "- Exactly 4 options per question.",
    "- One correct answer only.",
    "- Mix conceptual and factual questions.",
    "- Explanations should be short and teach the why.",
    `Deck name: ${deckName}`,
    "Cards context:",
    deckCardsContext,
    "Lecture notes context:",
    notesContext,
  ].join("\n");
}
