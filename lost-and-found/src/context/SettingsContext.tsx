"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "high-contrast" | "colorblind";
type Font = "sans" | "serif" | "mono";
type Language = "en" | "es" | "fr" | "de";

interface SettingsContextType {
  theme: Theme;
  font: Font;
  language: Language;
  setTheme: (t: Theme) => void;
  setFont: (f: Font) => void;
  setLanguage: (l: Language) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

// Read localStorage synchronously so the initial state is already correct —
// no re-render needed, no flash.
function getInitial<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return (localStorage.getItem(key) as T) || fallback;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitial("theme", "light"));
  const [font, setFontState] = useState<Font>(() => getInitial("font", "sans"));
  const [language, setLanguageState] = useState<Language>(() => getInitial("language", "en"));

  // Apply theme class to body whenever theme changes
  useEffect(() => {
    document.body.classList.remove("light", "dark", "high-contrast", "colorblind");
    document.body.classList.add(theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.dataset.font = font;
    localStorage.setItem("theme", theme);
    localStorage.setItem("language", language);
    localStorage.setItem("font", font);
  }, [theme, font, language]);

  const setTheme = (t: Theme) => setThemeState(t);
  const setFont = (f: Font) => setFontState(f);
  const setLanguage = (l: Language) => setLanguageState(l);

  // No null return — children render immediately with correct initial state
  return (
    <SettingsContext.Provider value={{ theme, font, language, setTheme, setFont, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
};