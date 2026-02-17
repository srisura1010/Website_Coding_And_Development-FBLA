"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";
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
  const [theme, setTheme] = useState<Theme>("dark");
  const [font, setFont] = useState<Font>("sans");
  const [language, setLanguage] = useState<Language>("en");

  // Load saved settings on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedLanguage = localStorage.getItem("language") as Language | null;
    
    if (savedTheme) setTheme(savedTheme);
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  // Apply theme to document
  useEffect(() => {
  // Remove all possible theme classes first
  document.body.classList.remove("light", "dark", "high-contrast", "colorblind");

  // Add the currently selected theme
  document.body.classList.add(theme);

  // Update dataset attributes
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.font = font;

  // Save theme & language to localStorage
  localStorage.setItem("theme", theme);
  localStorage.setItem("language", language);
}, [theme, font, language]);


  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

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