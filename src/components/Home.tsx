import { useEffect, useRef, useState } from "react";
import type { Attempt, Manifest, ManifestQuiz, Quiz } from "../types";
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
  onStartQuiz: (quiz: Quiz) => void;
  onOpenHistory: () => void;
}

export function Home({ attempts, onStartQuiz, onOpenHistory }: Props) {
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
      onStartQuiz(quiz);
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
        <div>
          <h1 className="brand">PrepNow</h1>
          <p className="tagline">Practice quizzes for your courses</p>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={onOpenHistory}>
            History{attempts.length > 0 && <span className="count">{attempts.length}</span>}
          </button>
          <button className="icon-btn" title="Settings" onClick={() => setShowSettings((s) => !s)}>
            ⚙
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
            <button
              className="btn"
              onClick={() => setBaseInput(DEFAULT_CONTENT_BASE)}
            >
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
                return (
                  <button
                    key={mq.id}
                    className="card quiz-card"
                    onClick={() => startFromManifest(mq)}
                    disabled={loadingQuizId === mq.id}
                  >
                    <span className="quiz-card-title">{mq.title}</span>
                    <span className="quiz-card-meta">
                      {mq.questionCount != null && <span>{mq.questionCount} questions</span>}
                      {best != null && (
                        <span className={`best ${best >= 80 ? "score-good" : best >= 60 ? "score-mid" : "score-bad"}`}>
                          best {best}%
                        </span>
                      )}
                    </span>
                    {loadingQuizId === mq.id && <span className="quiz-card-loading">Loading…</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}
