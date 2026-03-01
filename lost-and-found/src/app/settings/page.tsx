"use client";

import React, { useEffect, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useTTS } from "@/context/TTSContext";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import "./settings.css";

const SettingsPage = () => {
  const { theme, language, setTheme, setLanguage } = useSettings();
  const { enabled: ttsEnabled, setEnabled: setTTSEnabled } = useTTS();
  const { user } = useUser();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [banChecked, setBanChecked] = useState(false);

  const [appearanceText, setAppearanceText] = useState("Appearance");
  const [languageText, setLanguageText] = useState("Language");
  const [lightText, setLightText] = useState("Light");
  const [darkText, setDarkText] = useState("Dark");
  const [highContrastText, setHighContrastText] = useState("High Contrast");
  const [colorblindText, setColorblindText] = useState("Colorblind Mode");
  const [ttsText, setTTSText] = useState("Text-to-Speech");
  const [enableTTSText, setEnableTTSText] = useState("Enable TTS");
  const [disableTTSText, setDisableTTSText] = useState("Disable TTS");
  const [settingsTitleText, setSettingsTitleText] = useState("Settings");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) { setBanChecked(true); return; }
    const checkBan = async () => {
      const { data } = await supabase
        .from("banned_users")
        .select("email, suspended_until")
        .eq("email", user.primaryEmailAddress?.emailAddress)
        .single();
      if (data) {
        const isPermanent = !data.suspended_until;
        const isSuspended = data.suspended_until && new Date(data.suspended_until) > new Date();
        if (isPermanent || isSuspended) { router.push("/banned"); return; }
      }
      setBanChecked(true);
    };
    checkBan();
  }, [user]);

  useEffect(() => {
    if (!mounted) return;
    if (language === "en") {
      setSettingsTitleText("Settings");
      setAppearanceText("Appearance");
      setLanguageText("Language");
      setLightText("Light");
      setDarkText("Dark");
      setHighContrastText("High Contrast");
      setColorblindText("Colorblind Mode");
      setTTSText("Text-to-Speech");
      setEnableTTSText("Enable TTS");
      setDisableTTSText("Disable TTS");
      setIsReady(true);
      return;
    }
    const translations = [
      { key: "Settings",        setter: setSettingsTitleText, cacheKey: "settings_title" },
      { key: "Appearance",      setter: setAppearanceText,    cacheKey: "settings_appearance" },
      { key: "Language",        setter: setLanguageText,      cacheKey: "settings_language" },
      { key: "Light",           setter: setLightText,         cacheKey: "settings_light" },
      { key: "Dark",            setter: setDarkText,          cacheKey: "settings_dark" },
      { key: "High Contrast",   setter: setHighContrastText,  cacheKey: "settings_highContrast" },
      { key: "Colorblind Mode", setter: setColorblindText,    cacheKey: "settings_colorblind" },
      { key: "Text-to-Speech",  setter: setTTSText,           cacheKey: "settings_tts" },
      { key: "Enable TTS",      setter: setEnableTTSText,     cacheKey: "settings_enableTTS" },
      { key: "Disable TTS",     setter: setDisableTTSText,    cacheKey: "settings_disableTTS" },
    ];
    const translateAndCache = async () => {
      for (const { key, setter, cacheKey } of translations) {
        const cached = localStorage.getItem(`${cacheKey}_${language}`);
        if (cached) { setter(cached); continue; }
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
        } catch { /* keep default */ }
      }
      setIsReady(true);
    };
    translateAndCache();
  }, [language, mounted]);

  if (!banChecked || !mounted || !isReady) return null;

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h1>{settingsTitleText}</h1>
        <section className="settings-section">
          <h3>{appearanceText}</h3>
          <div className="theme-options">
            <button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}>{lightText}</button>
            <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}>{darkText}</button>
            <button className={theme === "high-contrast" ? "active" : ""} onClick={() => setTheme("high-contrast")}>{highContrastText}</button>
            <button className={theme === "colorblind" ? "active" : ""} onClick={() => setTheme("colorblind")}>{colorblindText}</button>
          </div>
        </section>
        <section className="settings-section">
          <h3>{languageText}</h3>
          <div className="theme-options">
            <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>English</button>
            <button className={language === "es" ? "active" : ""} onClick={() => setLanguage("es")}>Español</button>
            <button className={language === "fr" ? "active" : ""} onClick={() => setLanguage("fr")}>Français</button>
            <button className={language === "de" ? "active" : ""} onClick={() => setLanguage("de")}>Deutsch</button>
          </div>
        </section>
        <section className="settings-section">
          <h3>{ttsText}</h3>
          <button className={ttsEnabled ? "active" : ""} onClick={() => setTTSEnabled(!ttsEnabled)}>
            {ttsEnabled ? disableTTSText : enableTTSText}
          </button>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;