"use client";

import "./Navbar.css";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useItems } from "@/context/ItemsContext";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/dist/client/link";
import { CiSettings } from "react-icons/ci";
import { useSettings } from "@/context/SettingsContext";

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const { addItem } = useItems();
  const { language } = useSettings();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── Unread message count ──────────────────────────────────────────────────
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch initial unread count
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();

    // Listen for new incoming messages in real time
    const channel = supabase
      .channel("navbar-unread")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Translations (unchanged) ──────────────────────────────────────────────
  const [dashboardText, setDashboardText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`nav_dashboard_${language}`) || "Dashboard";
    return "Dashboard";
  });
  const [addItemText, setAddItemText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`nav_addItem_${language}`) || "+ Add Item";
    return "+ Add Item";
  });
  const [signUpText, setSignUpText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`nav_signUp_${language}`) || "Sign Up";
    return "Sign Up";
  });
  const [reportFoundText, setReportFoundText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`nav_reportFound_${language}`) || "Report Found Item";
    return "Report Found Item";
  });
  const [itemNameText, setItemNameText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`nav_itemName_${language}`) || "Item Name";
    return "Item Name";
  });
  const [descriptionText, setDescriptionText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`nav_description_${language}`) || "Description (location, time, etc)";
    return "Description (location, time, etc)";
  });
  const [cancelText, setCancelText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`nav_cancel_${language}`) || "Cancel";
    return "Cancel";
  });
  const [postItemText, setPostItemText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`nav_postItem_${language}`) || "Post Item";
    return "Post Item";
  });
  const [uploadingText, setUploadingText] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`nav_uploading_${language}`) || "Uploading...";
    return "Uploading...";
  });

  useEffect(() => {
    if (language === "en") {
      setDashboardText("Dashboard");
      setAddItemText("+ Add Item");
      setSignUpText("Sign Up");
      setReportFoundText("Report Found Item");
      setItemNameText("Item Name");
      setDescriptionText("Description (location, time, etc)");
      setCancelText("Cancel");
      setPostItemText("Post Item");
      setUploadingText("Uploading...");
      return;
    }
    const translateAndCache = async () => {
      const translations = [
        { key: "Dashboard", setter: setDashboardText, cacheKey: "nav_dashboard" },
        { key: "+ Add Item", setter: setAddItemText, cacheKey: "nav_addItem" },
        { key: "Sign Up", setter: setSignUpText, cacheKey: "nav_signUp" },
        { key: "Report Found Item", setter: setReportFoundText, cacheKey: "nav_reportFound" },
        { key: "Item Name", setter: setItemNameText, cacheKey: "nav_itemName" },
        { key: "Description (location, time, etc)", setter: setDescriptionText, cacheKey: "nav_description" },
        { key: "Cancel", setter: setCancelText, cacheKey: "nav_cancel" },
        { key: "Post Item", setter: setPostItemText, cacheKey: "nav_postItem" },
        { key: "Uploading...", setter: setUploadingText, cacheKey: "nav_uploading" },
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
    };
    translateAndCache();
  }, [language]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemDesc || !selectedFile || !user) return;
    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage.from("item-images").upload(fileName, selectedFile);
      if (uploadError) { console.error("Upload error:", uploadError.message); return; }
      const { data: urlData } = supabase.storage.from("item-images").getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;
      const { data: insertedItem, error: insertError } = await supabase
        .from("items")
        .insert([{
          name: newItemName, description: newItemDesc, image_url: imageUrl,
          author_name: user.fullName || user.username || "Anonymous",
          author_avatar: user.imageUrl, author_id: user.id,
          author_email: user.primaryEmailAddress?.emailAddress, status: "waiting",
        }])
        .select().single();
      if (insertError) { console.error("Insert error:", insertError.message); return; }
      addItem({
        id: insertedItem.id, name: insertedItem.name, description: insertedItem.description,
        image: insertedItem.image_url, authorName: insertedItem.author_name,
        authorAvatar: insertedItem.author_avatar, status: insertedItem.status,
        authorId: insertedItem.author_id, authorEmail: "",
      });
      setNewItemName(""); setNewItemDesc(""); setSelectedFile(null); setIsModalOpen(false);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
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

          {/* ── Messages link with unread badge ── */}
          {isSignedIn && (
            <li>
              <button
                className="dashboard-link"
                onClick={() => { setUnreadCount(0); router.push("/messages"); }}
                style={{ position: "relative" }}
              >
                 Messages
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: -6, right: -8,
                    background: "#ef4444", color: "#fff",
                    borderRadius: "50%", width: 18, height: 18,
                    fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </li>
          )}

          {isSignedIn ? (
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <button className="add-btn" onClick={() => setIsModalOpen(true)}>{addItemText}</button>
              <li><UserButton /></li>
            </div>
          ) : (
            <li>
              <SignUpButton>
                <button className="sign-up">{signUpText}</button>
              </SignUpButton>
            </li>
          )}
        </ul>
      </nav>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{reportFoundText}</h3>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder={itemNameText} value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required />
              <textarea placeholder={descriptionText} value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} required />
              <input type="file" accept="image/*" onChange={handleFileChange} required />
              <div className="modal-actions">
                <button className="button" type="button" onClick={() => setIsModalOpen(false)}>{cancelText}</button>
                <button className="button" type="submit" disabled={isUploading}>{isUploading ? uploadingText : postItemText}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}