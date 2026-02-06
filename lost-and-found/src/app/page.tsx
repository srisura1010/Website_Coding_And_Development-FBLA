"use client";

import "./home.css";
import { useItems } from "@/context/ItemsContext";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";
import emailjs from "@emailjs/browser";

function Home() {
  const { items, updateItemStatus } = useItems();
  const { user } = useUser();

  // --- Retriever clicks "Retrieve" ---
  const handleRetrieve = async (item: any) => {
    if (!user) {
      alert("Please sign in to retrieve items");
      return;
    }

    // ❌ Owner cannot retrieve their own item
    if (user.id === item.author_id) {
      alert("You cannot retrieve your own item.");
      return;
    }

    const claimerEmail = user.primaryEmailAddress?.emailAddress;

    if (!claimerEmail) {
      alert("No email found for your account.");
      return;
    }

    const { error } = await supabase
      .from("items")
      .update({
        status: "pending",
        claimer_email: claimerEmail,
      })
      .eq("id", item.id)
      .eq("status", "waiting"); // prevents double-claim race condition

    if (error) {
      console.error("Retrieve error:", error.message);
      return;
    }

    // Email owner
    const templateParams = {
      author_name: item.author_name || "Owner",
      item_name: item.name,
      retriever_name: user.fullName || "A user",
      retriever_email: claimerEmail,
      to_email: item.author_email,
    };

    emailjs
      .send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        templateParams,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      )
      .then(() => console.log("Email sent"))
      .catch((err) => console.error("Email error:", err));

    updateItemStatus(item.id, "pending");
    alert("Request sent! Waiting for owner confirmation.");
  };

  // --- Owner confirms item claimed ---
  const handleConfirmClaimed = async (itemId: number) => {
    const { error } = await supabase
      .from("items")
      .update({
        status: "claimed",
        claim_date: new Date(),
      })
      .eq("id", itemId);

    if (error) {
      console.error("Confirm error:", error.message);
      return;
    }

    updateItemStatus(itemId, "claimed");
    alert("Item marked as claimed.");
  };

  return (
    <div className="content home-page">
      <h1>Lost and Found</h1>
      <p>Browse items that have been found and are waiting to be claimed</p>

      <div className="items-container">
        {items &&
          items
            .filter((item) => item.status !== "claimed")
            .map((item) => {
              const currentStatus = item.status || "waiting";

              const isOwner = user?.id === item.author_id;
              const isClaimer =
                user?.primaryEmailAddress?.emailAddress ===
                item.claimer_email;

              return (
                <div key={item.id} className="item-card">
                  <img
                    src={item.image_url}
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
                      {item.author_avatar && (
                        <img
                          src={item.author_avatar}
                          alt="User"
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                          }}
                        />
                      )}
                      <span>
                        Found by: {item.author_name || "Anonymous"}
                      </span>
                    </div>
                  </div>

                  <div className="button-group" style={{ marginTop: "15px" }}>
                    {/* WAITING → Retrieve */}
                    {currentStatus === "waiting" && !isOwner && (
                      <button
                        className="retrieve-button"
                        onClick={() => handleRetrieve(item)}
                      >
                        Retrieve
                      </button>
                    )}

                    {/* PENDING → Owner confirms */}
                    {currentStatus === "pending" && isOwner && (
                      <button
                        className="confirm-button"
                        onClick={() => handleConfirmClaimed(item.id)}
                      >
                        Confirm Claimed
                      </button>
                    )}

                    {/* PENDING → Claimer waits */}
                    {currentStatus === "pending" && isClaimer && !isOwner && (
                      <button className="pending-button" disabled>
                        Waiting for owner confirmation
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

export default Home;
