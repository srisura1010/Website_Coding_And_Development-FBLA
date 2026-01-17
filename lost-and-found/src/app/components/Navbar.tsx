"use client";

import { useState } from "react";
import { SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useItems } from "@/context/ItemsContext";
import { supabase } from "../../lib/supabaseClient";
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
      /* -------------------- 1. Upload image -------------------- */
      const fileName = `${Date.now()}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error("Upload error:", uploadError.message);
        return;
      }

      /* -------------------- 2. Get public URL -------------------- */
      const { data: urlData } = supabase.storage
        .from("item-images")
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      /* -------------------- 3. Insert into database -------------------- */
      const { data: insertedItem, error: insertError } = await supabase
        .from("items")
        .insert([
          {
            id: Date.now(),
            name: newItemName,
            description: newItemDesc,
            image_url: imageUrl,
            author_name: user.fullName || user.username || "Anonymous",
            author_avatar: user.imageUrl,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError.message);
        return;
      }

      /* -------------------- 4. Update UI instantly -------------------- */
      addItem({
        id: insertedItem.id,
        name: insertedItem.name,
        description: insertedItem.description,
        image: insertedItem.image_url,
        authorName: insertedItem.author_name,
        authorAvatar: insertedItem.author_avatar,
      });

      /* -------------------- 5. Reset -------------------- */
      setNewItemName("");
      setNewItemDesc("");
      setSelectedFile(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Unexpected error:", err);
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
                <button type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isUploading}>
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
