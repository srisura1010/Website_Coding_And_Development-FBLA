"use client";

import React, { useEffect, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import "./settings.css";

const SettingsPage = () => {
  const { theme, language, setTheme, setLanguage } = useSettings();

  // Load from localStorage immediately
  const [settingsText, setSettingsText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`settings_title_${language}`) || "Settings";
    }
    return "Settings";
  });

  const [appearanceText, setAppearanceText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`settings_appearance_${language}`) || "Appearance";
    }
    return "Appearance";
  });

  const [lightText, setLightText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`settings_light_${language}`) || "Light";
    }
    return "Light";
  });

  const [darkText, setDarkText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`settings_dark_${language}`) || "Dark";
    }
    return "Dark";
  });

  const [languageText, setLanguageText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`settings_language_${language}`) || "Language";
    }
    return "Language";
  });

  useEffect(() => {
    if (language === "en") {
      setSettingsText("Settings");
      setAppearanceText("Appearance");
      setLightText("Light");
      setDarkText("Dark");
      setLanguageText("Language");
      return;
    }

    const translateAndCache = async () => {
      const translations = [
        { key: "Settings", setter: setSettingsText, cacheKey: "settings_title" },
        { key: "Appearance", setter: setAppearanceText, cacheKey: "settings_appearance" },
        { key: "Light", setter: setLightText, cacheKey: "settings_light" },
        { key: "Dark", setter: setDarkText, cacheKey: "settings_dark" },
        { key: "Language", setter: setLanguageText, cacheKey: "settings_language" },
      ];

      for (const { key, setter, cacheKey } of translations) {
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: key, target: language }),
          });

          if (res.ok) {
            const data = await res.json();
            const translated = data.translatedText || key;
            setter(translated);
            localStorage.setItem(`${cacheKey}_${language}`, translated);
          }
        } catch (error) {
          // Keep using cached or default
        }
      }
    };

    translateAndCache();
  }, [language]);

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h1>{settingsText}</h1>

        {/* THEME SECTION */}
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