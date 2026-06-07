export type Theme = "system" | "light" | "dark";

const THEME_KEY = "prepnow.theme";

export function getTheme(): Theme {
  const t = localStorage.getItem(THEME_KEY);
  return t === "light" || t === "dark" ? t : "system";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function setTheme(theme: Theme): void {
  if (theme === "system") localStorage.removeItem(THEME_KEY);
  else localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

/** Order used when cycling the theme toggle. */
export function nextTheme(theme: Theme): Theme {
  return theme === "system" ? "light" : theme === "light" ? "dark" : "system";
}
