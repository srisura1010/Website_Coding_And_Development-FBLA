"use client";

import "./dashboard.css";
import { useItems } from "@/context/ItemsContext";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import emailjs from "@emailjs/browser";
import { useSettings } from "@/context/SettingsContext";
import { useEffect, useState, useRef } from "react";
import { getConversationId } from "@/app/components/MessagingSystem";
import { FaHandshakeAngle } from "react-icons/fa6";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
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

type TabId = "items" | "add-item" | "become-admin" | "admin-login";

const SIDEBAR_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "items", label: "Items", icon: "📦" },
  { id: "add-item", label: "Add Item", icon: "＋" },
  { id: "become-admin", label: "Become an Admin", icon: <FaHandshakeAngle /> },
  { id: "admin-login", label: "Admin", icon: "🔐" },
];

// ─────────────────────────────────────────────
// Chat Modal
// ─────────────────────────────────────────────
function ChatModal({
  conversationId,
  item,
  currentUser,
  otherUser,
  onClose,
}: {
  conversationId: string;
  item: ChatItem;
  currentUser: ChatUser;
  otherUser: ChatUser;
  onClose: () => void;
}) {
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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) =>
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as Message).id)
              ? prev
              : [...prev, payload.new as Message],
          ),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const trimmed = text.trim();
    setText("");
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        conversation_id: conversationId,
        sender_id: currentUser.uid,
        sender_name: currentUser.displayName,
        receiver_id: otherUser.uid,
        item_id: String(item.id),
        item_title: item.name,
        text: trimmed,
        created_at: new Date().toISOString(),
      },
    ]);
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_id: currentUser.uid,
      sender_name: currentUser.displayName,
      receiver_id: otherUser.uid,
      receiver_name: otherUser.displayName,
      item_id: String(item.id),
      item_title: item.name,
      text: trimmed,
      read: false,
    });
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal__header">
          <div className="chat-modal__avatar">
            {otherUser.displayName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="chat-modal__header-info">
            <div className="chat-modal__name">{otherUser.displayName}</div>
            <div className="chat-modal__item">{item.name}</div>
          </div>
          <button className="chat-modal__close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="chat-modal__messages">
          {messages.length === 0 && (
            <div className="chat-modal__empty">
              <p>
                Say hi about <strong>{item.name}</strong>
              </p>
            </div>
          )}
          {messages.map((msg) => {
            const isOwn = msg.sender_id === currentUser.uid;
            return (
              <div
                key={msg.id}
                className={`chat-bubble-wrapper${isOwn ? " chat-bubble-wrapper--own" : ""}`}
              >
                <div
                  className={`chat-bubble${isOwn ? " chat-bubble--own" : " chat-bubble--other"}`}
                >
                  {msg.text}
                </div>
                <span className="chat-bubble__time">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="chat-modal__input-row">
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="chat-modal__textarea"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className={`chat-modal__send${text.trim() ? " chat-modal__send--active" : ""}`}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Become Admin Panel
// ─────────────────────────────────────────────
function AdminPanel() {
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    school: "",
    teacherId: "",
    extraInfo: "",
  });
  const [adminFile, setAdminFile] = useState<File | null>(null);
  const [adminUploading, setAdminUploading] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminUploading(true);
    try {
      let idImageUrl = "";
      if (adminFile) {
        const fileName = `admin_${Date.now()}_${adminFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(fileName, adminFile);
        if (uploadError) {
          console.error(uploadError.message);
          return;
        }
        const { data: urlData } = supabase.storage
          .from("item-images")
          .getPublicUrl(fileName);
        idImageUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("admin_requests").insert([
        {
          name: adminForm.name,
          email: adminForm.email,
          school: adminForm.school,
          teacher_id: adminForm.teacherId,
          extra_info: adminForm.extraInfo,
          id_image_url: idImageUrl,
          status: "pending",
        },
      ]);
      if (error) {
        console.error(error.message);
        return;
      }
      setAdminSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setAdminUploading(false);
    }
  };

  return (
    <div className="panel-content">
      <div className="panel-section-title">Become an Admin</div>
      {adminSuccess ? (
        <div className="panel-success">
          <span className="panel-success__icon">✓</span>
          <p>Request submitted!</p>
          <p className="panel-success__sub">
            We'll review and get back to you.
          </p>
        </div>
      ) : (
        <form className="panel-form" onSubmit={handleAdminSubmit}>
          <label className="panel-form__label">Full Name</label>
          <input
            className="panel-form__input"
            type="text"
            placeholder="Jane Smith"
            required
            value={adminForm.name}
            onChange={(e) =>
              setAdminForm((p) => ({ ...p, name: e.target.value }))
            }
          />
          <label className="panel-form__label">Email</label>
          <input
            className="panel-form__input"
            type="email"
            placeholder="jane@school.edu"
            required
            value={adminForm.email}
            onChange={(e) =>
              setAdminForm((p) => ({ ...p, email: e.target.value }))
            }
          />
          <label className="panel-form__label">School / Institution</label>
          <input
            className="panel-form__input"
            type="text"
            placeholder="Lincoln High School"
            required
            value={adminForm.school}
            onChange={(e) =>
              setAdminForm((p) => ({ ...p, school: e.target.value }))
            }
          />
          <label className="panel-form__label">Teacher ID / Staff Number</label>
          <input
            className="panel-form__input"
            type="text"
            placeholder="T-00123"
            required
            value={adminForm.teacherId}
            onChange={(e) =>
              setAdminForm((p) => ({ ...p, teacherId: e.target.value }))
            }
          />
          <label className="panel-form__label">Upload ID or Badge Photo</label>
          <input
            className="panel-form__file"
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) setAdminFile(e.target.files[0]);
            }}
          />
          {adminFile && (
            <div className="panel-form__preview-wrap">
              <img
                src={URL.createObjectURL(adminFile)}
                alt="preview"
                className="panel-form__preview"
              />
              <button
                type="button"
                className="panel-form__preview-remove"
                onClick={() => setAdminFile(null)}
              >
                ×
              </button>
            </div>
          )}
          <label className="panel-form__label">
            Anything else we should know?
          </label>
          <textarea
            className="panel-form__textarea"
            placeholder="e.g. I run the lost & found office, dept head since 2019..."
            value={adminForm.extraInfo}
            onChange={(e) =>
              setAdminForm((p) => ({ ...p, extraInfo: e.target.value }))
            }
          />
          <div className="admin-form__notice">
            <span className="admin-form__notice-icon">ℹ️</span>
            Submissions are reviewed manually. You'll be notified at your email.
          </div>
          <button
            type="submit"
            className="panel-form__submit"
            disabled={adminUploading}
          >
            {adminUploading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Admin Login Panel
// On success, saves isAdmin to localStorage so it persists
// across refreshes and page navigation.
// ─────────────────────────────────────────────
function AdminLoginPanel({ onUnlock }: { onUnlock: () => void }) {
  const { user } = useUser();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError("");
    const { data, error: dbError } = await supabase
      .from("admins")
      .select("id")
      .eq("email", user?.primaryEmailAddress?.emailAddress)
      .eq("password", password)
      .single();
    if (dbError || !data) {
      setError("Incorrect password or not approved yet.");
    } else {
      localStorage.setItem("findr_is_admin", "true");
      setUnlocked(true);
      onUnlock();
    }
    setChecking(false);
  };

  if (unlocked) {
    return (
      <div className="panel-content">
        <div className="panel-success">
          <span className="panel-success__icon">✓</span>
          <p>Admin view unlocked!</p>
          <p className="panel-success__sub">
            Delete buttons are now visible on all items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-content">
      <div className="panel-section-title">Admin Access</div>
      <p className="admin-login__hint">
        Enter the password from your approval email.
      </p>
      <form className="panel-form" onSubmit={handleCheck}>
        <label className="panel-form__label">Admin Password</label>
        <input
          className="panel-form__input"
          type="password"
          placeholder="e.g. FINDR-JANE-X4K2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="admin-login__error">{error}</p>}
        <button
          type="submit"
          className="panel-form__submit"
          disabled={checking}
        >
          {checking ? "Checking..." : "Unlock Admin View"}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const { items, addItem, updateItemStatus } = useItems();
  const { user } = useUser();
  const { language } = useSettings();

  const [activeTab, setActiveTab] = useState<TabId>("items");
  const [isReady, setIsReady] = useState(false);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // isAdmin is read from localStorage on load so it persists across refreshes
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("findr_is_admin") === "true";
    }
    return false;
  });

  // Keep localStorage in sync whenever isAdmin changes
  useEffect(() => {
    localStorage.setItem("findr_is_admin", String(isAdmin));
  }, [isAdmin]);

  // Add Item form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // ── Translations ──────────────────────────
  const [addItemText, setAddItemText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`nav_addItem_${language}`) || "+ Add Item"
      : "+ Add Item",
  );
  const [reportFoundText, setReportFoundText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`nav_reportFound_${language}`) ||
        "Report Found Item"
      : "Report Found Item",
  );
  const [itemNameText, setItemNameText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`nav_itemName_${language}`) || "Item Name"
      : "Item Name",
  );
  const [descriptionText, setDescriptionText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`nav_description_${language}`) ||
        "Description (location, time, etc)"
      : "Description (location, time, etc)",
  );
  const [cancelText, setCancelText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`nav_cancel_${language}`) || "Cancel"
      : "Cancel",
  );
  const [postItemText, setPostItemText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`nav_postItem_${language}`) || "Post Item"
      : "Post Item",
  );
  const [uploadingText, setUploadingText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`nav_uploading_${language}`) || "Uploading..."
      : "Uploading...",
  );
  const [foundByText, setFoundByText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`dash_foundBy_${language}`) || "Found by:"
      : "Found by:",
  );
  const [retrieveText, setRetrieveText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`dash_retrieve_${language}`) || "Retrieve"
      : "Retrieve",
  );
  const [confirmText, setConfirmText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`dash_confirm_${language}`) || "Confirm Claimed"
      : "Confirm Claimed",
  );
  const [pendingText, setPendingText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`dash_pending_${language}`) ||
        "Item Claimed (Pending Confirmation)"
      : "Item Claimed (Pending Confirmation)",
  );
  const [signInText, setSignInText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`dash_signIn_${language}`) ||
        "Please sign in to retrieve items"
      : "Please sign in to retrieve items",
  );
  const [requestSentText, setRequestSentText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`dash_requestSent_${language}`) ||
        "Request sent! The owner has been notified."
      : "Request sent! The owner has been notified.",
  );
  const [markedClaimedText, setMarkedClaimedText] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`dash_markedClaimed_${language}`) ||
        "Item officially marked as claimed!"
      : "Item officially marked as claimed!",
  );

  useEffect(() => {
    if (language === "en") {
      setAddItemText("+ Add Item");
      setReportFoundText("Report Found Item");
      setItemNameText("Item Name");
      setDescriptionText("Description (location, time, etc)");
      setCancelText("Cancel");
      setPostItemText("Post Item");
      setUploadingText("Uploading...");
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
        { key: "+ Add Item", setter: setAddItemText, cacheKey: "nav_addItem" },
        {
          key: "Report Found Item",
          setter: setReportFoundText,
          cacheKey: "nav_reportFound",
        },
        { key: "Item Name", setter: setItemNameText, cacheKey: "nav_itemName" },
        {
          key: "Description (location, time, etc)",
          setter: setDescriptionText,
          cacheKey: "nav_description",
        },
        { key: "Cancel", setter: setCancelText, cacheKey: "nav_cancel" },
        { key: "Post Item", setter: setPostItemText, cacheKey: "nav_postItem" },
        {
          key: "Uploading...",
          setter: setUploadingText,
          cacheKey: "nav_uploading",
        },
        { key: "Found by:", setter: setFoundByText, cacheKey: "dash_foundBy" },
        { key: "Retrieve", setter: setRetrieveText, cacheKey: "dash_retrieve" },
        {
          key: "Confirm Claimed",
          setter: setConfirmText,
          cacheKey: "dash_confirm",
        },
        {
          key: "Item Claimed (Pending Confirmation)",
          setter: setPendingText,
          cacheKey: "dash_pending",
        },
        {
          key: "Please sign in to retrieve items",
          setter: setSignInText,
          cacheKey: "dash_signIn",
        },
        {
          key: "Request sent! The owner has been notified.",
          setter: setRequestSentText,
          cacheKey: "dash_requestSent",
        },
        {
          key: "Item officially marked as claimed!",
          setter: setMarkedClaimedText,
          cacheKey: "dash_markedClaimed",
        },
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
            const t = data.translatedText || key;
            setter(t);
            localStorage.setItem(`${cacheKey}_${language}`, t);
          }
        } catch {
          /* keep cached */
        }
      }
      setIsReady(true);
    };
    translateAndCache();
  }, [language]);

  // ── Filtered items ────────────────────────
  const filteredItems = searchQuery.trim()
    ? (items ?? []).filter((item) => {
        const q = searchQuery.toLowerCase();
        const haystack =
          `${item.name} ${item.description} ${(item as any).aiKeywords ?? ""}`.toLowerCase();
        return (
          haystack.includes(q) ||
          q.split(/\s+/).some((word) => haystack.includes(word))
        );
      })
    : (items ?? []);

  // ── Handlers ─────────────────────────────
  const handleRetrieve = async (item: any) => {
    if (!user) return alert(signInText);
    const { error } = await supabase
      .from("items")
      .update({
        status: "pending",
        claimer_email: user.primaryEmailAddress?.emailAddress,
      })
      .eq("id", item.id);
    if (error) {
      console.error(error.message);
      return;
    }
    emailjs
      .send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          author_name: item.authorName || "Owner",
          item_name: item.name,
          retriever_name: user.fullName || "A user",
          retriever_email: user.primaryEmailAddress?.emailAddress,
          to_email: item.authorEmail,
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!,
      )
      .catch(console.error);
    updateItemStatus(
      item.id,
      "pending",
      user.primaryEmailAddress?.emailAddress,
    );
    alert(requestSentText);
  };

  const handleConfirmClaimed = async (itemId: number) => {
    const { error } = await supabase
      .from("items")
      .update({ status: "claimed" })
      .eq("id", itemId);
    if (!error) {
      updateItemStatus(itemId, "claimed");
      alert(markedClaimedText);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm("Delete this item permanently?")) return;
    const { error } = await supabase.from("items").delete().eq("id", itemId);
    if (!error) updateItemStatus(itemId, "claimed");
  };

  const handleOpenChat = (item: any) => {
    if (!user) return alert(signInText);
    if (user.id === item.authorId) return;
    const conversationId = getConversationId(
      { id: String(item.id), title: item.name },
      { uid: user.id, displayName: user.fullName || "Me" },
      { uid: item.authorId, displayName: item.authorName || "Finder" },
    );
    setActiveChat({
      conversationId,
      item,
      otherUser: {
        uid: item.authorId,
        displayName: item.authorName || "Finder",
      },
    });
  };

  const extractKeywords = async (file: File): Promise<string> => {
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      if (!res.ok) return "";
      const { keywords } = await res.json();
      return keywords ?? "";
    } catch {
      return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemDesc || !selectedFile || !user) return;
    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const [uploadResult, aiKeywords] = await Promise.all([
        supabase.storage.from("item-images").upload(fileName, selectedFile),
        extractKeywords(selectedFile),
      ]);
      if (uploadResult.error) {
        console.error("Upload error:", uploadResult.error.message);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("item-images")
        .getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;
      const { data: insertedItem, error: insertError } = await supabase
        .from("items")
        .insert([
          {
            name: newItemName,
            description: newItemDesc,
            image_url: imageUrl,
            author_name: user.fullName || user.username || "Anonymous",
            author_avatar: user.imageUrl,
            author_id: user.id,
            author_email: user.primaryEmailAddress?.emailAddress,
            status: "waiting",
            ai_keywords: aiKeywords,
          },
        ])
        .select()
        .single();
      if (insertError) {
        console.error("Insert error:", insertError.message);
        return;
      }
      addItem({
        id: insertedItem.id,
        name: insertedItem.name,
        description: insertedItem.description,
        image: insertedItem.image_url,
        authorName: insertedItem.author_name,
        authorAvatar: insertedItem.author_avatar,
        status: insertedItem.status,
        authorId: insertedItem.author_id,
        authorEmail: insertedItem.author_email || "",
        aiKeywords: insertedItem.ai_keywords || "",
      } as any);
      setNewItemName("");
      setNewItemDesc("");
      setSelectedFile(null);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setActiveTab("items");
      }, 1500);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // ─────────────────────────────────────────
  // renderPanel
  // ─────────────────────────────────────────
  const renderPanel = () => {
    switch (activeTab) {
      case "items":
        return (
          <div className="panel-content">
            <div className="panel-section-title">All Items</div>
            <div className="panel-search">
              <svg
                className="panel-search__icon"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="panel-search__input"
              />
              {searchQuery && (
                <button
                  className="panel-search__clear"
                  onClick={() => setSearchQuery("")}
                >
                  ×
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="panel-search__count">
                {filteredItems.filter((i) => i.status !== "claimed").length}{" "}
                result
                {filteredItems.filter((i) => i.status !== "claimed").length !==
                1
                  ? "s"
                  : ""}
              </p>
            )}
            <div className="panel-item-list">
              {filteredItems
                .filter((i) => i.status !== "claimed")
                .map((item) => (
                  <div
                    key={item.id}
                    className="panel-item-chip"
                    onClick={() =>
                      document
                        .getElementById(`item-${item.id}`)
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        })
                    }
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="panel-item-chip__img"
                    />
                    <div className="panel-item-chip__info">
                      <span className="panel-item-chip__name">{item.name}</span>
                      <span
                        className={`panel-item-chip__status panel-item-chip__status--${item.status}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              {filteredItems.filter((i) => i.status !== "claimed").length ===
                0 && <p className="panel-empty">No items found.</p>}
            </div>
          </div>
        );

      case "add-item":
        return (
          <div className="panel-content">
            <div className="panel-section-title">{reportFoundText}</div>
            {uploadSuccess ? (
              <div className="panel-success">
                <span className="panel-success__icon">✓</span>
                <p>Item posted!</p>
              </div>
            ) : (
              <form className="panel-form" onSubmit={handleSubmit}>
                <label className="panel-form__label">Item Name</label>
                <input
                  type="text"
                  placeholder={itemNameText}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                  className="panel-form__input"
                />
                <label className="panel-form__label">Description</label>
                <textarea
                  placeholder={descriptionText}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  required
                  className="panel-form__textarea"
                />
                <label className="panel-form__label">Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                  }}
                  required
                  className="panel-form__file"
                />
                {selectedFile && (
                  <div className="panel-form__preview-wrap">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="preview"
                      className="panel-form__preview"
                    />
                    <button
                      type="button"
                      className="panel-form__preview-remove"
                      onClick={() => setSelectedFile(null)}
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="panel-form__actions">
                  <button
                    type="button"
                    className="panel-form__cancel"
                    onClick={() => {
                      setNewItemName("");
                      setNewItemDesc("");
                      setSelectedFile(null);
                      setActiveTab("items");
                    }}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="submit"
                    className="panel-form__submit"
                    disabled={isUploading}
                  >
                    {isUploading ? uploadingText : postItemText}
                  </button>
                </div>
              </form>
            )}
          </div>
        );

      case "become-admin":
        return <AdminPanel />;

      case "admin-login":
        return <AdminLoginPanel onUnlock={() => setIsAdmin(true)} />;

      default:
        return null;
    }
  };

  if (!isReady)
    return (
      <div className="dashboard-layout">
        <div className="dashboard-sidebar" />
        <div className="dashboard-main" />
      </div>
    );

  return (
    <div className="dashboard-layout">
      {/* ── Left Sidebar ── */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-tabs">
          {SIDEBAR_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`sidebar-tab${activeTab === tab.id ? " sidebar-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="sidebar-tab__icon">{tab.icon}</span>
              <span className="sidebar-tab__label">{tab.label}</span>
              {activeTab === tab.id && <span className="sidebar-tab__pip" />}
            </button>
          ))}
        </div>

        <div className="sidebar-panel" key={activeTab}>
          {renderPanel()}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="dashboard-main">
        {isAdmin && (
          <div className="admin-banner">
            <span className="admin-banner__icon">🔐</span>
            <span>Admin mode active — you can delete any item</span>
            <button
              className="admin-banner__exit"
              onClick={() => {
                setIsAdmin(false);
                localStorage.removeItem("findr_is_admin");
              }}
            >
              Exit Admin
            </button>
          </div>
        )}

        <div className="items-container">
          {filteredItems
            .filter((i) => i.status !== "claimed")
            .map((item) => {
              const currentStatus = item.status || "waiting";
              const isItemOwner = user?.id === item.authorId;
              return (
                <div
                  key={item.id}
                  id={`item-${item.id}`}
                  className={`item-card${isAdmin ? " item-card--admin" : ""}`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="item-image"
                  />
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="posted-by">
                      {item.authorAvatar && (
                        <img
                          src={item.authorAvatar}
                          alt="User"
                          className="posted-by__avatar"
                        />
                      )}
                      <span>
                        {foundByText} {item.authorName || "Anonymous"}
                      </span>
                    </div>
                  </div>
                  <div className="button-group">
                    {currentStatus === "waiting" && !isItemOwner && (
                      <button
                        className="retrieve-button"
                        onClick={() => handleRetrieve(item)}
                      >
                        {retrieveText}
                      </button>
                    )}
                    {currentStatus === "pending" &&
                      (isItemOwner ? (
                        <button
                          className="confirm-button"
                          onClick={() => handleConfirmClaimed(item.id)}
                        >
                          {confirmText}
                        </button>
                      ) : (
                        <button className="pending-button" disabled>
                          {pendingText}
                        </button>
                      ))}
                    {!isItemOwner && (
                      <button
                        className="message-finder-button"
                        onClick={() => handleOpenChat(item)}
                      >
                        Message Finder
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete Item
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          {filteredItems.filter((i) => i.status !== "claimed").length === 0 &&
            searchQuery && (
              <div className="empty-state">
                <p>No items found for "{searchQuery}"</p>
                <p>Try different keywords like color, type, or brand</p>
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
      </main>
    </div>
  );
}
