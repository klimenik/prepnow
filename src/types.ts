// Content model (mirrors the question-bank JSON schema).

export type QuestionType = "single" | "multi";
export type Difficulty = "easy" | "medium" | "hard";

export interface Choice {
  key: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  difficulty?: Difficulty;
  prompt: string;
  choices: Choice[];
  correct: string[];
  explanation?: string;
}

export interface Quiz {
  id: string;
  course?: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface ManifestQuiz {
  id: string;
  title: string;
  path: string;
  questionCount?: number;
}

export interface ManifestCourse {
  id: string;
  title: string;
  description?: string;
  coursePath?: string;
  quizzes: ManifestQuiz[];
}

export interface Manifest {
  schemaVersion?: number;
  title?: string;
  courses: ManifestCourse[];
}

// Attempt history (persisted in localStorage).

export interface Response {
  questionId: string;
  prompt: string;
  selected: string[];
  correct: string[];
  isCorrect: boolean;
}

export interface Attempt {
  id: string;
  quizId: string;
  quizTitle: string;
  courseId?: string;
  startedAt: string;
  finishedAt: string;
  total: number;
  correctCount: number;
  scorePct: number;
  responses: Response[];
}
