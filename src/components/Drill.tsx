import { useEffect, useMemo, useState } from "react";
import type { Attempt, Difficulty, ManifestCourse, PausedSession, Quiz } from "../types";
import {
  DIFFICULTIES,
  buildDrillQuiz,
  loadCoursePool,
  selectDrillQuestions,
  type DrillScope,
  type PoolQuestion,
} from "../lib/drill";

interface Props {
  course: ManifestCourse;
  attempts: Attempt[];
  /** A paused drill, if one is in progress. */
  paused?: PausedSession;
  pausedQuiz?: Quiz | null;
  onStart: (quiz: Quiz) => void;
  onResume: (quiz: Quiz, session: PausedSession) => void;
}

const SCOPES: { value: DrillScope; label: string; hint: string }[] = [
  { value: "missed", label: "Missed — still unresolved", hint: "Last answer was wrong" },
  { value: "missed-ever", label: "Missed — ever", hint: "Wrong at least once" },
  { value: "unseen", label: "Not yet seen", hint: "Never answered" },
  { value: "all", label: "All questions", hint: "The whole bank" },
];

const LENGTHS = [10, 20, 30, 50, 0];

interface Preset {
  label: string;
  scope: DrillScope;
  difficulties: Difficulty[];
  limit: number;
}

const PRESETS: Preset[] = [
  { label: "Review misses", scope: "missed", difficulties: DIFFICULTIES, limit: 0 },
  { label: "Hard exam · 30", scope: "all", difficulties: ["medium", "hard"], limit: 30 },
  { label: "Fresh 30", scope: "unseen", difficulties: DIFFICULTIES, limit: 30 },
];

export function Drill({ course, attempts, paused, pausedQuiz, onStart, onResume }: Props) {
  const [pool, setPool] = useState<PoolQuestion[] | null>(null);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [scope, setScope] = useState<DrillScope>("missed");
  const [difficulties, setDifficulties] = useState<Difficulty[]>(DIFFICULTIES);
  const [limit, setLimit] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadCoursePool(course)
      .then((p) => {
        if (cancelled) return;
        if (p.length === 0) setPoolError("No questions could be loaded.");
        setPool(p);
      })
      .catch((e) => !cancelled && setPoolError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [course]);

  // Everything matching the current filters, before the length cap is applied.
  const matching = useMemo(
    () =>
      pool
        ? selectDrillQuestions(pool, attempts, { scope, difficulties, limit: 0 })
        : [],
    [pool, attempts, scope, difficulties],
  );

  const available = matching.length;
  const sessionSize = limit > 0 ? Math.min(limit, available) : available;

  function toggleDifficulty(d: Difficulty) {
    setDifficulties((prev) =>
      prev.includes(d)
        ? prev.length > 1
          ? prev.filter((x) => x !== d) // never leave the filter empty
          : prev
        : DIFFICULTIES.filter((x) => prev.includes(x) || x === d),
    );
  }

  function applyPreset(p: Preset) {
    setScope(p.scope);
    setDifficulties(p.difficulties);
    setLimit(p.limit);
  }

  function start() {
    if (!pool || available === 0) return;
    const questions = selectDrillQuestions(pool, attempts, { scope, difficulties, limit });
    const scopeLabel = SCOPES.find((s) => s.value === scope)?.label ?? scope;
    onStart(buildDrillQuiz(questions, course.id, scopeLabel));
  }

  const resumable = paused && pausedQuiz;

  return (
    <section className="course drill">
      <h2 className="course-title">Practice drill</h2>
      <p className="course-desc">
        Build a session from the whole bank at once — the questions you got wrong, the ones you
        haven’t seen yet, or a harder-than-average mock exam.
      </p>

      <div className="card drill-card">
        {resumable && (
          <div className="drill-resume">
            <span>
              Paused drill · {paused!.responses.length}/{pausedQuiz!.questions.length} answered
            </span>
            <button className="btn primary" onClick={() => onResume(pausedQuiz!, paused!)}>
              Resume drill
            </button>
          </div>
        )}

        <div className="drill-presets">
          {PRESETS.map((p) => (
            <button key={p.label} className="btn" onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="drill-controls">
          <div className="drill-field">
            <label className="field-label" htmlFor="drill-scope">
              Questions
            </label>
            <select
              id="drill-scope"
              className="text-input"
              value={scope}
              onChange={(e) => setScope(e.target.value as DrillScope)}
            >
              {SCOPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="drill-field">
            <span className="field-label">Difficulty</span>
            <div className="drill-chips">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  className={`chip${difficulties.includes(d) ? " on" : ""}`}
                  onClick={() => toggleDifficulty(d)}
                  aria-pressed={difficulties.includes(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="drill-field">
            <label className="field-label" htmlFor="drill-length">
              Length
            </label>
            <select
              id="drill-length"
              className="text-input"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {LENGTHS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "All matching" : `${n} questions`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="drill-footer">
          <span className="drill-count">
            {poolError
              ? poolError
              : pool == null
                ? "Loading question bank…"
                : available === 0
                  ? "No questions match these filters."
                  : `${sessionSize} question${sessionSize === 1 ? "" : "s"}` +
                    (limit > 0 && available > limit ? ` (${available} match)` : "") +
                    ` · from ${pool.length} in the bank`}
          </span>
          <button
            className="btn primary"
            onClick={start}
            disabled={pool == null || available === 0}
          >
            Start drill
          </button>
        </div>
      </div>
    </section>
  );
}
