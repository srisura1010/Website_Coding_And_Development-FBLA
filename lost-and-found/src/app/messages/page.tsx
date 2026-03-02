"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";
import { FaFlag, FaShieldHalved } from "react-icons/fa6";

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
  otherUserEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
  isAdminConv?: boolean;
}

interface Admin {
  id: string;
  email: string;
  name: string | null;
}

const USER_REPORT_REASONS = [
  "Harassment or threats",
  "Spam or scam",
  "Fake or misleading identity",
  "Inappropriate messages",
  "Other",
];

async function t(text: string, language: string): Promise<string> {
  if (language === "en") return text;
  const cacheKey = `msg_ui_${language}_${text.slice(0, 40)}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target: language }),
    });
    if (res.ok) {
      const data = await res.json();
      const translated = data.translatedText || text;
      localStorage.setItem(cacheKey, translated);
      return translated;
    }
  } catch { /* keep original */ }
  return text;
}

function ReportUserModal({
  reportedUserId,
  reportedUserName,
  reportedUserEmail,
  currentUser,
  onClose,
}: {
  reportedUserId: string;
  reportedUserName: string;
  reportedUserEmail: string;
  currentUser: { id: string; fullName: string | null; email: string };
  onClose: () => void;
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason || submitting) return;
    setSubmitting(true);
    await supabase.from("user_reports").insert({
      reporter_id: currentUser.id,
      reporter_name: currentUser.fullName || "Anonymous",
      reporter_email: currentUser.email,
      reported_user_id: reportedUserId,
      reported_user_name: reportedUserName,
      reported_user_email: reportedUserEmail,
      reason: selectedReason,
    });
    setDone(true);
    setSubmitting(false);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="panel-success">
            <span className="panel-success__icon">✓</span>
            <p>Report submitted</p>
          </div>
        ) : (
          <>
            <p className="report-modal__title">Report {reportedUserName}</p>
            <p className="report-modal__subtitle">Why are you reporting this user?</p>
            <div className="report-modal__reasons">
              {USER_REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  className={`report-modal__reason${selectedReason === reason ? " report-modal__reason--selected" : ""}`}
                  onClick={() => setSelectedReason(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="report-modal__actions">
              <button className="report-modal__cancel" onClick={onClose}>Cancel</button>
              <button
                className="report-modal__submit"
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Contact Admin Modal ──────────────────────────────────────────────────────
function ContactAdminModal({
  admins,
  loading,
  onSelect,
  onClose,
}: {
  admins: Admin[];
  loading: boolean;
  onSelect: (admin: Admin) => void;
  onClose: () => void;
}) {
  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 320 }}>
        <p className="report-modal__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FaShieldHalved style={{ color: "#2563eb" }} />
          Contact an Admin
        </p>
        <p className="report-modal__subtitle">Select an admin to start a conversation.</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>Loading admins…</div>
        ) : admins.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>No admins available right now.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0" }}>
            {admins.map((admin) => (
              <button
                key={admin.id}
                onClick={() => onSelect(admin)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", background: "#f8fafc",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563eb";
                  (e.currentTarget as HTMLButtonElement).style.background = "#eff6ff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
                  (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>
                  {(admin.name || admin.email)[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                    {admin.name || "Admin"}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{admin.email}</div>
                </div>
                <div style={{
                  marginLeft: "auto", fontSize: 11, fontWeight: 600,
                  color: "#2563eb", background: "#eff6ff",
                  padding: "2px 8px", borderRadius: 99,
                }}>
                  Admin
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="report-modal__actions" style={{ marginTop: 4 }}>
          <button className="report-modal__cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { language } = useSettings();

  const [banChecked, setBanChecked] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [reportingUser, setReportingUser] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [isReady, setIsReady] = useState(false);
  const [uiMessagesTitle, setUiMessagesTitle]           = useState("Messages");
  const [uiNoConversations, setUiNoConversations]       = useState("No conversations yet.");
  const [uiSelectConversation, setUiSelectConversation] = useState("Select a conversation to start chatting");
  const [uiStartConversation, setUiStartConversation]   = useState("Start the conversation!");
  const [uiTypePlaceholder, setUiTypePlaceholder]       = useState("Type a message…");

  useEffect(() => {
    const translateUI = async () => {
      setIsReady(false);
      const [
        messagesTitle, noConversations, selectConversation,
        startConversation, typePlaceholder,
      ] = await Promise.all([
        t("Messages", language),
        t("No conversations yet.", language),
        t("Select a conversation to start chatting", language),
        t("Start the conversation!", language),
        t("Type a message…", language),
      ]);
      setUiMessagesTitle(messagesTitle);
      setUiNoConversations(noConversations);
      setUiSelectConversation(selectConversation);
      setUiStartConversation(startConversation);
      setUiTypePlaceholder(typePlaceholder);
      setIsReady(true);
    };
    translateUI();
  }, [language]);

  useEffect(() => {
    if (isLoaded && !user) router.push("/");
  }, [isLoaded, user, router]);

  // ── Ban check ──
  useEffect(() => {
    if (!user) { setBanChecked(true); return; }
    const checkBan = async () => {
      const { data } = await supabase
        .from("banned_users")
        .select("email, suspended_until")
        .eq("email", user.primaryEmailAddress?.emailAddress)
        .single();
      if (data) {
        const isPermanent = !data.suspended_until;
        const isSuspended = data.suspended_until && new Date(data.suspended_until) > new Date();
        if (isPermanent || isSuspended) {
          router.push("/banned");
          return;
        }
      }
      setBanChecked(true);
    };
    checkBan();
  }, [user]);

  // ── Fetch admins when modal opens ──
  const handleOpenAdminModal = async () => {
    setShowAdminModal(true);
    setAdminsLoading(true);
    const { data } = await supabase.from("admins").select("id, email, name");
    setAdmins(data ?? []);
    setAdminsLoading(false);
  };

  // ── Start or resume a conversation with a chosen admin ──
  const handleSelectAdmin = async (admin: Admin) => {
    if (!user) return;
    setShowAdminModal(false);

    // Use a stable conv ID so repeat contacts re-open the same thread
    const convId = `admin_${[user.id, admin.id].sort().join("_")}`;

    // Check if this conversation already exists in our local list
    const existing = conversations.find((c) => c.conversation_id === convId);
    if (!existing) {
      // Seed the conversation list entry optimistically so it appears immediately
      setConversations((prev) => [
        {
          conversation_id: convId,
          item_title: "Admin Support",
          otherUserId: admin.id,
          otherUserName: admin.name || "Admin",
          otherUserEmail: admin.email,
          lastMessage: "",
          lastMessageAt: new Date().toISOString(),
          unread: false,
          isAdminConv: true,
        },
        ...prev,
      ]);
    }

    setActiveConvId(convId);
    setReportingUser(false);
  };

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      const { data: sent } = await supabase
        .from("chat_messages").select("*")
        .eq("sender_id", user.id).order("created_at", { ascending: false });

      const { data: received } = await supabase
        .from("chat_messages").select("*")
        .eq("receiver_id", user.id).order("created_at", { ascending: false });

      const all = [...(sent ?? []), ...(received ?? [])];
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (!all.length) return;

      const convMap = new Map<string, Conversation>();
      for (const msg of all) {
        if (!convMap.has(msg.conversation_id)) {
          const isOwn = msg.sender_id === user.id;
          const isAdminConv = msg.conversation_id.startsWith("admin_");
          convMap.set(msg.conversation_id, {
            conversation_id: msg.conversation_id,
            item_title: isAdminConv ? "Admin Support" : msg.item_title,
            otherUserId: isOwn ? msg.receiver_id : msg.sender_id,
            otherUserName: isOwn ? (msg.receiver_name || msg.receiver_id) : msg.sender_name,
            otherUserEmail: isOwn ? (msg.receiver_email || "") : (msg.sender_email || ""),
            lastMessage: msg.text,
            lastMessageAt: msg.created_at,
            unread: !msg.read && msg.receiver_id === user.id,
            isAdminConv,
          });
        }
      }

      const convList = Array.from(convMap.values());
      if (language !== "en") {
        await Promise.all(
          convList.map(async (conv) => {
            const [title, lastMsg] = await Promise.all([
              t(conv.item_title, language),
              t(conv.lastMessage, language),
            ]);
            conv.item_title = title;
            conv.lastMessage = lastMsg;
          })
        );
      }

      setConversations(convList);
    };

    fetchConversations();

    const channel = supabase
      .channel("messages-page-convos")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => fetchConversations())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, language]);

  useEffect(() => {
    if (!activeConvId || !user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages").select("*")
        .eq("conversation_id", activeConvId).order("created_at", { ascending: true });

      if (data) {
        if (language !== "en") {
          const translated = await Promise.all(
            data.map(async (msg) => {
              const translatedText = await t(msg.text, language);
              return { ...msg, text: translatedText };
            })
          );
          setMessages(translated);
        } else {
          setMessages(data);
        }
      }

      await supabase.from("chat_messages").update({ read: true })
        .eq("conversation_id", activeConvId).eq("receiver_id", user.id);

      setConversations((prev) =>
        prev.map((c) => c.conversation_id === activeConvId ? { ...c, unread: false } : c)
      );
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages-page-chat:${activeConvId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `conversation_id=eq.${activeConvId}`,
      }, async (payload) => {
        const newMsg = payload.new as Message;
        const translatedText = language !== "en" ? await t(newMsg.text, language) : newMsg.text;
        setMessages((prev) => [...prev, { ...newMsg, text: translatedText }]);
        if (newMsg.receiver_id === user.id) {
          supabase.from("chat_messages").update({ read: true }).eq("id", newMsg.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvId, user, language]);

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
      sender_email: user.primaryEmailAddress?.emailAddress || "",
      receiver_id: activeConv.otherUserId,
      receiver_name: activeConv.otherUserName,
      receiver_email: activeConv.otherUserEmail,
      // For admin convs there's no item; use a placeholder
      item_id: activeConv.isAdminConv ? "admin-support" : activeConv.conversation_id.split("_")[0],
      item_title: activeConv.isAdminConv ? "Admin Support" : activeConv.item_title,
      text: trimmed,
      read: false,
    });
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!banChecked || !isLoaded || !user || !isReady) return null;

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
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
            {uiMessagesTitle}
          </h2>
        </div>

        {/* Contact Admin button */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
          <button
            onClick={handleOpenAdminModal}
            style={{
              width: "100%", padding: "9px 14px",
              background: "linear-gradient(135deg, #eff6ff, #f5f3ff)",
              border: "1.5px solid #c7d2fe", borderRadius: 10,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 8,
              color: "#3730a3", fontWeight: 700, fontSize: 13,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "linear-gradient(135deg, #dbeafe, #ede9fe)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "linear-gradient(135deg, #eff6ff, #f5f3ff)")}
          >
            <FaShieldHalved style={{ fontSize: 14, color: "#2563eb" }} />
            Contact an Admin
          </button>
        </div>

        <div aria-live="polite" aria-relevant="additions" role="log" style={{ flex: 1, overflowY: "auto" }}>
          {conversations.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
              {uiNoConversations}
            </div>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.conversation_id}
              onClick={() => { setActiveConvId(conv.conversation_id); setReportingUser(false); }}
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
                width: 38, height: 38, borderRadius: "50%",
                background: conv.isAdminConv
                  ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                  : "#2563eb",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0,
              }}>
                {conv.isAdminConv ? <FaShieldHalved style={{ fontSize: 14 }} /> : (conv.otherUserName?.[0]?.toUpperCase() ?? "?")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: conv.unread ? 700 : 600, fontSize: 14, color: "#0f172a",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {conv.otherUserName}
                    {conv.isAdminConv && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: "#2563eb",
                        background: "#eff6ff", padding: "1px 6px", borderRadius: 99,
                      }}>Admin</span>
                    )}
                  </span>
                  {conv.unread && (
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#2563eb", flexShrink: 0,
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
                  {conv.lastMessage || "Start the conversation"}
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
            <p>{uiSelectConversation}</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{
              padding: "14px 16px", borderBottom: "1px solid #e2e8f0",
              background: "#fff", display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: activeConv?.isAdminConv
                  ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                  : "#2563eb",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 14,
              }}>
                {activeConv?.isAdminConv
                  ? <FaShieldHalved style={{ fontSize: 14 }} />
                  : (activeConv?.otherUserName?.[0]?.toUpperCase() ?? "?")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  {activeConv?.otherUserName}
                  {activeConv?.isAdminConv && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: "#2563eb",
                      background: "#eff6ff", padding: "2px 7px", borderRadius: 99,
                    }}>Admin</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{activeConv?.item_title}</div>
              </div>
              {/* Only show Report User for non-admin conversations */}
              {!activeConv?.isAdminConv && (
                <button
                  onClick={() => setReportingUser(true)}
                  className="msg-report-btn"
                >
                  <FaFlag style={{ fontSize: 11 }} />
                  Report User
                </button>
              )}
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
                  {activeConv?.isAdminConv ? (
                    <>
                      <FaShieldHalved style={{ fontSize: 32, color: "#c7d2fe", marginBottom: 8 }} />
                      <p style={{ fontSize: 13, textAlign: "center", maxWidth: 220 }}>
                        You're chatting with an admin. Ask anything — they're here to help.
                      </p>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 32 }}>👋</span>
                      <p style={{ fontSize: 13 }}>{uiStartConversation}</p>
                    </>
                  )}
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
                placeholder={uiTypePlaceholder}
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

      {/* Report User Modal */}
      {reportingUser && activeConv && user && (
        <ReportUserModal
          reportedUserId={activeConv.otherUserId}
          reportedUserName={activeConv.otherUserName}
          reportedUserEmail={activeConv.otherUserEmail}
          currentUser={{
            id: user.id,
            fullName: user.fullName,
            email: user.primaryEmailAddress?.emailAddress || "",
          }}
          onClose={() => setReportingUser(false)}
        />
      )}

      {/* Contact Admin Modal */}
      {showAdminModal && (
        <ContactAdminModal
          admins={admins}
          loading={adminsLoading}
          onSelect={handleSelectAdmin}
          onClose={() => setShowAdminModal(false)}
        />
      )}
    </div>
  );
}