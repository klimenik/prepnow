import type { CSSProperties } from "react";
import type { Attempt } from "../types";
import { formatDateTime } from "../lib/format";
import { Markdown } from "./Markdown";

interface Props {
  attempt: Attempt;
  onRetake?: () => void;
  onHome: () => void;
  backLabel?: string;
}

function scoreClass(pct: number): string {
  if (pct >= 80) return "score-good";
  if (pct >= 60) return "score-mid";
  return "score-bad";
}

export function Results({ attempt, onRetake, onHome, backLabel = "Home" }: Props) {
  const { correctCount, total, scorePct } = attempt;
  const wrong = total - correctCount;
  const donutStyle = { ["--pct" as string]: scorePct } as CSSProperties;

  return (
    <div className="results">
      <div className="card score-card">
        <div className="donut" style={donutStyle}>
          <div className="donut-center">
            <span className={`donut-pct ${scoreClass(scorePct)}`}>{scorePct}%</span>
          </div>
        </div>
        <div className="score-detail">
          <h2>{attempt.quizTitle}</h2>
          <div className="legend">
            <span className="legend-item">
              <span className="dot dot-good" /> {correctCount} correct
            </span>
            <span className="legend-item">
              <span className="dot dot-bad" /> {wrong} wrong
            </span>
          </div>
          <p className="score-date">{formatDateTime(attempt.finishedAt)}</p>
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
            <div className="answer-rows">
              <div className="answer-row">
                <span className="answer-label">Your answer</span>
                <span className="answer-value">
                  {(r.selectedText ?? r.selected).join("; ") || "—"}
                </span>
              </div>
              {!r.isCorrect && (
                <div className="answer-row">
                  <span className="answer-label answer-label-ok">Correct answer</span>
                  <span className="answer-value">
                    {(r.correctText ?? r.correct).join("; ")}
                  </span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
