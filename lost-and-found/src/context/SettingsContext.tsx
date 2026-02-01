"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";
type Font = "sans" | "serif" | "mono";

interface SettingsContextType {
  theme: Theme;
  font: Font;
  setTheme: (t: Theme) => void;
  setFont: (f: Font) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [font, setFont] = useState<Font>("sans");

  // Apply to document
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.font = font;
  }, [theme, font]);

  return (
    <SettingsContext.Provider value={{ theme, font, setTheme, setFont }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
};
