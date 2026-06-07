import { useState } from "react";
import { getTheme, setTheme, type Theme } from "../lib/theme";

export function ThemeSelect() {
  const [theme, setThemeState] = useState<Theme>(getTheme());
  function change(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Theme;
    setTheme(next);
    setThemeState(next);
  }
  return (
    <label className="theme-select" title="Appearance">
      <select value={theme} onChange={change} aria-label="Appearance">
        <option value="system">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
