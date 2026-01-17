// src/context/ItemsContext.tsx
"use client";

import React, { createContext, useContext, useState } from "react";

// Define what an Item looks like
export interface Item {
  id: number;
  name: string;
  description: string;
  image: string;
  authorName: string;
  authorAvatar?: string;
}

interface ItemsContextType {
  items: Item[];
  addItem: (newItem: Item) => void;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  // We start with your original list here
  const [items, setItems] = useState<Item[]>([
    {
      id: 1,
      name: "Blue Backpack",
      description: "Navy blue backpack with leather straps...",
      image: "https://via.placeholder.com/300x200",
      authorName: "Admin",
    },
    {
      id: 2,
      name: "Glasses",
      description: "Black frame reading glasses...",
      image: "https://via.placeholder.com/300x200",
      authorName: "Admin",
    },
  ]);

  const addItem = (newItem: Item) => {
    setItems((prev) => [newItem, ...prev]); // Add new item to the top
  };

  return (
    <ItemsContext.Provider value={{ items, addItem }}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) throw new Error("useItems must be used within an ItemsProvider");
  return context;
}