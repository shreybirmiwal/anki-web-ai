"use client";

import { useActionState } from "react";
import Image from "next/image";
import { useState } from "react";
import type { AskDeckNotesState } from "@/server/actions/review";

type ReviewCardProps = {
  deckId: string;
  cardId: string;
  front: string;
  back: string;
  imageUrl?: string;
  submitAction: (formData: FormData) => Promise<void>;
  updateCardAction: (formData: FormData) => Promise<void>;
  enhanceWithAiAction: (formData: FormData) => Promise<void>;
  askDeckNotesAction: (_prevState: AskDeckNotesState, formData: FormData) => Promise<AskDeckNotesState>;
};

export function ReviewCard({
  deckId,
  cardId,
  front,
  back,
  imageUrl,
  submitAction,
  updateCardAction,
  enhanceWithAiAction,
  askDeckNotesAction,
}: ReviewCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [askState, askAction, isAsking] = useActionState(askDeckNotesAction, {});

  return (
    <article className="card stack">
      <h2>Question</h2>
      <p className="multiline">{front}</p>
      {imageUrl ? (
        <Image
          alt="Study illustration"
          className="card-image"
          height={1024}
          src={imageUrl}
          unoptimized
          width={1024}
        />
      ) : null}
      {revealed ? (
        <>
          <div className="spacer" />
          <h3>Answer</h3>
          <p className="multiline">{back}</p>
          <div className="row">
            <button className="button secondary" onClick={() => setEditing((state) => !state)} type="button">
              {editing ? "Close Edit" : "Edit"}
            </button>
          </div>

          {editing ? (
            <section className="card stack">
              <h3>Edit This Card</h3>
              <form action={updateCardAction} className="stack">
                <input type="hidden" name="deckId" value={deckId} />
                <input type="hidden" name="cardId" value={cardId} />
                <label className="field">
                  Front
                  <textarea defaultValue={front} name="front" required rows={3} />
                </label>
                <label className="field">
                  Back
                  <textarea defaultValue={back} name="back" required rows={5} />
                </label>
                <button className="button secondary" type="submit">
                  Save Manual Edits
                </button>
              </form>

              <form action={enhanceWithAiAction} className="stack">
                <input type="hidden" name="deckId" value={deckId} />
                <input type="hidden" name="cardId" value={cardId} />
                <label className="field">
                  AI Instruction
                  <textarea
                    name="instruction"
                    placeholder="Example: add a mnemonic and one real-world example to the answer. This will be appended, not rewritten."
                    required
                    rows={3}
                  />
                </label>
                <button className="button" type="submit">
                  AI Add to Card
                </button>
              </form>

              <form action={askAction} className="stack">
                <input type="hidden" name="deckId" value={deckId} />
                <input type="hidden" name="cardId" value={cardId} />
                <label className="field">
                  Ask AI (query lecture notes)
                  <textarea
                    defaultValue={askState.question}
                    name="question"
                    placeholder="Ask about this card using your deck notes. Example: how does this connect to Lecture 2?"
                    required
                    rows={3}
                  />
                </label>
                <button className="button secondary" disabled={isAsking} type="submit">
                  {isAsking ? "Asking..." : "Ask AI"}
                </button>
                {askState.error ? <p className="muted">{askState.error}</p> : null}
                {askState.answer ? (
                  <div className="stack">
                    <p className="multiline">{askState.answer}</p>
                    {askState.citedNoteTitles && askState.citedNoteTitles.length > 0 ? (
                      <p className="muted">Referenced notes: {askState.citedNoteTitles.join(", ")}</p>
                    ) : null}
                  </div>
                ) : null}
              </form>
            </section>
          ) : null}

          <form action={submitAction} className="row">
            <input type="hidden" name="deckId" value={deckId} />
            <input type="hidden" name="cardId" value={cardId} />
            <button className="button danger" name="rating" value="again" type="submit">
              Again
            </button>
            <button className="button secondary" name="rating" value="hard" type="submit">
              Hard
            </button>
            <button className="button secondary" name="rating" value="good" type="submit">
              Good
            </button>
            <button className="button" name="rating" value="easy" type="submit">
              Easy
            </button>
          </form>
        </>
      ) : (
        <button className="button" onClick={() => setRevealed(true)} type="button">
          Show Answer
        </button>
      )}
    </article>
  );
}
