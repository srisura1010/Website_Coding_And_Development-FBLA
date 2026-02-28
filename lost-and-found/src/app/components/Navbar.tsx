"use client";

import "./Navbar.css";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/dist/client/link";
import { CiSettings } from "react-icons/ci";
import { useSettings } from "@/context/SettingsContext";

const SUPER_ADMINS = [
  "bavu.ramki@gmail.com",
  "srivatsav4ever@gmail.com",
];

export default function Navbar() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { language } = useSettings();
  const router = useRouter();

  const [unreadCount, setUnreadCount] = useState(0);

  const isSuperAdmin = isLoaded && SUPER_ADMINS.includes(
    user?.primaryEmailAddress?.emailAddress ?? ""
  );

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
    const channel = supabase
      .channel("navbar-unread")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => setUnreadCount((prev) => prev + 1))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const [dashboardText, setDashboardText] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`nav_dashboard_${language}`) || "Dashboard";
    return "Dashboard";
  });
  const [signUpText, setSignUpText] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`nav_signUp_${language}`) || "Sign Up";
    return "Sign Up";
  });

  useEffect(() => {
    if (language === "en") {
      setDashboardText("Dashboard");
      setSignUpText("Sign Up");
      return;
    }
    const translateAndCache = async () => {
      const translations = [
        { key: "Dashboard", setter: setDashboardText, cacheKey: "nav_dashboard" },
        { key: "Sign Up", setter: setSignUpText, cacheKey: "nav_signUp" },
      ];
      for (const { key, setter, cacheKey } of translations) {
        try {
          const res = await fetch("/api/translate", {
            method: "POST", headers: { "Content-Type": "application/json" },
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
    };
    translateAndCache();
  }, [language]);

  return (
    <nav className="navbar">
      <Link href="/" className="logo">Findr</Link>
      <ul className="nav-links">
        <li>
          <Link href="/settings" className="settings-icon-btn">
            <CiSettings size={23} />
          </Link>
        </li>
        <li>
          {isSignedIn ? (
            <button className="dashboard-link" onClick={() => router.push("/dashboard")}>
              {dashboardText}
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="dashboard-link">{dashboardText}</button>
            </SignInButton>
          )}
        </li>
        {isSignedIn && (
          <li className="messages-nav-item">
            <button
              className="dashboard-link"
              onClick={() => { setUnreadCount(0); router.push("/messages"); }}
            >
              Messages
              {unreadCount > 0 && (
                <span className="unread-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </li>
        )}
        {isSuperAdmin && (
          <li>
            <button
              className="dashboard-link"
              onClick={() => router.push("/super-admin")}
            >
              ⚙️ Super Admin
            </button>
          </li>
        )}
        {isSignedIn ? (
          <li><UserButton /></li>
        ) : (
          <li>
            <SignUpButton>
              <button className="sign-up">{signUpText}</button>
            </SignUpButton>
          </li>
        )}
      </ul>
    </nav>
  );
}