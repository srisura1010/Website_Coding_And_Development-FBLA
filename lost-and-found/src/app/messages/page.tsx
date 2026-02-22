// Place this file at: src/app/messages/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  item_id: string;
  item_title: string;
  text: string;
  created_at: string;
  read: boolean;
}

interface Conversation {
  conversation_id: string;
  item_title: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
}

export default function MessagesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !user) router.push("/");
  }, [isLoaded, user, router]);

  // Load all conversations for this user
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      // Fetch as sender
      const { data: sent } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch as receiver
      const { data: received } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false });

      const all = [...(sent ?? []), ...(received ?? [])];
      // Sort combined by newest first
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (!all.length) return;

      // Group into conversations — keep only the latest message per conversation
      const convMap = new Map<string, Conversation>();
      for (const msg of all) {
        if (!convMap.has(msg.conversation_id)) {
          const isOwn = msg.sender_id === user.id;
          convMap.set(msg.conversation_id, {
            conversation_id: msg.conversation_id,
            item_title: msg.item_title,
            // If I sent it, other person is receiver; if I received it, other is sender
            otherUserId: isOwn ? msg.receiver_id : msg.sender_id,
            // Always use sender_name — if I sent it we need receiver name (not stored), so fall back
            otherUserName: isOwn
              ? (msg.receiver_name || msg.receiver_id)
              : msg.sender_name,
            lastMessage: msg.text,
            lastMessageAt: msg.created_at,
            unread: !msg.read && msg.receiver_id === user.id,
          });
        }
      }
      setConversations(Array.from(convMap.values()));
    };

    fetchConversations();

    // Realtime: re-fetch on new incoming message
    const channel = supabase
      .channel("messages-page-convos")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => fetchConversations())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvId || !user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", activeConvId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);

      // Mark as read
      await supabase
        .from("chat_messages")
        .update({ read: true })
        .eq("conversation_id", activeConvId)
        .eq("receiver_id", user.id);

      setConversations((prev) =>
        prev.map((c) =>
          c.conversation_id === activeConvId ? { ...c, unread: false } : c
        )
      );
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages-page-chat:${activeConvId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${activeConvId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        if ((payload.new as Message).receiver_id === user.id) {
          supabase.from("chat_messages").update({ read: true }).eq("id", (payload.new as Message).id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConv = conversations.find((c) => c.conversation_id === activeConvId);

  const handleSend = async () => {
    if (!text.trim() || sending || !activeConv || !user) return;
    setSending(true);
    const trimmed = text.trim();
    setText("");
    await supabase.from("chat_messages").insert({
      conversation_id: activeConvId,
      sender_id: user.id,
      sender_name: user.fullName || "Me",
      receiver_id: activeConv.otherUserId,
      receiver_name: activeConv.otherUserName,
      item_id: activeConv.conversation_id.split("_")[0],
      item_title: activeConv.item_title,
      text: trimmed,
      read: false,
    });
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!isLoaded || !user) return null;

  return (
    <div style={{
      display: "flex", height: "calc(100vh - 60px)",
      fontFamily: "system-ui, sans-serif", background: "#f8fafc",
    }}>
      {/* Sidebar */}
      <div style={{
        width: 300, flexShrink: 0, background: "#fff",
        borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid #f1f5f9" }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Messages</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
              No conversations yet.
            </div>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.conversation_id}
              onClick={() => setActiveConvId(conv.conversation_id)}
              style={{
                width: "100%", padding: "14px 16px",
                background: activeConvId === conv.conversation_id ? "#eff6ff" : "transparent",
                border: "none",
                borderLeft: activeConvId === conv.conversation_id ? "3px solid #2563eb" : "3px solid transparent",
                borderBottom: "1px solid #f8fafc",
                cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: "50%", background: "#2563eb",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0,
              }}>
                {conv.otherUserName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: conv.unread ? 700 : 600, fontSize: 14, color: "#0f172a",
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span>{conv.otherUserName}</span>
                  {conv.unread && (
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#2563eb", flexShrink: 0, marginTop: 4,
                    }} />
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 600, marginTop: 1 }}>
                   {conv.item_title}
                </div>
                <div style={{
                  fontSize: 13, color: "#64748b", marginTop: 1,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  fontWeight: conv.unread ? 600 : 400,
                }}>
                  {conv.lastMessage}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!activeConvId ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", color: "#94a3b8",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div style={{
              padding: "14px 16px", borderBottom: "1px solid #e2e8f0",
              background: "#fff", display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%", background: "#2563eb",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 14,
              }}>
                {activeConv?.otherUserName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                  {activeConv?.otherUserName}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}> {activeConv?.item_title}</div>
              </div>
            </div>

            <div style={{
              flex: 1, overflowY: "auto", padding: 16,
              display: "flex", flexDirection: "column", gap: 4, background: "#f8fafc",
            }}>
              {messages.length === 0 && (
                <div style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", color: "#94a3b8",
                }}>
                  <span style={{ fontSize: 32 }}>👋</span>
                  <p style={{ fontSize: 13 }}>Start the conversation!</p>
                </div>
              )}
              {messages.map((msg) => {
                const isOwn = msg.sender_id === user.id;
                const time = new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit",
                });
                return (
                  <div key={msg.id} style={{
                    display: "flex", flexDirection: "column",
                    alignItems: isOwn ? "flex-end" : "flex-start", marginBottom: 6,
                  }}>
                    <div style={{
                      maxWidth: "72%", padding: "9px 13px",
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

            <div style={{
              display: "flex", gap: 8, padding: "12px 16px",
              borderTop: "1px solid #e2e8f0", background: "#fff", alignItems: "flex-end",
            }}>
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
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
              >↑</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}