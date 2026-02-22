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

interface ChatUser {
  uid: string;
  displayName: string;
}

interface ChatItem {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface ActiveChat {
  conversationId: string;
  item: ChatItem;
  otherUser: ChatUser;
}

interface ChatModalProps {
  conversationId: string;
  item: ChatItem;
  currentUser: ChatUser;
  otherUser: ChatUser;
  onClose: () => void;
}

function ChatModal({ conversationId, item, currentUser, otherUser, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        // Only add if not already in list (avoid duplicate from optimistic update)
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === (payload.new as Message).id);
          return exists ? prev : [...prev, payload.new as Message];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const trimmed = text.trim();
    setText("");

    // Optimistically add message immediately so sender sees it right away
    const optimistic: Message = {
      id: Date.now(), // temp ID
      conversation_id: conversationId,
      sender_id: currentUser.uid,
      sender_name: currentUser.displayName,
      receiver_id: otherUser.uid,
      item_id: String(item.id),
      item_title: item.name,
      text: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_id: currentUser.uid,
      sender_name: currentUser.displayName,
      receiver_id: otherUser.uid,
      receiver_name: otherUser.displayName, // store receiver name so they see it correctly
      item_id: String(item.id),
      item_title: item.name,
      text: trimmed,
      read: false,
    });

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480,
          height: 520, display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "14px 16px", borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", gap: 10, background: "#fff",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", background: "#2563eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0,
          }}>
            {otherUser.displayName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
              {otherUser.displayName}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{item.name}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", fontSize: 20,
              cursor: "pointer", color: "#94a3b8", lineHeight: 1,
            }}
          >x</button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "16px",
          display: "flex", flexDirection: "column", gap: 4, background: "#f8fafc",
        }}>
          {messages.length === 0 && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8, color: "#94a3b8",
            }}>
              <p style={{ fontSize: 13 }}>Say hi about <strong>{item.name}</strong></p>
            </div>
          )}
          {messages.map((msg) => {
            const isOwn = msg.sender_id === currentUser.uid;
            const time = new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit", minute: "2-digit",
            });
            return (
              <div key={msg.id} style={{
                display: "flex", flexDirection: "column",
                alignItems: isOwn ? "flex-end" : "flex-start", marginBottom: 6,
              }}>
                <div style={{
                  maxWidth: "75%", padding: "9px 13px",
                  borderRadius: isOwn ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
                  background: isOwn ? "#2563eb" : "#fff",
                  color: isOwn ? "#fff" : "#0f172a",
                  fontSize: 14, lineHeight: 1.5, wordBreak: "break-word",
                  boxShadow: isOwn ? "0 2px 8px rgba(37,99,235,0.2)" : "0 1px 4px rgba(0,0,0,0.08)",
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{time}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          display: "flex", gap: 8, padding: "12px 14px",
          borderTop: "1px solid #e2e8f0", background: "#fff", alignItems: "flex-end",
        }}>
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            style={{
              flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 20,
              padding: "9px 14px", fontSize: 14, resize: "none",
              fontFamily: "inherit", outline: "none", lineHeight: 1.5,
              background: "#f8fafc", color: "#0f172a",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            style={{
              width: 38, height: 38, borderRadius: "50%",
              background: text.trim() ? "#2563eb" : "#e2e8f0",
              color: text.trim() ? "#fff" : "#94a3b8",
              border: "none", fontSize: 18, cursor: text.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.15s",
            }}
          >^</button>
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
      setFoundByText("Found by:");
      setRetrieveText("Retrieve");
      setConfirmText("Confirm Claimed");
      setPendingText("Item Claimed (Pending Confirmation)");
      setSignInText("Please sign in to retrieve items");
      setRequestSentText("Request sent! The owner has been notified.");
      setMarkedClaimedText("Item officially marked as claimed!");
      setIsReady(true);
      return;
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
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: key, target: language }),
          });
          if (res.ok) {
            const data = await res.json();
            const translated = data.translatedText || key;
            setter(translated);
            localStorage.setItem(`${cacheKey}_${language}`, translated);
          }
        } catch { /* keep cached */ }
      }
      setIsReady(true);
    };
    translateAndCache();
  }, [language]);

  const handleRetrieve = async (item: any) => {
    if (!user) return alert(signInText);
    const { error } = await supabase
      .from("items")
      .update({ status: "pending", claimer_email: user.primaryEmailAddress?.emailAddress })
      .eq("id", item.id);
    if (error) { console.error("Error updating status:", error.message); return; }
    const templateParams = {
      author_name: item.authorName || "Owner",
      item_name: item.name,
      retriever_name: user.fullName || "A user",
      retriever_email: user.primaryEmailAddress?.emailAddress,
      to_email: item.authorEmail,
    };
    emailjs
      .send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        templateParams,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      )
      .then(() => console.log("Email sent!"))
      .catch((err) => console.error("Email failed:", err));
    updateItemStatus(item.id, "pending", user.primaryEmailAddress?.emailAddress);
    alert(requestSentText);
  };

  const handleConfirmClaimed = async (itemId: number) => {
    const { error } = await supabase.from("items").update({ status: "claimed" }).eq("id", itemId);
    if (!error) { updateItemStatus(itemId, "claimed"); alert(markedClaimedText); }
    else console.error("Confirm error:", error.message);
  };

  const handleOpenChat = (item: any) => {
    if (!user) return alert(signInText);
    if (user.id === item.authorId) return;
    const conversationId = getConversationId(
      { id: String(item.id), title: item.name },
      { uid: user.id, displayName: user.fullName || "Me" },
      { uid: item.authorId, displayName: item.authorName || "Finder" }
    );
    setActiveChat({
      conversationId,
      item,
      otherUser: { uid: item.authorId, displayName: item.authorName || "Finder" },
    });
  };

  if (!isReady) {
    return <div className="content dashboard-page"><div className="items-container"></div></div>;
  }

  return (
    <div className="content dashboard-page">
      <div id="main-content" className="items-container">
        {items &&
          items
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
                    <div className="posted-by" style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      marginTop: "10px", fontSize: "0.85rem", color: "#666",
                    }}>
                      {item.authorAvatar && (
                        <img src={item.authorAvatar} alt="User"
                          style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
                      )}
                      <span>{foundByText} {item.authorName || "Anonymous"}</span>
                    </div>
                  </div>

                  <div className="button-group" style={{ marginTop: "15px" }}>
                    {currentStatus === "waiting" && (
                      <button className="retrieve-button" onClick={() => handleRetrieve(item)}>
                        {retrieveText}
                      </button>
                    )}
                    {currentStatus === "pending" && (
                      isOwner ? (
                        <button
                          className="confirm-button"
                          style={{ backgroundColor: "#28a745", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer" }}
                          onClick={() => handleConfirmClaimed(item.id)}
                        >
                          {confirmText}
                        </button>
                      ) : (
                        <button
                          className="pending-button"
                          disabled
                          style={{ backgroundColor: "#ccc", color: "#666", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "not-allowed" }}
                        >
                          {pendingText}
                        </button>
                      )
                    )}
                    {!isOwner && (
                      <button
                        onClick={() => handleOpenChat(item)}
                        style={{
                          backgroundColor: "#2563eb", color: "white", border: "none",
                          padding: "10px 20px", borderRadius: "5px", cursor: "pointer",
                          marginTop: "8px", width: "100%", fontFamily: "inherit",
                          fontSize: "14px", fontWeight: 600,
                        }}
                      >
                        Message Finder
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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