import { themeStorageKey } from "./theme-script";

export type ThemeChoice = "light" | "dark" | "system";

function readChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(themeStorageKey);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // Storage can be unavailable in private browsing.
  }
  return "system";
}

function systemIsDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyResolved(dark: boolean) {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none !important;animation-duration:0.01ms !important}",
    ),
  );
  document.head.appendChild(style);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  void document.documentElement.offsetHeight;
  window.requestAnimationFrame(() => style.remove());
}

export function setThemeChoice(next: Exclude<ThemeChoice, "system">) {
  try {
    localStorage.setItem(themeStorageKey, next);
  } catch {
    // Ignore storage failures and still update the current view.
  }
  applyResolved(next === "dark");
}

export function syncSystemTheme() {
  const choice = readChoice();
  if (choice === "light" || choice === "dark") return;
  applyResolved(systemIsDark());
}

export function toggleTheme() {
  const dark = document.documentElement.classList.contains("dark");
  setThemeChoice(dark ? "light" : "dark");
}
