import { useState } from "react";
import type { Attempt, PausedSession, Quiz } from "./types";
import {
  deletePausedSession,
  loadAttempts,
  loadPausedSessions,
  saveAttempt,
} from "./lib/storage";
import { fetchQuiz } from "./lib/content";
import { Home } from "./components/Home";
import { Quiz as QuizRunner } from "./components/Quiz";
import { Results } from "./components/Results";
import { History } from "./components/History";
import { ThemeSelect } from "./components/ThemeSelect";

type View =
  | { name: "home" }
  | { name: "quiz"; quiz: Quiz; sourcePath?: string; resume?: PausedSession }
  | { name: "results"; attempt: Attempt; quiz?: Quiz }
  | { name: "history" };

export default function App() {
  const [view, setView] = useState<View>({ name: "home" });
  const [attempts, setAttempts] = useState<Attempt[]>(() => loadAttempts());
  const [paused, setPaused] = useState<Record<string, PausedSession>>(() =>
    loadPausedSessions(),
  );

  // Start fresh: discard any paused session for this quiz so a clean run begins.
  function startQuiz(quiz: Quiz, sourcePath?: string) {
    deletePausedSession(quiz.id);
    setPaused(loadPausedSessions());
    setView({ name: "quiz", quiz, sourcePath });
  }

  function resumeQuiz(quiz: Quiz, sourcePath: string | undefined, session: PausedSession) {
    setView({ name: "quiz", quiz, sourcePath, resume: session });
  }

  function exitQuiz() {
    setPaused(loadPausedSessions()); // pick up the auto-saved session
    setView({ name: "home" });
  }

  function finishQuiz(attempt: Attempt) {
    setAttempts(saveAttempt(attempt));
    setPaused(loadPausedSessions()); // the completed session was cleared
    const quiz = view.name === "quiz" ? view.quiz : undefined;
    setView({ name: "results", attempt, quiz });
  }

  // Retake an attempt opened from history: reload its quiz by source path.
  async function retakeAttempt(attempt: Attempt) {
    if (!attempt.sourcePath) {
      alert(
        "This quiz was loaded from a local file, so it can't be reloaded automatically. " +
          "Open it again from Settings → Load local quiz file.",
      );
      return;
    }
    try {
      const quiz = await fetchQuiz(attempt.sourcePath);
      startQuiz(quiz, attempt.sourcePath);
    } catch (e) {
      alert("Could not reload quiz: " + (e as Error).message);
    }
  }

  return (
    <div className="app">
      <div className="app-bar">
        <button className="brand-btn" onClick={() => setView({ name: "home" })}>
          PrepNow
        </button>
        <ThemeSelect />
      </div>

      {view.name === "home" && (
        <Home
          attempts={attempts}
          paused={paused}
          onStartQuiz={startQuiz}
          onResumeQuiz={resumeQuiz}
          onOpenHistory={() => setView({ name: "history" })}
        />
      )}

      {view.name === "quiz" && (
        <QuizRunner
          quiz={view.quiz}
          sourcePath={view.sourcePath}
          resume={view.resume}
          onFinish={finishQuiz}
          onExit={exitQuiz}
        />
      )}

      {view.name === "results" && (
        <Results
          attempt={view.attempt}
          onRetake={
            view.quiz
              ? () => startQuiz(view.quiz!, view.attempt.sourcePath)
              : () => retakeAttempt(view.attempt)
          }
          onHome={() => setView({ name: "home" })}
        />
      )}

      {view.name === "history" && (
        <History
          attempts={attempts}
          onChange={setAttempts}
          onExit={() => setView({ name: "home" })}
          onRetake={retakeAttempt}
        />
      )}
    </div>
  );
}
