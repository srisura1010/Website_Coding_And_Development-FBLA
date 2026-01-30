"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";

export interface Item {
  id: number;
  name: string;
  description: string;
  image: string;
  authorName: string;
  authorAvatar?: string;
  // --- New Fields for the Lifecycle ---
  status: string;         // 'waiting', 'pending', or 'claimed'
  authorId: string;       // To check if current user is the owner
  authorEmail: string;    // To send the notification email
  claimerEmail?: string;  // Who is trying to retrieve it
}

interface ItemsContextType {
  items: Item[];
  addItem: (item: Item) => void;
  updateItemStatus: (id: number, newStatus: string, claimerEmail?: string) => void;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Item[]>([]);

  // 1. Fetch items including new columns
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Failed to fetch items:", error.message);
        return;
      }

      const formattedItems = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        image: item.image_url,
        authorName: item.author_name,
        authorAvatar: item.author_avatar,
        // Map new DB columns to our Item interface
        status: item.status,
        authorId: item.author_id,
        authorEmail: item.author_email,
        claimerEmail: item.claimer_email,
      }));

      setItems(formattedItems);
    };

    fetchItems();
  }, []);

  // 2. Add new item instantly
  const addItem = (item: Item) => {
    setItems((prev) => [item, ...prev]);
  };

  // 3. Update status instantly (No refresh needed!)
  const updateItemStatus = (id: number, newStatus: string, claimerEmail?: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id 
          ? { ...item, status: newStatus, claimerEmail: claimerEmail || item.claimerEmail } 
          : item
      )
    );
  };

  return (
    <ItemsContext.Provider value={{ items, addItem, updateItemStatus }}>
      {children}
    </ItemsContext.Provider>
  );
};

export const useItems = () => {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error("useItems must be used inside ItemsProvider");
  }
  return context;
};