"use client";

import "../dashboard/dashboard.css";
import { useItems } from "@/context/ItemsContext";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import emailjs from "@emailjs/browser";
import { useSettings } from "@/context/SettingsContext";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { items, updateItemStatus } = useItems();
  const { user } = useUser();
  const { language } = useSettings();
  
  const [isReady, setIsReady] = useState(false);
  
  // Load from localStorage immediately
  const [foundByText, setFoundByText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`dash_foundBy_${language}`) || "Found by:";
    }
    return "Found by:";
  });
  
  const [retrieveText, setRetrieveText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`dash_retrieve_${language}`) || "Retrieve";
    }
    return "Retrieve";
  });
  
  const [confirmText, setConfirmText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`dash_confirm_${language}`) || "Confirm Claimed";
    }
    return "Confirm Claimed";
  });
  
  const [pendingText, setPendingText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`dash_pending_${language}`) || "Item Claimed (Pending Confirmation)";
    }
    return "Item Claimed (Pending Confirmation)";
  });
  
  const [signInText, setSignInText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`dash_signIn_${language}`) || "Please sign in to retrieve items";
    }
    return "Please sign in to retrieve items";
  });
  
  const [requestSentText, setRequestSentText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`dash_requestSent_${language}`) || "Request sent! The owner has been notified.";
    }
    return "Request sent! The owner has been notified.";
  });
  
  const [markedClaimedText, setMarkedClaimedText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`dash_markedClaimed_${language}`) || "Item officially marked as claimed!";
    }
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
        } catch (error) {
          // Keep using cached or default
        }
      }
      setIsReady(true);
    };

    translateAndCache();
  }, [language]);

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
      console.error("Error updating status:", error.message);
      return;
    }

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
      .then(() => console.log("Email sent successfully!"))
      .catch((err) => console.error("Email failed:", err));

    updateItemStatus(item.id, "pending", user.primaryEmailAddress?.emailAddress);
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
    } else {
      console.error("Confirm error:", error.message);
    }
  };

  if (!isReady) {
    return <div className="content dashboard-page"><div className="items-container"></div></div>;
  }

  return (
    <div className="content dashboard-page">
      <div className="items-container">
        {items &&
          items
            .filter((i) => i.status !== "claimed")
            .map((item) => {
              const currentStatus = item.status || "waiting";
              const isOwner = user?.id === item.authorId;

              return (
                <div key={item.id} className="item-card">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="item-image"
                  />

                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>

                    <div
                      className="posted-by"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "10px",
                        fontSize: "0.85rem",
                        color: "#666",
                      }}
                    >
                      {item.authorAvatar && (
                        <img
                          src={item.authorAvatar}
                          alt="User"
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                          }}
                        />
                      )}
                      <span>
                        {foundByText} {item.authorName || "Anonymous"}
                      </span>
                    </div>
                  </div>

                  <div className="button-group" style={{ marginTop: "15px" }}>
                    {currentStatus === "waiting" && (
                      <button
                        className="retrieve-button"
                        onClick={() => handleRetrieve(item)}
                      >
                        {retrieveText}
                      </button>
                    )}

                    {currentStatus === "pending" &&
                      (isOwner ? (
                        <button
                          className="confirm-button"
                          style={{
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                          onClick={() => handleConfirmClaimed(item.id)}
                        >
                          {confirmText}
                        </button>
                      ) : (
                        <button
                          className="pending-button"
                          disabled
                          style={{
                            backgroundColor: "#ccc",
                            color: "#666",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "5px",
                            cursor: "not-allowed",
                          }}
                        >
                          {pendingText}
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}