import { useState } from "react";
import type { Attempt, Quiz } from "./types";
import { loadAttempts, saveAttempt } from "./lib/storage";
import { Home } from "./components/Home";
import { Quiz as QuizRunner } from "./components/Quiz";
import { Results } from "./components/Results";
import { History } from "./components/History";

type View =
  | { name: "home" }
  | { name: "quiz"; quiz: Quiz }
  | { name: "results"; attempt: Attempt; quiz: Quiz }
  | { name: "history" };

export default function App() {
  const [view, setView] = useState<View>({ name: "home" });
  const [attempts, setAttempts] = useState<Attempt[]>(() => loadAttempts());

  function startQuiz(quiz: Quiz) {
    setView({ name: "quiz", quiz });
  }

  function finishQuiz(attempt: Attempt) {
    setAttempts(saveAttempt(attempt));
    const quiz = view.name === "quiz" ? view.quiz : undefined;
    setView({ name: "results", attempt, quiz: quiz! });
  }

  return (
    <div className="app">
      {view.name === "home" && (
        <Home
          attempts={attempts}
          onStartQuiz={startQuiz}
          onOpenHistory={() => setView({ name: "history" })}
        />
      )}

      {view.name === "quiz" && (
        <QuizRunner
          quiz={view.quiz}
          onFinish={finishQuiz}
          onExit={() => setView({ name: "home" })}
        />
      )}

      {view.name === "results" && (
        <Results
          attempt={view.attempt}
          onRetake={() => startQuiz(view.quiz)}
          onHome={() => setView({ name: "home" })}
        />
      )}

      {view.name === "history" && (
        <History
          attempts={attempts}
          onChange={setAttempts}
          onExit={() => setView({ name: "home" })}
        />
      )}
    </div>
  );
}
