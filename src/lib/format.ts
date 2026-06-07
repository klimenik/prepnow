// Compact, unambiguous date-time format: dd.mm.yy, HH:mm (24h).
// Chosen explicitly (independent of the OS locale) for consistent, German-style display.
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(-2)}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${date}, ${time}`;
}
