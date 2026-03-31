"use client";

import { useState } from "react";

type ReviewCardProps = {
  deckId: string;
  cardId: string;
  front: string;
  back: string;
  submitAction: (formData: FormData) => Promise<void>;
};

export function ReviewCard({ deckId, cardId, front, back, submitAction }: ReviewCardProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <article className="card stack">
      <h2>Question</h2>
      <p>{front}</p>
      {revealed ? (
        <>
          <div className="spacer" />
          <h3>Answer</h3>
          <p>{back}</p>
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
