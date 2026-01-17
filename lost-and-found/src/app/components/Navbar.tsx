"use client";

import { useState } from "react";
import { SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useItems } from "@/context/ItemsContext";
import { supabase } from "../../lib/supabaseClient"; // relative path
import "./Navbar.css";

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const { addItem } = useItems();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemDesc || !selectedFile || !user) return;

    setIsUploading(true);

    try {
      // 1. Upload file
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from("item-images")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Get public URL correctly
      const { data: urlData, error: urlError } = supabase
        .storage
        .from("item-images")
        .getPublicUrl(fileName);

      if (urlError) throw urlError;

      const publicUrl = urlData.publicUrl;

      // 3. Add item to context
      addItem({
        id: Date.now(),
        name: newItemName,
        description: newItemDesc,
        image: publicUrl, // <-- this will now show in the app
        authorName: user.fullName || user.username || "Anonymous",
        authorAvatar: user.imageUrl,
      });

      // 4. Reset form
      setNewItemName("");
      setNewItemDesc("");
      setSelectedFile(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Upload failed:", err);
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
              <button className="add-btn" onClick={() => setIsModalOpen(true)}>
                + Add Item
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Report Found Item</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Item Name (e.g. Red Scarf)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                required
              />
              <textarea
                placeholder="Description (Location, time, etc)"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                required
              />
              <label>Upload Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />

              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="confirm-btn" disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Post Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
