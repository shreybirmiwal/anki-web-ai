"use client";

import { useActionState, useState } from "react";
import { generateDeckQuizAction, type GeneratedQuizState } from "@/server/actions/ai-generate";

type DeckQuizGeneratorProps = {
  deckId: string;
  sourceNotes: Array<{
    id: string;
    title: string;
  }>;
};

const INITIAL_STATE: GeneratedQuizState = {};

export function DeckQuizGenerator({ deckId, sourceNotes }: DeckQuizGeneratorProps) {
  const [state, generateQuiz, isGenerating] = useActionState(generateDeckQuizAction, INITIAL_STATE);
  const [selectedSourceNoteIds, setSelectedSourceNoteIds] = useState<string[]>(() =>
    sourceNotes.map((note) => note.id),
  );

  function toggleSourceNote(sourceNoteId: string) {
    setSelectedSourceNoteIds((prev) =>
      prev.includes(sourceNoteId)
        ? prev.filter((id) => id !== sourceNoteId)
        : [...prev, sourceNoteId],
    );
  }

  return (
    <section className="card stack">
      <h2>Generate Quiz</h2>
      <p className="muted">Create an MCQ quiz using this deck&apos;s lecture notes and cards.</p>
      <form action={generateQuiz} className="stack">
        <input name="deckId" type="hidden" value={deckId} />
        {sourceNotes.length > 0 ? (
          <div className="stack">
            <p className="muted">Quiz notes scope:</p>
            {sourceNotes.map((note) => (
              <label className="row" key={note.id} style={{ alignItems: "center" }}>
                <input
                  checked={selectedSourceNoteIds.includes(note.id)}
                  name="selectedSourceNoteIds"
                  onChange={() => toggleSourceNote(note.id)}
                  type="checkbox"
                  value={note.id}
                />
                {note.title}
              </label>
            ))}
          </div>
        ) : (
          <p className="muted">No lecture notes yet. Quiz can still use existing cards.</p>
        )}
        <button className="button secondary" disabled={isGenerating} type="submit">
          {isGenerating ? "Generating Quiz..." : "Generate Quiz"}
        </button>
      </form>

      {state.error ? <p className="muted">{state.error}</p> : null}
      {state.selectedSourceNoteTitles && state.selectedSourceNoteTitles.length > 0 ? (
        <p className="muted">Included notes: {state.selectedSourceNoteTitles.join(", ")}</p>
      ) : null}

      {state.questions && state.questions.length > 0 ? (
        <div className="stack">
          {state.questions.map((question, index) => (
            <article className="card stack" key={`${question.question}-${index}`}>
              <p>
                <strong>
                  Q{index + 1}. {question.question}
                </strong>
              </p>
              <ol>
                {question.options.map((option, optionIndex) => (
                  <li key={`${option}-${optionIndex}`}>
                    {option}
                  </li>
                ))}
              </ol>
              <p className="muted">Answer: {question.options[question.correctOptionIndex]}</p>
              <p className="multiline">{question.explanation}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
