"use client";

import { useState } from "react";
import { useSettings } from "@/context/SettingsContext";

export function useTranslate() {
  const { language } = useSettings();
  const [loading, setLoading] = useState(false);

  const translate = async (text: string) => {
    if (language === "en") return text;

    setLoading(true);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target: language }),
      });

      // Check if response is ok before parsing
      if (!res.ok) {
        console.error(`Translation API error: ${res.status} ${res.statusText}`);
        setLoading(false);
        return text; // Return original text on error
      }

      // Check if response has content
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Translation API did not return JSON");
        setLoading(false);
        return text;
      }

      const data = await res.json();
      setLoading(false);

      return data.translatedText || text;
    } catch (error) {
      console.error("Translation error:", error);
      setLoading(false);
      return text; // Fallback to original text
    }
  };

  return { translate, loading };
}