"use client";

import React, { useEffect, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useTTS } from "@/context/TTSContext"; // <- import the TTS hook
import "./settings.css";

const SettingsPage = () => {
  const { theme, language, setTheme, setLanguage } = useSettings();
  const { enabled: ttsEnabled, setEnabled: setTTSEnabled } = useTTS(); // <- use correct names

  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h1>Settings</h1>

        {/* APPEARANCE */}
        <section className="settings-section">
          <h3>Appearance</h3>
          <div className="theme-options">
            <button
              className={theme === "light" ? "active" : ""}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              className={theme === "dark" ? "active" : ""}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
            <button
              className={theme === "high-contrast" ? "active" : ""}
              onClick={() => setTheme("high-contrast")}
            >
              High Contrast
            </button>
            <button
              className={theme === "colorblind" ? "active" : ""}
              onClick={() => setTheme("colorblind")}
            >
              Colorblind Mode
            </button>
          </div>
        </section>

        {/* LANGUAGE */}
        <section className="settings-section">
          <h3>Language</h3>
          <div className="theme-options">
            <button
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
            >
              English
            </button>
            <button
              className={language === "es" ? "active" : ""}
              onClick={() => setLanguage("es")}
            >
              Español
            </button>
            <button
              className={language === "fr" ? "active" : ""}
              onClick={() => setLanguage("fr")}
            >
              Français
            </button>
            <button
              className={language === "de" ? "active" : ""}
              onClick={() => setLanguage("de")}
            >
              Deutsch
            </button>
          </div>
        </section>

        {/* TTS TOGGLE */}
        <section className="settings-section">
          <h3>Text-to-Speech</h3>
          <button
            className={ttsEnabled ? "active" : ""}
            onClick={() => setTTSEnabled(!ttsEnabled)} // <- now works
          >
            {ttsEnabled ? "Disable TTS" : "Enable TTS"}
          </button>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;