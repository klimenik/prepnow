import type { Attempt, PausedSession } from "../types";
import { ATTEMPTS_KEY, PAUSED_KEY } from "../config";

export function loadAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Attempt[]) : [];
  } catch {
    return [];
  }
}

function saveAll(attempts: Attempt[]): void {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

export function saveAttempt(attempt: Attempt): Attempt[] {
  const attempts = loadAttempts();
  attempts.unshift(attempt); // newest first
  saveAll(attempts);
  return attempts;
}

export function deleteAttempt(id: string): Attempt[] {
  const attempts = loadAttempts().filter((a) => a.id !== id);
  saveAll(attempts);
  return attempts;
}

export function clearAttempts(): void {
  saveAll([]);
}

export function exportAttempts(attempts: Attempt[]): void {
  const data = JSON.stringify(attempts, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prepnow-attempts-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Import attempts from a JSON string, merging by id (imported ones win on conflict). */
export function importAttempts(text: string): Attempt[] {
  const incoming = JSON.parse(text);
  if (!Array.isArray(incoming)) throw new Error("File is not an attempts array.");
  const byId = new Map<string, Attempt>();
  for (const a of loadAttempts()) byId.set(a.id, a);
  for (const a of incoming as Attempt[]) {
    if (a && a.id) byId.set(a.id, a);
  }
  const merged = [...byId.values()].sort((a, b) =>
    b.finishedAt.localeCompare(a.finishedAt),
  );
  saveAll(merged);
  return merged;
}

// ---------- paused sessions (one per quiz, keyed by quizId) ----------

export function loadPausedSessions(): Record<string, PausedSession> {
  try {
    const raw = localStorage.getItem(PAUSED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, PausedSession>) : {};
  } catch {
    return {};
  }
}

export function savePausedSession(session: PausedSession): void {
  const all = loadPausedSessions();
  all[session.quizId] = session;
  localStorage.setItem(PAUSED_KEY, JSON.stringify(all));
}

export function deletePausedSession(quizId: string): void {
  const all = loadPausedSessions();
  if (quizId in all) {
    delete all[quizId];
    localStorage.setItem(PAUSED_KEY, JSON.stringify(all));
  }
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
