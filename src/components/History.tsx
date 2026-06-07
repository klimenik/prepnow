import { useRef, useState } from "react";
import type { Attempt } from "../types";
import {
  clearAttempts,
  deleteAttempt,
  exportAttempts,
  importAttempts,
  loadAttempts,
} from "../lib/storage";
import { Results } from "./Results";

interface Props {
  attempts: Attempt[];
  onChange: (attempts: Attempt[]) => void;
  onExit: () => void;
}

export function History({ attempts, onChange, onExit }: Props) {
  const [selected, setSelected] = useState<Attempt | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        onChange(importAttempts(text));
      } catch (err) {
        alert("Import failed: " + (err as Error).message);
      }
    });
    e.target.value = "";
  }

  if (selected) {
    return (
      <Results
        attempt={selected}
        onHome={() => setSelected(null)}
        backLabel="← Back to history"
      />
    );
  }

  return (
    <div className="history">
      <div className="quiz-top">
        <button className="link-btn" onClick={onExit}>
          ← Home
        </button>
        <span className="quiz-title">Attempt history</span>
      </div>

      <div className="actions-row">
        <button className="btn" onClick={exportAttempts} disabled={attempts.length === 0}>
          Export
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleImport}
        />
        <button
          className="btn danger"
          disabled={attempts.length === 0}
          onClick={() => {
            if (confirm("Delete all saved attempts? This cannot be undone.")) {
              clearAttempts();
              onChange(loadAttempts());
            }
          }}
        >
          Clear all
        </button>
      </div>

      {attempts.length === 0 ? (
        <p className="empty">No attempts yet. Take a quiz to build your history.</p>
      ) : (
        <ul className="attempt-list">
          {attempts.map((a) => (
            <li key={a.id} className="card attempt-row">
              <button className="attempt-main" onClick={() => setSelected(a)}>
                <span className="attempt-title">{a.quizTitle}</span>
                <span className="attempt-date">
                  {new Date(a.finishedAt).toLocaleString()}
                </span>
              </button>
              <span className={`attempt-score ${a.scorePct >= 80 ? "score-good" : a.scorePct >= 60 ? "score-mid" : "score-bad"}`}>
                {a.scorePct}%
                <small>
                  {a.correctCount}/{a.total}
                </small>
              </span>
              <button
                className="icon-btn"
                title="Delete attempt"
                onClick={() => onChange(deleteAttempt(a.id))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
