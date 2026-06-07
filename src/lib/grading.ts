import type { Question } from "../types";

/** True when the selected keys exactly match the question's correct keys (order-insensitive). */
export function isAnswerCorrect(question: Question, selected: string[]): boolean {
  const correct = question.correct;
  if (selected.length !== correct.length) return false;
  const a = [...selected].sort();
  const b = [...correct].sort();
  return a.every((k, i) => k === b[i]);
}

/** How many answers a multi-select question expects (for the "Choose N" hint). */
export function expectedCount(question: Question): number {
  return question.correct.length;
}
