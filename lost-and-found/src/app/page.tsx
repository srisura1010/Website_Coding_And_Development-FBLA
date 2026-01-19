"use client"; // Required because we are using Context

import "./home.css";
import { useItems } from "@/context/ItemsContext";

function Home() {
  // Get items from our shared context instead of hardcoding them here
  const { items } = useItems();

  return (
    <div className="content home-page">
      <h1>Lost and Found</h1>
      <p>Browse items that have been found and are waiting to be claimed</p>

      <div className="items-container">
        {items.map(item => (
          <div key={item.id} className="item-card">
            <img
              src={item.image}
              alt={item.name}
              className="item-image"
            />

            <div className="item-info">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              
              {/* New: Display User Info */}
              <div className="posted-by" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginTop: '10px', 
                fontSize: '0.85rem', 
                color: '#666' 
              }}>
                {item.authorAvatar && (
                  <img 
                    src={item.authorAvatar} 
                    alt="User" 
                    style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                  />
                )}
                <span>Found by: {item.authorName}</span>
              </div>
            </div>

            <button className="retrieve-button">
              Retrieve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;