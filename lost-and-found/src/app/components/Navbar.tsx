"use client";

import { useState, useEffect } from "react";
import { SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useItems } from "@/context/ItemsContext";
import { useSettings } from "@/context/SettingsContext";
import { supabase } from "../../lib/supabaseClient";
import GoogleTranslate from "next-google-translate-widget";
import "@/app/globals.css";

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const { addItem } = useItems();
  const { theme, setTheme, font, setFont } = useSettings();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Apply theme & font globally
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-font", font);
  }, [theme, font]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemDesc || !selectedFile || !user) return;

    setIsUploading(true);

    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("item-images")
        .getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      const { data: insertedItem, error: insertError } = await supabase
        .from("items")
        .insert([
          {
            name: newItemName,
            description: newItemDesc,
            image_url: imageUrl,
            author_name: user.fullName || user.username || "Anonymous",
            author_avatar: user.imageUrl,
            author_id: user.id,
            author_email: user.primaryEmailAddress?.emailAddress,
            status: "waiting",
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      addItem({
        id: insertedItem.id,
        name: insertedItem.name,
        description: insertedItem.description,
        image: insertedItem.image_url,
        authorName: insertedItem.author_name,
        authorAvatar: insertedItem.author_avatar,
        status: insertedItem.status,
        authorId: insertedItem.author_id,
      });

      setNewItemName("");
      setNewItemDesc("");
      setSelectedFile(null);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <nav className="navbar">
        <h2 className="logo">Lost And Found</h2>

        <ul className="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>

          {isSignedIn ? (
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
                + Add Item
              </button>

              <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>
                ⚙️ Settings
              </button>

              <li><UserButton /></li>
            </div>
          ) : (
            <li>
              <SignUpButton>
                <button className="sign-up">Sign Up</button>
              </SignUpButton>
            </li>
          )}
        </ul>
      </nav>

      {/* ---------------- Add Item Modal ---------------- */}
      <div
        className="modal-overlay"
        style={{ display: isAddModalOpen ? "flex" : "none" }}
      >
        <div className="modal-content">
          <h3>Report Found Item</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Item Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
            />
            <textarea
              placeholder="Description (location, time, etc)"
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            <div className="modal-actions">
              <button type="button" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Post Item"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ---------------- Settings Modal ---------------- */}
      <div
        className="modal-overlay"
        style={{ display: isSettingsOpen ? "flex" : "none" }}
      >
        <div className="modal-content">
          <h3>Settings</h3>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            style={{ float: "right", fontSize: "1.2rem" }}
          >
            ✖
          </button>

          {/* Theme selector */}
          <div style={{ marginTop: "1rem" }}>
            <label>Theme:</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Font selector */}
          <div style={{ marginTop: "1rem" }}>
            <label>Font:</label>
            <select value={font} onChange={(e) => setFont(e.target.value as any)}>
              <option value="sans">Sans</option>
              <option value="serif">Serif</option>
              <option value="mono">Mono</option>
            </select>
          </div>

          {/* Language / Google Translate */}
          <div style={{ marginTop: "1rem" }}>
            <label>Language:</label>
            <GoogleTranslate pageLanguage="en" includedLanguages="en,es,fr,de,zh,ru" />
          </div>
        </div>
      </div>
    </>
  );
}
