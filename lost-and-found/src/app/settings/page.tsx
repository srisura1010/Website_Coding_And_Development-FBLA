"use client";

import React, { useState, useEffect } from "react";
import "./settings.css";

const SettingsPage = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark"); // default dark

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.classList.add(savedTheme); // immediately apply saved theme
    } else {
      document.body.classList.add(theme); // default dark
    }
  }, []);

  // Apply theme and persist to localStorage whenever it changes
  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h1>Settings</h1>
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
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
