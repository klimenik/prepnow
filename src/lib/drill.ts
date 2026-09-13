import type { Attempt, Difficulty, ManifestCourse, Question, Quiz } from "../types";
import { fetchQuiz } from "./content";
import { shuffle } from "./shuffle";

/** A question from the course-wide pool, tagged with the quiz it came from. */
export interface PoolQuestion extends Question {
  sourceQuizId: string;
  sourceQuizTitle: string;
}

/** Prompts identify a question across quizzes: ids are only unique within a file. */
function promptKey(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Load every question of a course into one pool, deduped by prompt.
 *
 * Quizzes may legitimately share questions (mock exams are assembled from the
 * module quizzes), so the same question can appear several times; the first
 * occurrence in manifest order wins. Ids are namespaced with the source quiz
 * because `q1` exists in nearly every file and a drill mixes files together.
 * Quizzes that fail to load are skipped rather than failing the whole pool.
 */
export async function loadCoursePool(course: ManifestCourse): Promise<PoolQuestion[]> {
  const loaded = await Promise.all(
    course.quizzes.map(async (mq) => {
      try {
        return { mq, quiz: await fetchQuiz(mq.path) };
      } catch {
        return null;
      }
    }),
  );

  const byPrompt = new Map<string, PoolQuestion>();
  for (const entry of loaded) {
    if (!entry) continue;
    for (const q of entry.quiz.questions) {
      const key = promptKey(q.prompt);
      if (byPrompt.has(key)) continue;
      byPrompt.set(key, {
        ...q,
        id: `${entry.mq.id}/${q.id}`,
        sourceQuizId: entry.mq.id,
        sourceQuizTitle: entry.mq.title,
      });
    }
  }
  return [...byPrompt.values()];
}

export type DrillScope = "missed" | "missed-ever" | "unseen" | "all";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export interface DrillOptions {
  scope: DrillScope;
  difficulties: Difficulty[];
  /** Cap on the number of questions; 0 means no cap. */
  limit: number;
}

interface PromptStats {
  /** Outcome of the most recent answer to this prompt. */
  lastCorrect: boolean;
  everWrong: boolean;
}

/**
 * Fold the whole attempt history into a per-prompt verdict. Attempts are stored
 * newest-first, so they are replayed oldest-first to let the latest answer win.
 */
function statsByPrompt(attempts: Attempt[]): Map<string, PromptStats> {
  const stats = new Map<string, PromptStats>();
  const oldestFirst = [...attempts].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
  for (const attempt of oldestFirst) {
    for (const r of attempt.responses) {
      const key = promptKey(r.prompt);
      const prev = stats.get(key);
      stats.set(key, {
        lastCorrect: r.isCorrect,
        everWrong: (prev?.everWrong ?? false) || !r.isCorrect,
      });
    }
  }
  return stats;
}

/** Select the questions a drill should contain, in random order. */
export function selectDrillQuestions(
  pool: PoolQuestion[],
  attempts: Attempt[],
  { scope, difficulties, limit }: DrillOptions,
): PoolQuestion[] {
  const stats = statsByPrompt(attempts);

  const matches = pool.filter((q) => {
    if (q.difficulty && !difficulties.includes(q.difficulty)) return false;
    const s = stats.get(promptKey(q.prompt));
    switch (scope) {
      case "missed":
        return s != null && !s.lastCorrect;
      case "missed-ever":
        return s != null && s.everWrong;
      case "unseen":
        return s == null;
      case "all":
        return true;
    }
  });

  const ordered = shuffle(matches);
  return limit > 0 ? ordered.slice(0, limit) : ordered;
}

/** Drills are per course, so each course gets its own resumable slot. */
export function drillQuizId(courseId: string): string {
  return `drill:${courseId}`;
}

/** Wrap selected questions in a Quiz the normal runner can play. */
export function buildDrillQuiz(
  questions: PoolQuestion[],
  courseId: string,
  label: string,
): Quiz {
  return {
    id: drillQuizId(courseId),
    course: courseId,
    title: `Drill · ${label}`,
    description: `${questions.length} questions assembled from the ${courseId.toUpperCase()} question bank.`,
    questions,
  };
}
