"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "high-contrast" | "colorblind";

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: "dark",
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    // Sync body class
    document.body.classList.remove("light", "dark", "high-contrast", "colorblind");
    document.body.classList.add(theme);

    // Sync html data-theme + class (used by the instant CSS in layout <head>)
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.remove("light", "dark", "high-contrast", "colorblind");
    document.documentElement.classList.add(theme);

    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {!mounted ? <ThemedLoader /> : children}
    </ThemeContext.Provider>
  );
};

function ThemedLoader() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      // background is already correct from the <head> styles — just needs to be transparent
      background: "transparent",
      zIndex: 9999,
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "3.5px solid var(--border-default, #1e2d45)",
        borderTopColor: "var(--accent, #7c3aed)",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export const useTheme = () => useContext(ThemeContext);