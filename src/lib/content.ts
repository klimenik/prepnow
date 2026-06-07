import type { Manifest, Quiz } from "../types";
import { CONTENT_BASE_KEY, DEFAULT_CONTENT_BASE } from "../config";

export function getContentBase(): string {
  const stored = localStorage.getItem(CONTENT_BASE_KEY);
  const base = stored && stored.trim() ? stored.trim() : DEFAULT_CONTENT_BASE;
  return base.endsWith("/") ? base : base + "/";
}

export function setContentBase(url: string): void {
  if (url.trim()) localStorage.setItem(CONTENT_BASE_KEY, url.trim());
  else localStorage.removeItem(CONTENT_BASE_KEY);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return (await res.json()) as T;
}

export async function fetchManifest(): Promise<Manifest> {
  return fetchJson<Manifest>(getContentBase() + "manifest.json");
}

/** Fetch a quiz by its manifest-relative path. */
export async function fetchQuiz(path: string): Promise<Quiz> {
  const cleaned = path.replace(/^\//, "");
  return fetchJson<Quiz>(getContentBase() + cleaned);
}

/** Parse a locally uploaded quiz file. Throws if it doesn't look like a quiz. */
export function parseQuizFile(text: string): Quiz {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.questions) || !data.title || !data.id) {
    throw new Error("Not a valid quiz file (missing id, title, or questions).");
  }
  return data as Quiz;
}
