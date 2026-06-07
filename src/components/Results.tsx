import type { Attempt } from "../types";
import { Markdown } from "./Markdown";

interface Props {
  attempt: Attempt;
  // When shown right after finishing a quiz:
  onRetake?: () => void;
  onHome: () => void;
  // Label for the secondary button (default "Home").
  backLabel?: string;
}

function scoreClass(pct: number): string {
  if (pct >= 80) return "score-good";
  if (pct >= 60) return "score-mid";
  return "score-bad";
}

export function Results({ attempt, onRetake, onHome, backLabel = "Home" }: Props) {
  const { correctCount, total, scorePct } = attempt;
  return (
    <div className="results">
      <div className="card score-card">
        <div className={`score-ring ${scoreClass(scorePct)}`}>
          <span className="score-pct">{scorePct}%</span>
        </div>
        <div className="score-detail">
          <h2>{attempt.quizTitle}</h2>
          <p className="score-line">
            {correctCount} / {total} correct
          </p>
          <p className="score-date">
            {new Date(attempt.finishedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="actions-row">
        {onRetake && (
          <button className="btn primary" onClick={onRetake}>
            Retake quiz
          </button>
        )}
        <button className="btn" onClick={onHome}>
          {backLabel}
        </button>
      </div>

      <h3 className="breakdown-title">Question breakdown</h3>
      <ol className="breakdown">
        {attempt.responses.map((r, i) => (
          <li key={r.questionId} className={`card breakdown-item ${r.isCorrect ? "ok" : "bad"}`}>
            <div className="breakdown-head">
              <span className="breakdown-num">Q{i + 1}</span>
              <span className={`pill ${r.isCorrect ? "pill-ok" : "pill-bad"}`}>
                {r.isCorrect ? "Correct" : "Incorrect"}
              </span>
            </div>
            <p className="breakdown-prompt">
              <Markdown text={r.prompt} />
            </p>
            <p className="breakdown-answers">
              <span>Your answer: <strong>{r.selected.join(", ") || "—"}</strong></span>
              {!r.isCorrect && (
                <span> · Correct: <strong>{r.correct.join(", ")}</strong></span>
              )}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
