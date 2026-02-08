"use client";

import "../home.css";
import { useItems } from "@/context/ItemsContext";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import emailjs from "@emailjs/browser";

export default function DashboardPage() {
  const { items, updateItemStatus } = useItems();
  const { user } = useUser();

  // --- Step A: Action for Person A (The Retriever) ---
  const handleRetrieve = async (item: any) => {
    if (!user) return alert("Please sign in to retrieve items");

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
    alert("Request sent! The owner has been notified.");
  };

  // --- Step B: Action for Person B (The Creator/Owner) ---
  const handleConfirmClaimed = async (itemId: number) => {
    const { error } = await supabase
      .from("items")
      .update({ status: "claimed" })
      .eq("id", itemId);

    if (!error) {
      updateItemStatus(itemId, "claimed");
      alert("Item officially marked as claimed!");
    } else {
      console.error("Confirm error:", error.message);
    }
  };

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
                        Found by: {item.authorName || "Anonymous"}
                      </span>
                    </div>
                  </div>

                  <div className="button-group" style={{ marginTop: "15px" }}>
                    {currentStatus === "waiting" && (
                      <button
                        className="retrieve-button"
                        onClick={() => handleRetrieve(item)}
                      >
                        Retrieve
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
                          onClick={() =>
                            handleConfirmClaimed(item.id)
                          }
                        >
                          Confirm Claimed
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
                          Item Claimed (Pending Confirmation)
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
