import { useMemo, useState } from "react";
import type { Attempt, Quiz as QuizType, Response } from "../types";
import { isAnswerCorrect } from "../lib/grading";
import { shuffle } from "../lib/shuffle";
import { newId } from "../lib/storage";
import { Markdown } from "./Markdown";
import { ProgressBar } from "./ProgressBar";

interface Props {
  quiz: QuizType;
  sourcePath?: string;
  onFinish: (attempt: Attempt) => void;
  onExit: () => void;
}

const LETTERS = "ABCDEFGH";

export function Quiz({ quiz, sourcePath, onFinish, onExit }: Props) {
  const startedAt = useMemo(() => new Date().toISOString(), []);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  // The question reference key is hidden until revealed (double-click the prompt).
  const [showKey, setShowKey] = useState(false);

  // Present questions in a random order, shuffled once per mount (re-shuffles
  // each attempt since the component remounts when a quiz is (re)started).
  const questions = useMemo(
    () => shuffle(quiz.questions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quiz.id],
  );

  const total = questions.length;
  const question = questions[index];
  const isLast = index === total - 1;
  const correct = isAnswerCorrect(question, selected);

  // How many answers must be selected before Submit is allowed.
  const required = question.type === "single" ? 1 : question.correct.length;

  // Shuffle choices once per question (re-shuffles each attempt since the
  // component remounts when a quiz is (re)started).
  const displayChoices = useMemo(
    () => shuffle(question.choices),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question.id],
  );

  const textForKey = (key: string) =>
    question.choices.find((c) => c.key === key)?.text ?? key;
  const letterForKey = (key: string) =>
    LETTERS[displayChoices.findIndex((c) => c.key === key)] ?? "?";
  const correctLetters = question.correct.map(letterForKey).sort().join(", ");

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
    if (selected.length !== required || submitted) return;
    const sortedSelected = [...selected].sort();
    const sortedCorrect = [...question.correct].sort();
    setResponses((prev) => [
      ...prev,
      {
        questionId: question.id,
        prompt: question.prompt,
        selected: sortedSelected,
        correct: sortedCorrect,
        selectedText: sortedSelected.map(textForKey),
        correctText: sortedCorrect.map(textForKey),
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
    setShowKey(false);
  }

  function finish() {
    const correctCount = responses.filter((r) => r.isCorrect).length;
    const attempt: Attempt = {
      id: newId(),
      quizId: quiz.id,
      quizTitle: quiz.title,
      courseId: quiz.course,
      sourcePath,
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
          {showKey && (
            <span className="badge badge-key" title="Question reference key">
              {question.id}
            </span>
          )}
          {question.difficulty && (
            <span className={`badge badge-${question.difficulty}`}>
              {question.difficulty}
            </span>
          )}
          {question.type === "multi" && (
            <span className="badge badge-multi">Choose {required}</span>
          )}
        </div>

        <h2
          className="prompt"
          onDoubleClick={() => setShowKey((v) => !v)}
          title="Double-click to show the question reference key"
        >
          <Markdown text={question.prompt} />
        </h2>

        <div className="choices">
          {displayChoices.map((c, i) => (
            <button
              key={c.key}
              className={choiceClass(c.key)}
              onClick={() => toggle(c.key)}
              disabled={submitted}
            >
              <span className="choice-key">{LETTERS[i]}</span>
              <span className="choice-text">
                <Markdown text={c.text} />
              </span>
            </button>
          ))}
        </div>

        {submitted && (
          <div className={`feedback ${correct ? "ok" : "bad"}`}>
            {correct ? (
              <div className="feedback-head">✓ Correct</div>
            ) : (
              <>
                <div className="feedback-head">
                  ✗ Incorrect
                  <span className="feedback-answer">
                    {" "}
                    · Correct answer{question.correct.length > 1 ? "s" : ""}: {correctLetters}
                  </span>
                </div>
                {question.explanation && (
                  <p className="explanation">
                    <Markdown text={question.explanation} />
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="quiz-actions">
        {!submitted ? (
          <button className="btn primary" onClick={submit} disabled={selected.length !== required}>
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
