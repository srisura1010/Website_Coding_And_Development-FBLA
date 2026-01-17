"use client";

import { useState } from "react";
import { SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useItems } from "@/context/ItemsContext"; // Import context
import "./Navbar.css";

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const { addItem } = useItems();
  
  // State for the modal form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemDesc || !selectedFile || !user) return;

    // Create a fake URL for the uploaded file so it displays immediately
    const imageUrl = URL.createObjectURL(selectedFile);

    addItem({
      id: Date.now(), // specific ID
      name: newItemName,
      description: newItemDesc,
      image: imageUrl,
      authorName: user.fullName || user.username || "Anonymous",
      authorAvatar: user.imageUrl,
    });

    // Reset and close
    setNewItemName("");
    setNewItemDesc("");
    setSelectedFile(null);
    setIsModalOpen(false);
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
              {/* Add Item Button */}
              <button 
                className="add-btn" 
                onClick={() => setIsModalOpen(true)}
              >
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

      {/* Simple Modal for Adding Item */}
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
                <button type="submit" className="confirm-btn">Post Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}