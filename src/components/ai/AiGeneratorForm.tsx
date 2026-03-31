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
  sourceNotes: Array<{
    id: string;
    title: string;
  }>;
};

type AiGeneratorFormProps = {
  decks: DeckOption[];
};

const INITIAL_STATE: GeneratedState = {};

export function AiGeneratorForm({ decks }: AiGeneratorFormProps) {
  const [state, generateAction, isGenerating] = useActionState(generateCardsAction, INITIAL_STATE);
  const initialDeckId = state.deckId ?? "";
  const initialSelectedIds =
    state.selectedSourceNoteIds && state.selectedSourceNoteIds.length > 0
      ? state.selectedSourceNoteIds
      : decks.find((deck) => deck.id === initialDeckId)?.sourceNotes.map((note) => note.id) ?? [];
  const [editedCards, setEditedCards] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState(initialDeckId);
  const [includeDeckNotes, setIncludeDeckNotes] = useState(state.includeDeckNotes ?? true);
  const [selectedSourceNoteIds, setSelectedSourceNoteIds] = useState<string[]>(initialSelectedIds);
  const prettyCards = useMemo(() => JSON.stringify(state.cards ?? [], null, 2), [state.cards]);
  const cardsPayload = editedCards.trim() || prettyCards;
  const selectedDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeckId),
    [decks, selectedDeckId],
  );

  function toggleSourceNote(noteId: string) {
    setSelectedSourceNoteIds((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId],
    );
  }

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
        <label className="field">
          Deck (optional)
          <select
            name="deckId"
            onChange={(event) => {
              const nextDeckId = event.target.value;
              setSelectedDeckId(nextDeckId);
              const nextDeck = decks.find((deck) => deck.id === nextDeckId);
              setSelectedSourceNoteIds(nextDeck?.sourceNotes.map((note) => note.id) ?? []);
            }}
            value={selectedDeckId}
          >
            <option value="">No deck notes</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </label>
        {selectedDeck ? (
          <div className="stack">
            <label className="row" style={{ alignItems: "center" }}>
              <input
                checked={includeDeckNotes}
                name="includeDeckNotes"
                onChange={(event) => setIncludeDeckNotes(event.target.checked)}
                type="checkbox"
              />
              Include lecture notes from selected deck
            </label>
            {includeDeckNotes ? (
              <>
                <p className="muted">Select lecture notes to include in generation:</p>
                {selectedDeck.sourceNotes.length === 0 ? (
                  <p className="muted">No lecture notes found for this deck yet.</p>
                ) : (
                  <div className="stack">
                    {selectedDeck.sourceNotes.map((note) => (
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
                )}
              </>
            ) : null}
          </div>
        ) : null}
        <label className="field">
          Image source
          <select defaultValue={state.imageSource ?? "auto"} name="imageSource">
            <option value="real">Real images (Wikimedia Commons)</option>
            <option value="ai">AI generated</option>
            <option value="auto">Auto (real first, then AI fallback)</option>
          </select>
        </label>
        {state.error ? <p className="muted">{state.error}</p> : null}
        {state.selectedSourceNoteTitles && state.selectedSourceNoteTitles.length > 0 ? (
          <p className="muted">
            Included notes: {state.selectedSourceNoteTitles.join(", ")}
          </p>
        ) : null}
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
        <input type="hidden" name="imageSource" value={state.imageSource ?? "auto"} />
        <input type="hidden" name="cards" value={cardsPayload} />
        <button className="button secondary" type="submit">
          Save Generated Cards
        </button>
      </form>
    </div>
  );
}
