"use client";

import "./home.css";
import { useItems } from "@/context/ItemsContext";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";
import emailjs from "@emailjs/browser";

function Home() {
  // 1. Get items and the update function from your Context
  const { items, updateItemStatus } = useItems();
  const { user } = useUser();

  // --- Step A: Action for Person A (The Retriever) ---
  const handleRetrieve = async (item: any) => {
    if (!user) return alert("Please sign in to retrieve items");

    // Update Supabase status to 'pending'
    const { error } = await supabase
      .from("items")
      .update({ 
        status: "pending", 
        claimer_email: user.primaryEmailAddress?.emailAddress 
      })
      .eq("id", item.id);

    if (error) {
      console.error("Error updating status:", error.message);
      return;
    }

    // Send the Email via EmailJS
    // Note: author_email must exist in your database!
    const templateParams = {
      author_name: item.authorName || "Owner",
      item_name: item.name,
      retriever_name: user.fullName || "A user",
      retriever_email: user.primaryEmailAddress?.emailAddress,
      to_email: item.authorEmail, 
    };

    emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!, 
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!, 
      templateParams,
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
    )
    .then(() => console.log("Email sent successfully!"))
    .catch((err) => console.error("Email failed:", err));

    // Update the UI instantly
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
    <div className="content home-page">
      <h1>Lost and Found</h1>
      <p>Browse items that have been found and are waiting to be claimed</p>

      <div className="items-container">
        {/* filter() hides items once they are 'claimed' */}
        {items && items.filter(i => i.status !== 'claimed').map((item) => {
          // Safety fallbacks to prevent [object Object] errors
          const currentStatus = item.status || 'waiting';
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
                
                <div className="posted-by" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '0.85rem', color: '#666' }}>
                  {item.authorAvatar && (
                    <img 
                      src={item.authorAvatar} 
                      alt="User" 
                      style={{ width: '20px', height: '20px', borderRadius: '50%' }} 
                    />
                  )}
                  <span>Found by: {item.authorName || "Anonymous"}</span>
                </div>
              </div>

              <div className="button-group" style={{ marginTop: '15px' }}>
                {/* BUTTON 1: WAITING STATUS */}
                {currentStatus === 'waiting' && (
                  <button className="retrieve-button" onClick={() => handleRetrieve(item)}>
                    Retrieve
                  </button>
                )}

                {/* BUTTON 2: PENDING STATUS */}
                {currentStatus === 'pending' && (
                  isOwner ? (
                    <button 
                      className="confirm-button" 
                      style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }} 
                      onClick={() => handleConfirmClaimed(item.id)}
                    >
                      Confirm Claimed
                    </button>
                  ) : (
                    <button 
                      className="pending-button" 
                      disabled 
                      style={{ backgroundColor: '#ccc', color: '#666', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'not-allowed' }}
                    >
                      Item Claimed (Pending Confirmation)
                    </button>
                  )
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