"use client";

import { useActionState, useMemo, useState } from "react";
import {
  generateCardsAction,
  saveGeneratedCardsAction,
  type GeneratedState,
} from "@/server/actions/ai-generate";

type DeckOption = {
  id: string;
  name: string;
};

type AiGeneratorFormProps = {
  decks: DeckOption[];
};

const INITIAL_STATE: GeneratedState = {};

export function AiGeneratorForm({ decks }: AiGeneratorFormProps) {
  const [state, generateAction, isGenerating] = useActionState(generateCardsAction, INITIAL_STATE);
  const [editedCards, setEditedCards] = useState("");
  const prettyCards = useMemo(() => JSON.stringify(state.cards ?? [], null, 2), [state.cards]);
  const cardsPayload = editedCards.trim() || prettyCards;

  return (
    <div className="grid two">
      <form className="card stack" action={generateAction}>
        <h2>Generate cards from notes</h2>
        <label className="field">
          Class Notes
          <textarea
            defaultValue={state.sourceText}
            name="sourceText"
            placeholder="Paste class notes..."
            rows={12}
          />
        </label>
        <label className="field">
          Prompt (optional)
          <input
            defaultValue={state.prompt}
            name="prompt"
            placeholder="e.g. prioritize conceptual cards for exam prep"
            type="text"
          />
        </label>
        <label className="row" style={{ alignItems: "center" }}>
          <input defaultChecked={state.includeImages ?? false} name="includeImages" type="checkbox" />
          Include AI-generated study illustrations when useful
        </label>
        {state.error ? <p className="muted">{state.error}</p> : null}
        <button className="button" disabled={isGenerating} type="submit">
          {isGenerating ? "Generating..." : "Generate Cards"}
        </button>
      </form>

      <form className="card stack" action={saveGeneratedCardsAction}>
        <h2>Preview and save</h2>
        <label className="field">
          Target Deck
          <select name="deckId" required>
            <option value="">Select a deck</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Cards JSON (editable)
          <textarea
            onChange={(event) => setEditedCards(event.target.value)}
            placeholder='[{"front":"...","back":"...","noteType":"BASIC"}]'
            rows={16}
            value={editedCards || prettyCards}
          />
        </label>
        <input type="hidden" name="includeImages" value={state.includeImages ? "true" : "false"} />
        <input type="hidden" name="cards" value={cardsPayload} />
        <button className="button secondary" type="submit">
          Save Generated Cards
        </button>
      </form>
    </div>
  );
}
