export type StudyRating = "again" | "hard" | "good" | "easy";

export type CardPreview = {
  id: string;
  front: string;
  back: string;
  state: "NEW" | "LEARNING" | "REVIEW" | "RELEARNING" | "SUSPENDED";
  dueAt: string;
};

export type GeneratedCardDraft = {
  front: string;
  back: string;
  noteType: "BASIC" | "CLOZE";
};
