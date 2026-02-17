"use client";

import React, { useEffect, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import "./settings.css";

const SettingsPage = () => {
  const {
    theme,
    language,
    setTheme,
    setLanguage,
  } = useSettings();

  /* ------------------ TEXT STATE ------------------ */

  const [settingsText, setSettingsText] = useState("Settings");
  const [appearanceText, setAppearanceText] = useState("Appearance");
  const [lightText, setLightText] = useState("Light");
  const [darkText, setDarkText] = useState("Dark");
  const [highContrastText, setHighContrastText] = useState("High Contrast");
  const [colorblindText, setColorblindText] = useState("Colorblind Mode");
  const [languageText, setLanguageText] = useState("Language");

  /* ------------------ TRANSLATION EFFECT ------------------ */

  useEffect(() => {
    if (language === "en") {
      setSettingsText("Settings");
      setAppearanceText("Appearance");
      setLightText("Light");
      setDarkText("Dark");
      setHighContrastText("High Contrast");
      setColorblindText("Colorblind Mode");
      setLanguageText("Language");
      return;
    }

    const translateAndCache = async () => {
      const translations = [
        { key: "Settings", setter: setSettingsText },
        { key: "Appearance", setter: setAppearanceText },
        { key: "Light", setter: setLightText },
        { key: "Dark", setter: setDarkText },
        { key: "High Contrast", setter: setHighContrastText },
        { key: "Colorblind Mode", setter: setColorblindText },
        { key: "Language", setter: setLanguageText },
      ];

      for (const { key, setter } of translations) {
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: key, target: language }),
          });

          if (res.ok) {
            const data = await res.json();
            setter(data.translatedText || key);
          }
        } catch {}
      }
    };

    translateAndCache();
  }, [language]);

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h1>{settingsText}</h1>

        {/* APPEARANCE SECTION */}
        <section className="settings-section">
          <h3>{appearanceText}</h3>
          <div className="theme-options">
            
            <button
              className={theme === "light" ? "active" : ""}
              onClick={() => setTheme("light")}
            >
              {lightText}
            </button>

            <button
              className={theme === "dark" ? "active" : ""}
              onClick={() => setTheme("dark")}
            >
              {darkText}
            </button>

            <button
              className={theme === "high-contrast" ? "active" : ""}
              onClick={() => setTheme("high-contrast")}
            >
              {highContrastText}
            </button>

            <button
              className={theme === "colorblind" ? "active" : ""}
              onClick={() => setTheme("colorblind")}
            >
              {colorblindText}
            </button>

          </div>
        </section>

        {/* LANGUAGE SECTION */}
        <section className="settings-section">
          <h3>{languageText}</h3>
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
      </div>
    </div>
  );
};

export default SettingsPage;
