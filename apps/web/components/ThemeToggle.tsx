"use client";

import { useTheme } from "./theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return <button className="icon-button" onClick={toggle} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? "☼" : "☾"}</button>;
}
