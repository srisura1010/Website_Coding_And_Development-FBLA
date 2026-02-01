"use client";

import { useState } from "react";
import GoogleTranslate from "next-google-translate-widget";
import { useSettings } from "@/context/SettingsContext";

export default function SettingsPage() {
  const { theme, setTheme, font, setFont } = useSettings();

  return (
    <main style={{ padding: "2rem", fontFamily: "var(--font)" }}>
      <h1>Settings</h1>

      {/* Theme toggle */}
      <section style={{ margin: "1rem 0" }}>
        <h2>Theme</h2>
        <select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </section>

      {/* Font selector */}
      <section style={{ margin: "1rem 0" }}>
        <h2>Font</h2>
        <select value={font} onChange={(e) => setFont(e.target.value as any)}>
          <option value="sans">Sans</option>
          <option value="serif">Serif</option>
          <option value="mono">Mono</option>
        </select>
      </section>

      {/* Language / Translation widget */}
      <section style={{ margin: "1rem 0" }}>
        <h2>Language</h2>
        <GoogleTranslate
          pageLanguage="en"
          includedLanguages="en,es,fr,de,bn"
        />
      </section>
    </main>
  );
}
