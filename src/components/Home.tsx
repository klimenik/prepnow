import { useEffect, useRef, useState } from "react";
import type { Attempt, Manifest, ManifestQuiz, PausedSession, Quiz } from "../types";
import {
  fetchManifest,
  fetchQuiz,
  getContentBase,
  parseQuizFile,
  setContentBase,
} from "../lib/content";
import { DEFAULT_CONTENT_BASE } from "../config";

interface Props {
  attempts: Attempt[];
  paused: Record<string, PausedSession>;
  onStartQuiz: (quiz: Quiz, sourcePath?: string) => void;
  onResumeQuiz: (quiz: Quiz, sourcePath: string | undefined, session: PausedSession) => void;
  onOpenHistory: () => void;
}

export function Home({ attempts, paused, onStartQuiz, onResumeQuiz, onOpenHistory }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingQuizId, setLoadingQuizId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [baseInput, setBaseInput] = useState(getContentBase());
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    setError(null);
    fetchManifest()
      .then((m) => setManifest(m))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function bestScore(quizId: string): number | null {
    const scores = attempts.filter((a) => a.quizId === quizId).map((a) => a.scorePct);
    return scores.length ? Math.max(...scores) : null;
  }

  async function startFromManifest(mq: ManifestQuiz) {
    setLoadingQuizId(mq.id);
    try {
      const quiz = await fetchQuiz(mq.path);
      onStartQuiz(quiz, mq.path);
    } catch (e) {
      alert("Could not load quiz: " + (e as Error).message);
    } finally {
      setLoadingQuizId(null);
    }
  }

  async function resumeFromManifest(mq: ManifestQuiz, session: PausedSession) {
    setLoadingQuizId(mq.id);
    try {
      const quiz = await fetchQuiz(mq.path);
      onResumeQuiz(quiz, mq.path, session);
    } catch (e) {
      alert("Could not load quiz: " + (e as Error).message);
    } finally {
      setLoadingQuizId(null);
    }
  }

  function handleLocalFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        onStartQuiz(parseQuizFile(text));
      } catch (err) {
        alert("Invalid quiz file: " + (err as Error).message);
      }
    });
    e.target.value = "";
  }

  function saveSettings() {
    setContentBase(baseInput === DEFAULT_CONTENT_BASE ? "" : baseInput);
    setShowSettings(false);
    load();
  }

  return (
    <div className="home">
      <header className="home-header">
        <p className="tagline">Practice quizzes for your courses</p>
        <div className="header-actions">
          <button className="btn" onClick={onOpenHistory}>
            History{attempts.length > 0 && <span className="count">{attempts.length}</span>}
          </button>
          <button className="btn" onClick={() => setShowSettings((s) => !s)}>
            Settings
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="card settings">
          <label className="field-label">Content source URL</label>
          <input
            className="text-input"
            value={baseInput}
            onChange={(e) => setBaseInput(e.target.value)}
            placeholder={DEFAULT_CONTENT_BASE}
          />
          <div className="actions-row">
            <button className="btn primary" onClick={saveSettings}>
              Save & reload
            </button>
            <button className="btn" onClick={() => setBaseInput(DEFAULT_CONTENT_BASE)}>
              Reset to default
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              Load local quiz file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleLocalFile}
            />
          </div>
        </div>
      )}

      {loading && <p className="empty">Loading courses…</p>}

      {error && (
        <div className="card error-card">
          <p>Couldn’t load the question bank.</p>
          <code className="error-msg">{error}</code>
          <div className="actions-row">
            <button className="btn primary" onClick={load}>
              Retry
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              Load local quiz file instead
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleLocalFile}
            />
          </div>
        </div>
      )}

      {manifest &&
        manifest.courses.map((course) => (
          <section key={course.id} className="course">
            <h2 className="course-title">{course.title}</h2>
            {course.description && <p className="course-desc">{course.description}</p>}
            <div className="quiz-grid">
              {course.quizzes.map((mq) => {
                const best = bestScore(mq.id);
                const session = paused[mq.id];
                const isLoading = loadingQuizId === mq.id;
                const bestClass =
                  best == null
                    ? ""
                    : best >= 80
                      ? "score-good"
                      : best >= 60
                        ? "score-mid"
                        : "score-bad";
                const meta = (
                  <span className="quiz-card-meta">
                    {mq.questionCount != null && <span>{mq.questionCount} questions</span>}
                    {best != null && <span className={`best ${bestClass}`}>best {best}%</span>}
                  </span>
                );

                // A paused session shows Resume + Restart; otherwise the whole
                // card is a single Start button (existing behaviour).
                if (session) {
                  const done = session.responses.length;
                  return (
                    <div key={mq.id} className="card quiz-card">
                      <span className="quiz-card-title">{mq.title}</span>
                      {meta}
                      <span className="quiz-card-paused">
                        Paused · {done}
                        {mq.questionCount != null ? `/${mq.questionCount}` : ""} answered
                      </span>
                      <div className="quiz-card-actions">
                        <button
                          className="btn primary"
                          onClick={() => resumeFromManifest(mq, session)}
                          disabled={isLoading}
                        >
                          Resume
                        </button>
                        <button
                          className="btn"
                          onClick={() => startFromManifest(mq)}
                          disabled={isLoading}
                        >
                          Restart
                        </button>
                      </div>
                      {isLoading && <span className="quiz-card-loading">Loading…</span>}
                    </div>
                  );
                }

                return (
                  <button
                    key={mq.id}
                    className="card quiz-card"
                    onClick={() => startFromManifest(mq)}
                    disabled={isLoading}
                  >
                    <span className="quiz-card-title">{mq.title}</span>
                    {meta}
                    {isLoading && <span className="quiz-card-loading">Loading…</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

      <footer className="home-footer">
        Independent study tool. Not affiliated with or endorsed by ServiceNow, Inc.
        Trademarks belong to their respective owners.
      </footer>
    </div>
  );
}
