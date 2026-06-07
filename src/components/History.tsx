import { useRef, useState } from "react";
import type { Attempt } from "../types";
import {
  clearAttempts,
  deleteAttempt,
  exportAttempts,
  importAttempts,
  loadAttempts,
} from "../lib/storage";
import { formatDateTime } from "../lib/format";
import { Results } from "./Results";

interface Props {
  attempts: Attempt[];
  onChange: (attempts: Attempt[]) => void;
  onExit: () => void;
  onRetake: (attempt: Attempt) => void;
}

function scoreClass(pct: number): string {
  return pct >= 80 ? "score-good" : pct >= 60 ? "score-mid" : "score-bad";
}

export function History({ attempts, onChange, onExit, onRetake }: Props) {
  const [viewing, setViewing] = useState<Attempt | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const allChecked = attempts.length > 0 && checked.size === attempts.length;

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setChecked(allChecked ? new Set() : new Set(attempts.map((a) => a.id)));
  }

  function exportSelected() {
    const chosen = attempts.filter((a) => checked.has(a.id));
    if (chosen.length) exportAttempts(chosen);
  }

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

  if (viewing) {
    return (
      <Results
        attempt={viewing}
        onRetake={() => onRetake(viewing)}
        onHome={() => setViewing(null)}
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

      <div className="actions-row history-toolbar">
        <label className="select-all">
          <input type="checkbox" checked={allChecked} onChange={toggleAll} disabled={attempts.length === 0} />
          Select all
        </label>
        <button className="btn" onClick={exportSelected} disabled={checked.size === 0}>
          Export{checked.size > 0 ? ` (${checked.size})` : ""}
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Import
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
        <button
          className="btn danger"
          disabled={attempts.length === 0}
          onClick={() => {
            if (confirm("Delete all saved attempts? This cannot be undone.")) {
              clearAttempts();
              setChecked(new Set());
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
              <input
                type="checkbox"
                className="attempt-check"
                checked={checked.has(a.id)}
                onChange={() => toggle(a.id)}
                aria-label="Select attempt"
              />
              <button className="attempt-main" onClick={() => setViewing(a)}>
                <span className="attempt-title">{a.quizTitle}</span>
                <span className="attempt-date">{formatDateTime(a.finishedAt)}</span>
              </button>
              <span className={`attempt-score ${scoreClass(a.scorePct)}`}>
                {a.scorePct}%
                <small>
                  {a.correctCount}/{a.total}
                </small>
              </span>
              <button
                className="icon-btn"
                title="Delete attempt"
                onClick={() => {
                  onChange(deleteAttempt(a.id));
                  setChecked((prev) => {
                    const next = new Set(prev);
                    next.delete(a.id);
                    return next;
                  });
                }}
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
