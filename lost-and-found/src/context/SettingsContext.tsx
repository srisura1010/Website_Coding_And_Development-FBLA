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

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [font, setFont] = useState<Font>("sans");
  const [language, setLanguage] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  // Load saved settings AFTER mount (prevents hydration errors)
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedLanguage = localStorage.getItem("language") as Language | null;
    const savedFont = localStorage.getItem("font") as Font | null;

    if (savedTheme) setTheme(savedTheme);
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedFont) setFont(savedFont);

    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    document.body.classList.remove(
      "light",
      "dark",
      "high-contrast",
      "colorblind"
    );

    document.body.classList.add(theme);

    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.font = font;

    localStorage.setItem("theme", theme);
    localStorage.setItem("language", language);
    localStorage.setItem("font", font);
  }, [theme, font, language, mounted]);

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <SettingsContext.Provider
      value={{ theme, font, language, setTheme, setFont, setLanguage }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
};
