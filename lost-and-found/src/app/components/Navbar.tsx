"use client";

import "./Navbar.css";

import { SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useItems } from "@/context/ItemsContext";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/dist/client/link";

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const { addItem } = useItems();

  const router = useRouter();

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
    // Added check for primaryEmailAddress to ensure we can notify the creator later
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
      // Added author_id, author_email, and status for the claim logic
      const { data: insertedItem, error: insertError } = await supabase
        .from("items")
        .insert([
          {
            name: newItemName,
            description: newItemDesc,
            image_url: imageUrl,
            author_name: user.fullName || user.username || "Anonymous",
            author_avatar: user.imageUrl,
            author_id: user.id, // Store Clerk ID to verify owner later
            author_email: user.primaryEmailAddress?.emailAddress, // Used for email notifications
            status: "waiting", // Default status
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
        status: insertedItem.status, // Pass status to context
        authorId: insertedItem.author_id,
        authorEmail: "",
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
        <Link href="/" className="logo">Findr</Link>

        <ul className="nav-links">
          <li>
            {isSignedIn ? (
              <button
                className="dashboard-link"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="dashboard-link">Dashboard</button>
              </SignInButton>
            )}
          </li>

          {isSignedIn ? (
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <button className="add-btn" onClick={() => setIsModalOpen(true)}>
                + Add Item
              </button>
              <li>
                <UserButton />
              </li>
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
                <button
                  className="button"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="button" type="submit" disabled={isUploading}>
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
