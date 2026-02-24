"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSettings } from "@/context/SettingsContext";

export interface Item {
  id: number;
  name: string;
  description: string;
  image: string;
  authorName: string;
  authorAvatar?: string;
  status: string;
  authorId: string;
  authorEmail: string;
  claimerEmail?: string;
  aiKeywords?: string;
}

interface RawItem extends Omit<Item, "name" | "description"> {
  name: string;
  description: string;
}

interface ItemsContextType {
  items: Item[];
  addItem: (item: Item) => void;
  updateItemStatus: (id: number, newStatus: string, claimerEmail?: string) => void;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

async function translateText(text: string, target: string): Promise<string> {
  const cacheKey = `item_text_${target}_${btoa(encodeURIComponent(text)).slice(0, 40)}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target }),
    });
    if (res.ok) {
      const data = await res.json();
      const translated = data.translatedText || text;
      localStorage.setItem(cacheKey, translated);
      return translated;
    }
  } catch {
    // fall through to return original
  }
  return text;
}

async function translateItems(rawItems: RawItem[], language: string): Promise<Item[]> {
  if (language === "en") return rawItems;

  return Promise.all(
    rawItems.map(async (item) => {
      const [name, description] = await Promise.all([
        translateText(item.name, language),
        translateText(item.description, language),
      ]);
      return { ...item, name, description };
    })
  );
}

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
  const [rawItems, setRawItems] = useState<RawItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const { language } = useSettings();

  // Fetch raw items from Supabase once
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("id", { ascending: false });

      if (error) { console.error("Failed to fetch items:", error.message); return; }

      const formatted: RawItem[] = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        image: item.image_url,
        authorName: item.author_name,
        authorAvatar: item.author_avatar,
        status: item.status,
        authorId: item.author_id,
        authorEmail: item.author_email,
        claimerEmail: item.claimer_email,
        aiKeywords: item.ai_keywords || "",
      }));

      setRawItems(formatted);
    };

    fetchItems();
  }, []);

  // Re-translate whenever rawItems or language changes
  useEffect(() => {
    if (rawItems.length === 0) return;

    translateItems(rawItems, language).then(setItems);
  }, [rawItems, language]);

  const addItem = (item: Item) => {
    // Add to raw items so it gets translated too
    setRawItems((prev) => [item, ...prev]);
  };

  const updateItemStatus = (id: number, newStatus: string, claimerEmail?: string) => {
    // Update both raw and translated in sync
    setRawItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: newStatus, claimerEmail: claimerEmail || item.claimerEmail }
          : item
      )
    );
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
  if (!context) throw new Error("useItems must be used inside ItemsProvider");
  return context;
};