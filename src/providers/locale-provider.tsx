"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type Locale = "en" | "tr";
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void } | null>(null);
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("codedna-locale-change", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("codedna-locale-change", callback); };
};
const getSnapshot = (): Locale => {
  try { return window.localStorage.getItem("codedna-locale") === "tr" ? "tr" : "en"; }
  catch { return "en"; }
};
const getServerSnapshot = (): Locale => "en";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setLocale = (next: Locale) => {
    try { window.localStorage.setItem("codedna-locale", next); } catch { /* Language still changes for this view. */ }
    document.documentElement.lang = next;
    window.dispatchEvent(new Event("codedna-locale-change"));
  };
  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  const { locale, setLocale } = context;
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  return { locale, setLocale, t };
}
