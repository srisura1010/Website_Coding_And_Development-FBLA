"use client";

import "./Navbar.css";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/dist/client/link";
import { CiSettings } from "react-icons/ci";
import { useSettings } from "@/context/SettingsContext";
import { SUPER_ADMINS } from "@/lib/superAdmin";

export default function Navbar() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { language } = useSettings();
  const router = useRouter();

  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSuperAdmin = isLoaded && SUPER_ADMINS.includes(
    user?.primaryEmailAddress?.emailAddress ?? ""
  );

  // Close sidebar on route change
  const navigate = (path: string) => {
    setMobileOpen(false);
    router.push(path);
  };

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

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
  const [helpText, setHelpText] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`nav_help_${language}`) || "Help";
    return "Help";
  });

  useEffect(() => {
    if (language === "en") {
      setDashboardText("Dashboard");
      setSignUpText("Sign Up");
      setHelpText("Help");
      return;
    }
    const translateAndCache = async () => {
      const translations = [
        { key: "Dashboard", setter: setDashboardText, cacheKey: "nav_dashboard" },
        { key: "Sign Up",   setter: setSignUpText,    cacheKey: "nav_signUp" },
        { key: "Help",      setter: setHelpText,      cacheKey: "nav_help" },
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
    <>
      <nav className="navbar">
        <Link href="/" className="logo">Findr</Link>

        {/* ── Desktop nav links ── */}
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
                  <span className="unread-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>
            </li>
          )}
          <li>
            <button className="dashboard-link" onClick={() => router.push("/help")}>
              {helpText}
            </button>
          </li>
          {isSuperAdmin && (
            <li>
              <button className="dashboard-link" onClick={() => router.push("/super-admin")}>
                Super Admin
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

        {/* ── Mobile: right side (user button + hamburger) ── */}
        <div className="navbar-mobile-right">
          {isSignedIn && <UserButton />}
          <button
            className="navbar-hamburger"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span className={`navbar-hamburger__bar${mobileOpen ? " open" : ""}`} />
            <span className={`navbar-hamburger__bar${mobileOpen ? " open" : ""}`} />
            <span className={`navbar-hamburger__bar${mobileOpen ? " open" : ""}`} />
          </button>
        </div>
      </nav>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Mobile sidebar panel ── */}
      <div className={`mobile-sidebar${mobileOpen ? " mobile-sidebar--open" : ""}`}>
        <div className="mobile-sidebar__header">
          <span className="mobile-sidebar__logo">Findr</span>
          <button
            className="mobile-sidebar__close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="mobile-sidebar__nav">
          {isSignedIn ? (
            <button className="mobile-sidebar__item" onClick={() => navigate("/dashboard")}>
              {dashboardText}
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="mobile-sidebar__item" onClick={() => setMobileOpen(false)}>
                {dashboardText}
              </button>
            </SignInButton>
          )}

          {isSignedIn && (
            <button
              className="mobile-sidebar__item messages-nav-item"
              onClick={() => { setUnreadCount(0); navigate("/messages"); }}
            >
              Messages
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>
          )}

          <button className="mobile-sidebar__item" onClick={() => navigate("/help")}>
            {helpText}
          </button>

          {isSuperAdmin && (
            <button className="mobile-sidebar__item" onClick={() => navigate("/super-admin")}>
              Super Admin
            </button>
          )}

          <button
            className="mobile-sidebar__item mobile-sidebar__item--icon"
            onClick={() => navigate("/settings")}
          >
            <CiSettings size={18} />
            Settings
          </button>

          {!isSignedIn && (
            <SignUpButton>
              <button className="mobile-sidebar__signup" onClick={() => setMobileOpen(false)}>
                {signUpText}
              </button>
            </SignUpButton>
          )}
        </nav>
      </div>
    </>
  );
}