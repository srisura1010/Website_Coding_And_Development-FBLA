"use client";

import "../dashboard/dashboard.css";
import { useItems } from "@/context/ItemsContext";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import emailjs from "@emailjs/browser";
import { useSettings } from "@/context/SettingsContext";
import { useEffect, useState, useRef } from "react";
import { getConversationId } from "@/app/components/MessagingSystem";

interface Message {
  id: number;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  item_id: string;
  item_title: string;
  text: string;
  created_at: string;
}

interface ChatUser { uid: string; displayName: string; }
interface ChatItem { id: number; name: string; [key: string]: unknown; }
interface ActiveChat { conversationId: string; item: ChatItem; otherUser: ChatUser; }
interface ChatModalProps {
  conversationId: string; item: ChatItem;
  currentUser: ChatUser; otherUser: ChatUser; onClose: () => void;
}

function ChatModal({ conversationId, item, currentUser, otherUser, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from("chat_messages").select("*")
        .eq("conversation_id", conversationId).order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
    const channel = supabase.channel(`chat:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => setMessages((prev) => prev.some((m) => m.id === (payload.new as Message).id) ? prev : [...prev, payload.new as Message]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const trimmed = text.trim();
    setText("");
    setMessages((prev) => [...prev, { id: Date.now(), conversation_id: conversationId, sender_id: currentUser.uid, sender_name: currentUser.displayName, receiver_id: otherUser.uid, item_id: String(item.id), item_title: item.name, text: trimmed, created_at: new Date().toISOString() }]);
    await supabase.from("chat_messages").insert({ conversation_id: conversationId, sender_id: currentUser.uid, sender_name: currentUser.displayName, receiver_id: otherUser.uid, receiver_name: otherUser.displayName, item_id: String(item.id), item_title: item.name, text: trimmed, read: false });
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, height: 520, display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>{otherUser.displayName?.[0]?.toUpperCase() ?? "?"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{otherUser.displayName}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{item.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>x</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 4, background: "#f8fafc" }}>
          {messages.length === 0 && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}><p style={{ fontSize: 13 }}>Say hi about <strong>{item.name}</strong></p></div>}
          {messages.map((msg) => {
            const isOwn = msg.sender_id === currentUser.uid;
            return (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start", marginBottom: 6 }}>
                <div style={{ maxWidth: "75%", padding: "9px 13px", borderRadius: isOwn ? "16px 16px 3px 16px" : "16px 16px 16px 3px", background: isOwn ? "#2563eb" : "#fff", color: isOwn ? "#fff" : "#0f172a", fontSize: 14, lineHeight: 1.5, wordBreak: "break-word", boxShadow: isOwn ? "0 2px 8px rgba(37,99,235,0.2)" : "0 1px 4px rgba(0,0,0,0.08)" }}>{msg.text}</div>
                <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div style={{ display: "flex", gap: 8, padding: "12px 14px", borderTop: "1px solid #e2e8f0", background: "#fff", alignItems: "flex-end" }}>
          <textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a message..." style={{ flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 20, padding: "9px 14px", fontSize: 14, resize: "none", fontFamily: "inherit", outline: "none", lineHeight: 1.5, background: "#f8fafc", color: "#0f172a" }} />
          <button onClick={handleSend} disabled={!text.trim() || sending} style={{ width: 38, height: 38, borderRadius: "50%", background: text.trim() ? "#2563eb" : "#e2e8f0", color: text.trim() ? "#fff" : "#94a3b8", border: "none", fontSize: 18, cursor: text.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>^</button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { items, updateItemStatus } = useItems();
  const { user } = useUser();
  const { language } = useSettings();

  const [isReady, setIsReady] = useState(false);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter items by search query against name, description, and ai_keywords
  const filteredItems = searchQuery.trim()
    ? (items ?? []).filter((item) => {
        const q = searchQuery.toLowerCase();
        const haystack = `${item.name} ${item.description} ${(item as any).aiKeywords ?? ""}`.toLowerCase();
        return haystack.includes(q) ||
          q.split(/\s+/).some((word) => haystack.includes(word));
      })
    : (items ?? []);

  const [foundByText, setFoundByText] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`dash_foundBy_${language}`) || "Found by:";
    return "Found by:";
  });
  const [retrieveText, setRetrieveText] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`dash_retrieve_${language}`) || "Retrieve";
    return "Retrieve";
  });
  const [confirmText, setConfirmText] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`dash_confirm_${language}`) || "Confirm Claimed";
    return "Confirm Claimed";
  });
  const [pendingText, setPendingText] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`dash_pending_${language}`) || "Item Claimed (Pending Confirmation)";
    return "Item Claimed (Pending Confirmation)";
  });
  const [signInText, setSignInText] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`dash_signIn_${language}`) || "Please sign in to retrieve items";
    return "Please sign in to retrieve items";
  });
  const [requestSentText, setRequestSentText] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`dash_requestSent_${language}`) || "Request sent! The owner has been notified.";
    return "Request sent! The owner has been notified.";
  });
  const [markedClaimedText, setMarkedClaimedText] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`dash_markedClaimed_${language}`) || "Item officially marked as claimed!";
    return "Item officially marked as claimed!";
  });

  useEffect(() => {
    if (language === "en") {
      setFoundByText("Found by:"); setRetrieveText("Retrieve"); setConfirmText("Confirm Claimed");
      setPendingText("Item Claimed (Pending Confirmation)"); setSignInText("Please sign in to retrieve items");
      setRequestSentText("Request sent! The owner has been notified."); setMarkedClaimedText("Item officially marked as claimed!");
      setIsReady(true); return;
    }
    const translateAndCache = async () => {
      const translations = [
        { key: "Found by:", setter: setFoundByText, cacheKey: "dash_foundBy" },
        { key: "Retrieve", setter: setRetrieveText, cacheKey: "dash_retrieve" },
        { key: "Confirm Claimed", setter: setConfirmText, cacheKey: "dash_confirm" },
        { key: "Item Claimed (Pending Confirmation)", setter: setPendingText, cacheKey: "dash_pending" },
        { key: "Please sign in to retrieve items", setter: setSignInText, cacheKey: "dash_signIn" },
        { key: "Request sent! The owner has been notified.", setter: setRequestSentText, cacheKey: "dash_requestSent" },
        { key: "Item officially marked as claimed!", setter: setMarkedClaimedText, cacheKey: "dash_markedClaimed" },
      ];
      for (const { key, setter, cacheKey } of translations) {
        try {
          const res = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: key, target: language }) });
          if (res.ok) { const data = await res.json(); const t = data.translatedText || key; setter(t); localStorage.setItem(`${cacheKey}_${language}`, t); }
        } catch { /* keep cached */ }
      }
      setIsReady(true);
    };
    translateAndCache();
  }, [language]);

  const handleRetrieve = async (item: any) => {
    if (!user) return alert(signInText);
    const { error } = await supabase.from("items").update({ status: "pending", claimer_email: user.primaryEmailAddress?.emailAddress }).eq("id", item.id);
    if (error) { console.error(error.message); return; }
    emailjs.send(process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!, process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!, { author_name: item.authorName || "Owner", item_name: item.name, retriever_name: user.fullName || "A user", retriever_email: user.primaryEmailAddress?.emailAddress, to_email: item.authorEmail }, process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!).catch(console.error);
    updateItemStatus(item.id, "pending", user.primaryEmailAddress?.emailAddress);
    alert(requestSentText);
  };

  const handleConfirmClaimed = async (itemId: number) => {
    const { error } = await supabase.from("items").update({ status: "claimed" }).eq("id", itemId);
    if (!error) { updateItemStatus(itemId, "claimed"); alert(markedClaimedText); }
  };

  const handleOpenChat = (item: any) => {
    if (!user) return alert(signInText);
    if (user.id === item.authorId) return;
    const conversationId = getConversationId(
      { id: String(item.id), title: item.name },
      { uid: user.id, displayName: user.fullName || "Me" },
      { uid: item.authorId, displayName: item.authorName || "Finder" }
    );
    setActiveChat({ conversationId, item, otherUser: { uid: item.authorId, displayName: item.authorName || "Finder" } });
  };

  if (!isReady) return <div className="content dashboard-page"><div className="items-container"></div></div>;

  return (
    <div className="content dashboard-page">

      {/* ── Search bar ── */}
      <div style={{ width: "100%", maxWidth: 600, margin: "0 auto 24px", padding: "0 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12,
          padding: "10px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item name, description, color, brand..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#0f172a", background: "transparent", fontFamily: "inherit" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 0, lineHeight: 1 }}>x</button>
          )}
        </div>
        {searchQuery && (
          <p style={{ margin: "6px 0 0 4px", fontSize: 12, color: "#94a3b8" }}>
            {filteredItems.filter(i => i.status !== "claimed").length} result{filteredItems.filter(i => i.status !== "claimed").length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      <div className="items-container">
        {filteredItems
          .filter((i) => i.status !== "claimed")
          .map((item) => {
            const currentStatus = item.status || "waiting";
            const isOwner = user?.id === item.authorId;
            return (
              <div key={item.id} className="item-card">
                <img src={item.image} alt={item.name} className="item-image" />
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="posted-by" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", fontSize: "0.85rem", color: "#666" }}>
                    {item.authorAvatar && <img src={item.authorAvatar} alt="User" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />}
                    <span>{foundByText} {item.authorName || "Anonymous"}</span>
                  </div>
                </div>
                <div className="button-group" style={{ marginTop: "15px" }}>
                  {currentStatus === "waiting" && (
                    <button className="retrieve-button" onClick={() => handleRetrieve(item)}>{retrieveText}</button>
                  )}
                  {currentStatus === "pending" && (isOwner ? (
                    <button className="confirm-button" style={{ backgroundColor: "#28a745", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer" }} onClick={() => handleConfirmClaimed(item.id)}>{confirmText}</button>
                  ) : (
                    <button className="pending-button" disabled style={{ backgroundColor: "#ccc", color: "#666", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "not-allowed" }}>{pendingText}</button>
                  ))}
                  {!isOwner && (
                    <button onClick={() => handleOpenChat(item)} style={{ backgroundColor: "#2563eb", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", marginTop: "8px", width: "100%", fontFamily: "inherit", fontSize: "14px", fontWeight: 600 }}>
                      Message Finder
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        {filteredItems.filter(i => i.status !== "claimed").length === 0 && searchQuery && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
            <p style={{ fontSize: 15 }}>No items found for "{searchQuery}"</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Try different keywords like color, type, or brand</p>
          </div>
        )}
      </div>

      {activeChat && user && (
        <ChatModal
          conversationId={activeChat.conversationId}
          item={activeChat.item}
          currentUser={{ uid: user.id, displayName: user.fullName || "Me" }}
          otherUser={activeChat.otherUser}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}