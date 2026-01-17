"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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
  addItem: (item: Item) => void;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Item[]>([]);

  const addItem = (item: Item) => {
    setItems(prev => [item, ...prev]);
  };

  return (
    <ItemsContext.Provider value={{ items, addItem }}>
      {children}
    </ItemsContext.Provider>
  );
};

export const useItems = () => {
  const context = useContext(ItemsContext);
  if (!context) throw new Error("useItems must be used within ItemsProvider");
  return context;
};
