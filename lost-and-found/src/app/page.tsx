"use client";

import "./home.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaHandsHelping, FaShieldAlt, FaSlidersH, FaSchool } from "react-icons/fa";
import { IoFolder } from "react-icons/io5";
import { useSettings } from "@/context/SettingsContext";

export default function Home() {
  const { language } = useSettings();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  
  const [lostText, setLostText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_lost_${language}`) || "Lost Something?";
    return "Lost Something?";
  });
  
  const [dontPanicText, setDontPanicText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_panic_${language}`) || "Don't Panic.";
    return "Don't Panic.";
  });
  
  const [connectingText, setConnectingText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_connecting_${language}`) || "Connecting student, staff, and schools and reuniting them with their lost items";
    return "Connecting student, staff, and schools and reuniting them with their lost items";
  });
  
  const [browseText, setBrowseText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_browse_${language}`) || "Browse Lost Items";
    return "Browse Lost Items";
  });
  
  const [reportText, setReportText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_report_${language}`) || "Report a Lost Item";
    return "Report a Lost Item";
  });

  const [card1Title, setCard1Title] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_card1Title_${language}`) || "One Place for Everything";
    return "One Place for Everything";
  });

  const [card2Title, setCard2Title] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_card2Title_${language}`) || "Designed for Campuses";
    return "Designed for Campuses";
  });

  const [card3Title, setCard3Title] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_card3Title_${language}`) || "Find Items Faster";
    return "Find Items Faster";
  });

  const [card4Title, setCard4Title] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_card4Title_${language}`) || "Search What Matters";
    return "Search What Matters";
  });

  const [card5Title, setCard5Title] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_card5Title_${language}`) || "Students Helping Students";
    return "Students Helping Students";
  });

  const [card6Title, setCard6Title] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_card6Title_${language}`) || "Secure by Design";
    return "Secure by Design";
  });

  const [card1Body, setCard1Body] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_card1Body_${language}`) || "Stop checking multiple offices or bulletin boards. All lost and found items live in one clean, searchable place.";
    return "Stop checking multiple offices or bulletin boards. All lost and found items live in one clean, searchable place.";
  });

  const [card2Body, setCard2Body] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_card2Body_${language}`) || "Findr is made specifically for schools — from hallways to gyms to libraries — so nothing slips through the cracks.";
    return "Findr is made specifically for schools — from hallways to gyms to libraries — so nothing slips through the cracks.";
  });

  const [card3Body, setCard3Body] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_card3Body_${language}`) || "Quickly match lost items with found ones and get belongings back to students in days, not weeks.";
    return "Quickly match lost items with found ones and get belongings back to students in days, not weeks.";
  });

  const [card4Body, setCard4Body] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_card4Body_${language}`) || "Filter by category, location, and time to instantly narrow down results and spot your item.";
    return "Filter by category, location, and time to instantly narrow down results and spot your item.";
  });

  const [card5Body, setCard5Body] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_card5Body_${language}`) || "Anyone can report a found item, creating a trusted, school-wide system that actually works.";
    return "Anyone can report a found item, creating a trusted, school-wide system that actually works.";
  });

  const [card6Body, setCard6Body] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`home_card6Body_${language}`) || "Only your school community sees your items, keeping reports private and protected.";
    return "Only your school community sees your items, keeping reports private and protected.";
  });

  useEffect(() => {
    if (language === "en") {
      setLostText("Lost Something?");
      setDontPanicText("Don't Panic.");
      setConnectingText("Connecting student, staff, and schools and reuniting them with their lost items");
      setBrowseText("Browse Lost Items");
      setReportText("Report a Lost Item");
      setCard1Title("One Place for Everything");
      setCard2Title("Designed for Campuses");
      setCard3Title("Find Items Faster");
      setCard4Title("Search What Matters");
      setCard5Title("Students Helping Students");
      setCard6Title("Secure by Design");
      setCard1Body("Stop checking multiple offices or bulletin boards. All lost and found items live in one clean, searchable place.");
      setCard2Body("Findr is made specifically for schools — from hallways to gyms to libraries — so nothing slips through the cracks.");
      setCard3Body("Quickly match lost items with found ones and get belongings back to students in days, not weeks.");
      setCard4Body("Filter by category, location, and time to instantly narrow down results and spot your item.");
      setCard5Body("Anyone can report a found item, creating a trusted, school-wide system that actually works.");
      setCard6Body("Only your school community sees your items, keeping reports private and protected.");
      setIsReady(true);
      return;
    }

    const translateAndCache = async () => {
      const translations = [
        { key: "Lost Something?", setter: setLostText, cacheKey: "home_lost" },
        { key: "Don't Panic.", setter: setDontPanicText, cacheKey: "home_panic" },
        { key: "Connecting student, staff, and schools and reuniting them with their lost items", setter: setConnectingText, cacheKey: "home_connecting" },
        { key: "Browse Lost Items", setter: setBrowseText, cacheKey: "home_browse" },
        { key: "Report a Lost Item", setter: setReportText, cacheKey: "home_report" },
        { key: "One Place for Everything", setter: setCard1Title, cacheKey: "home_card1Title" },
        { key: "Designed for Campuses", setter: setCard2Title, cacheKey: "home_card2Title" },
        { key: "Find Items Faster", setter: setCard3Title, cacheKey: "home_card3Title" },
        { key: "Search What Matters", setter: setCard4Title, cacheKey: "home_card4Title" },
        { key: "Students Helping Students", setter: setCard5Title, cacheKey: "home_card5Title" },
        { key: "Secure by Design", setter: setCard6Title, cacheKey: "home_card6Title" },
        { key: "Stop checking multiple offices or bulletin boards. All lost and found items live in one clean, searchable place.", setter: setCard1Body, cacheKey: "home_card1Body" },
        { key: "Findr is made specifically for schools — from hallways to gyms to libraries — so nothing slips through the cracks.", setter: setCard2Body, cacheKey: "home_card2Body" },
        { key: "Quickly match lost items with found ones and get belongings back to students in days, not weeks.", setter: setCard3Body, cacheKey: "home_card3Body" },
        { key: "Filter by category, location, and time to instantly narrow down results and spot your item.", setter: setCard4Body, cacheKey: "home_card4Body" },
        { key: "Anyone can report a found item, creating a trusted, school-wide system that actually works.", setter: setCard5Body, cacheKey: "home_card5Body" },
        { key: "Only your school community sees your items, keeping reports private and protected.", setter: setCard6Body, cacheKey: "home_card6Body" },
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
        } catch {
          // Keep using cached or default
        }
      }
      setIsReady(true);
    };

    translateAndCache();
  }, [language]);

  if (!isReady) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="grid-background dark:block light:hidden" />
        <div className="grid-background-light dark:hidden light:block" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid-background dark:block light:hidden" />
      <div className="grid-background-light dark:hidden light:block" />

      <div className="hero-card relative z-10">
        <h1>
          <span className="lostHero">{lostText}</span>
          <span className="panicHero">{dontPanicText}</span>
        </h1>
        <p>{connectingText}</p>
        <button className="browse" onClick={() => router.push("/dashboard")}>{browseText}</button>
        <button className="report" onClick={() => router.push("/dashboard")}>{reportText}</button>
      </div>

      <div className="carousel relative z-10">
        <div className="track">
          <div className="card">
            <span className="card-icon"><IoFolder className="text-blue-500" /></span>
            <h3 className="card-title">{card1Title}</h3>
            <p className="card-body">{card1Body}</p>
          </div>
          <div className="card">
            <span className="card-icon"><FaSchool className="text-blue-500" /></span>
            <h3 className="card-title">{card2Title}</h3>
            <p className="card-body">{card2Body}</p>
          </div>
          <div className="card">
            <span className="card-icon"><FaSearch className="text-blue-500" /></span>
            <h3 className="card-title">{card3Title}</h3>
            <p className="card-body">{card3Body}</p>
          </div>
          <div className="card">
            <span className="card-icon"><FaSlidersH className="text-blue-500" /></span>
            <h3 className="card-title">{card4Title}</h3>
            <p className="card-body">{card4Body}</p>
          </div>
          <div className="card">
            <span className="card-icon"><FaHandsHelping className="text-blue-500" /></span>
            <h3 className="card-title">{card5Title}</h3>
            <p className="card-body">{card5Body}</p>
          </div>
          <div className="card">
            <span className="card-icon"><FaShieldAlt className="text-blue-500" /></span>
            <h3 className="card-title">{card6Title}</h3>
            <p className="card-body">{card6Body}</p>
          </div>

          {/* Duplicate set for infinite scroll */}
          <div className="card">
            <span className="card-icon"><IoFolder className="text-blue-500" /></span>
            <h3 className="card-title">{card1Title}</h3>
            <p className="card-body">{card1Body}</p>
          </div>
          <div className="card">
            <span className="card-icon"><FaSchool className="text-blue-500" /></span>
            <h3 className="card-title">{card2Title}</h3>
            <p className="card-body">{card2Body}</p>
          </div>
          <div className="card">
            <span className="card-icon"><FaSearch className="text-blue-500" /></span>
            <h3 className="card-title">{card3Title}</h3>
            <p className="card-body">{card3Body}</p>
          </div>
          <div className="card">
            <span className="card-icon"><FaSlidersH className="text-blue-500" /></span>
            <h3 className="card-title">{card4Title}</h3>
            <p className="card-body">{card4Body}</p>
          </div>
          <div className="card">
            <span className="card-icon"><FaHandsHelping className="text-blue-500" /></span>
            <h3 className="card-title">{card5Title}</h3>
            <p className="card-body">{card5Body}</p>
          </div>
          <div className="card">
            <span className="card-icon"><FaShieldAlt className="text-blue-500" /></span>
            <h3 className="card-title">{card6Title}</h3>
            <p className="card-body">{card6Body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}