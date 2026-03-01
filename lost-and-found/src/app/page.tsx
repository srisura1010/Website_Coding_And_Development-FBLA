"use client";

import "./home.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaHandsHelping, FaShieldAlt, FaSlidersH, FaSchool } from "react-icons/fa";
import { IoFolder } from "react-icons/io5";
import { useSettings } from "@/context/SettingsContext";
import { useUser, SignInButton } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const { language } = useSettings();
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [isReady, setIsReady] = useState(false);
  const [banChecked, setBanChecked] = useState(false);

  const [lostText, setLostText] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_lost_${language}`) || "Lost Something?" : "Lost Something?");
  const [dontPanicText, setDontPanicText] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_panic_${language}`) || "Don't Panic." : "Don't Panic.");
  const [connectingText, setConnectingText] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_connecting_${language}`) || "Connecting student, staff, and schools and reuniting them with their lost items" : "Connecting student, staff, and schools and reuniting them with their lost items");
  const [browseText, setBrowseText] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_browse_${language}`) || "Browse Lost Items" : "Browse Lost Items");
  const [reportText, setReportText] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_report_${language}`) || "Report a Lost Item" : "Report a Lost Item");
  const [card1Title, setCard1Title] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_card1Title_${language}`) || "One Place for Everything" : "One Place for Everything");
  const [card2Title, setCard2Title] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_card2Title_${language}`) || "Designed for Campuses" : "Designed for Campuses");
  const [card3Title, setCard3Title] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_card3Title_${language}`) || "Find Items Faster" : "Find Items Faster");
  const [card4Title, setCard4Title] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_card4Title_${language}`) || "Search What Matters" : "Search What Matters");
  const [card5Title, setCard5Title] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_card5Title_${language}`) || "Students Helping Students" : "Students Helping Students");
  const [card6Title, setCard6Title] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_card6Title_${language}`) || "Secure by Design" : "Secure by Design");
  const [card1Body, setCard1Body] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_card1Body_${language}`) || "Stop checking multiple offices or bulletin boards. All lost and found items live in one clean, searchable place." : "Stop checking multiple offices or bulletin boards. All lost and found items live in one clean, searchable place.");
  const [card2Body, setCard2Body] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_card2Body_${language}`) || "Findr is made specifically for schools — from hallways to gyms to libraries — so nothing slips through the cracks." : "Findr is made specifically for schools — from hallways to gyms to libraries — so nothing slips through the cracks.");
  const [card3Body, setCard3Body] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_card3Body_${language}`) || "Quickly match lost items with found ones and get belongings back to students in days, not weeks." : "Quickly match lost items with found ones and get belongings back to students in days, not weeks.");
  const [card4Body, setCard4Body] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_card4Body_${language}`) || "Filter by category, location, and time to instantly narrow down results and spot your item." : "Filter by category, location, and time to instantly narrow down results and spot your item.");
  const [card5Body, setCard5Body] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_card5Body_${language}`) || "Anyone can report a found item, creating a trusted, school-wide system that actually works." : "Anyone can report a found item, creating a trusted, school-wide system that actually works.");
  const [card6Body, setCard6Body] = useState(() => typeof window !== "undefined" ? localStorage.getItem(`home_card6Body_${language}`) || "Only your school community sees your items, keeping reports private and protected." : "Only your school community sees your items, keeping reports private and protected.");

  // ── Ban check ──
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
        } catch { /* keep cached */ }
      }
      setIsReady(true);
    };
    translateAndCache();
  }, [language]);

  if (!banChecked || !isReady) {
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
        {isSignedIn ? (
          <button className="browse" onClick={() => router.push("/dashboard")}>{browseText}</button>
        ) : (
          <SignInButton mode="modal"><button className="browse">{browseText}</button></SignInButton>
        )}
        {isSignedIn ? (
          <button className="report" onClick={() => router.push("/dashboard")}>{reportText}</button>
        ) : (
          <SignInButton mode="modal"><button className="report">{reportText}</button></SignInButton>
        )}
      </div>

      <div className="carousel relative z-10">
        <div className="track">
          <div className="card"><span className="card-icon"><IoFolder className="text-blue-500" /></span><h3 className="card-title">{card1Title}</h3><p className="card-body">{card1Body}</p></div>
          <div className="card"><span className="card-icon"><FaSchool className="text-blue-500" /></span><h3 className="card-title">{card2Title}</h3><p className="card-body">{card2Body}</p></div>
          <div className="card"><span className="card-icon"><FaSearch className="text-blue-500" /></span><h3 className="card-title">{card3Title}</h3><p className="card-body">{card3Body}</p></div>
          <div className="card"><span className="card-icon"><FaSlidersH className="text-blue-500" /></span><h3 className="card-title">{card4Title}</h3><p className="card-body">{card4Body}</p></div>
          <div className="card"><span className="card-icon"><FaHandsHelping className="text-blue-500" /></span><h3 className="card-title">{card5Title}</h3><p className="card-body">{card5Body}</p></div>
          <div className="card"><span className="card-icon"><FaShieldAlt className="text-blue-500" /></span><h3 className="card-title">{card6Title}</h3><p className="card-body">{card6Body}</p></div>
          {/* Duplicates for infinite scroll */}
          <div className="card"><span className="card-icon"><IoFolder className="text-blue-500" /></span><h3 className="card-title">{card1Title}</h3><p className="card-body">{card1Body}</p></div>
          <div className="card"><span className="card-icon"><FaSchool className="text-blue-500" /></span><h3 className="card-title">{card2Title}</h3><p className="card-body">{card2Body}</p></div>
          <div className="card"><span className="card-icon"><FaSearch className="text-blue-500" /></span><h3 className="card-title">{card3Title}</h3><p className="card-body">{card3Body}</p></div>
          <div className="card"><span className="card-icon"><FaSlidersH className="text-blue-500" /></span><h3 className="card-title">{card4Title}</h3><p className="card-body">{card4Body}</p></div>
          <div className="card"><span className="card-icon"><FaHandsHelping className="text-blue-500" /></span><h3 className="card-title">{card5Title}</h3><p className="card-body">{card5Body}</p></div>
          <div className="card"><span className="card-icon"><FaShieldAlt className="text-blue-500" /></span><h3 className="card-title">{card6Title}</h3><p className="card-body">{card6Body}</p></div>
        </div>
      </div>
    </div>
  );
}