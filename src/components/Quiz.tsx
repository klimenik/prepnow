import { useMemo, useState } from "react";
import type { Attempt, Quiz as QuizType, Response } from "../types";
import { isAnswerCorrect } from "../lib/grading";
import { newId } from "../lib/storage";
import { Markdown } from "./Markdown";
import { ProgressBar } from "./ProgressBar";

interface Props {
  quiz: QuizType;
  onFinish: (attempt: Attempt) => void;
  onExit: () => void;
}

export function Quiz({ quiz, onFinish, onExit }: Props) {
  const startedAt = useMemo(() => new Date().toISOString(), []);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);

  const total = quiz.questions.length;
  const question = quiz.questions[index];
  const isLast = index === total - 1;
  const correct = isAnswerCorrect(question, selected);

  function toggle(key: string) {
    if (submitted) return;
    if (question.type === "single") {
      setSelected([key]);
    } else {
      setSelected((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
    }
  }

  function submit() {
    if (selected.length === 0 || submitted) return;
    setResponses((prev) => [
      ...prev,
      {
        questionId: question.id,
        prompt: question.prompt,
        selected: [...selected].sort(),
        correct: [...question.correct].sort(),
        isCorrect: correct,
      },
    ]);
    setSubmitted(true);
  }

  function next() {
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => i + 1);
    setSelected([]);
    setSubmitted(false);
  }

  function finish() {
    const correctCount = responses.filter((r) => r.isCorrect).length;
    const attempt: Attempt = {
      id: newId(),
      quizId: quiz.id,
      quizTitle: quiz.title,
      courseId: quiz.course,
      startedAt,
      finishedAt: new Date().toISOString(),
      total,
      correctCount,
      scorePct: total > 0 ? Math.round((correctCount / total) * 100) : 0,
      responses,
    };
    onFinish(attempt);
  }

  function choiceClass(key: string): string {
    const isSel = selected.includes(key);
    if (!submitted) return isSel ? "choice selected" : "choice";
    const isCorrect = question.correct.includes(key);
    if (isCorrect) return "choice correct";
    if (isSel) return "choice wrong";
    return "choice";
  }

  return (
    <div className="quiz">
      <div className="quiz-top">
        <button className="link-btn" onClick={onExit}>
          ← Exit
        </button>
        <span className="quiz-title">{quiz.title}</span>
      </div>

      <ProgressBar current={index} total={total} />

      <div className="card question-card">
        <div className="question-meta">
          {question.difficulty && (
            <span className={`badge badge-${question.difficulty}`}>
              {question.difficulty}
            </span>
          )}
          {question.type === "multi" && (
            <span className="badge badge-multi">
              Choose {question.correct.length}
            </span>
          )}
        </div>

        <h2 className="prompt">
          <Markdown text={question.prompt} />
        </h2>

        <div className="choices">
          {question.choices.map((c) => (
            <button
              key={c.key}
              className={choiceClass(c.key)}
              onClick={() => toggle(c.key)}
              disabled={submitted}
            >
              <span className="choice-key">{c.key}</span>
              <span className="choice-text">
                <Markdown text={c.text} />
              </span>
            </button>
          ))}
        </div>

        {submitted && (
          <div className={`feedback ${correct ? "ok" : "bad"}`}>
            <div className="feedback-head">
              {correct ? "✓ Correct" : "✗ Incorrect"}
              {!correct && (
                <span className="feedback-answer">
                  {" "}
                  · Correct answer: {question.correct.join(", ")}
                </span>
              )}
            </div>
            {question.explanation && (
              <p className="explanation">
                <Markdown text={question.explanation} />
              </p>
            )}
          </div>
        )}
      </div>

      <div className="quiz-actions">
        {!submitted ? (
          <button
            className="btn primary"
            onClick={submit}
            disabled={selected.length === 0}
          >
            Submit
          </button>
        ) : (
          <button className="btn primary" onClick={next}>
            {isLast ? "See results" : "Next question →"}
          </button>
        )}
      </div>
    </div>
  );
}
