import "./home.css";

function Home() {
  const lostItems = [
    {
      id: 1,
      name: "Blue Backpack",
      description:
        "Navy blue backpack with leather straps, found near the library on Tuesday afternoon",
      image: "https://via.placeholder.com/300x200"
    },
    {
      id: 2,
      name: " Glasses",
      description:
        "Black frame reading glasses in brown case, found in Room 204 during morning classes",
      image: "https://via.placeholder.com/300x200"
    },
    {
      id: 3,
      name: "Water Bottle",
      description:
        "Stainless steel water bottle with various stickers, found in the cafeteria at lunch time",
      image: "https://via.placeholder.com/300x200"
    },
    {
      id: 4,
      name: "Notebook",
      description:
        "Green spiral notebook containing math notes and homework, found in the main hallway",
      image: "https://via.placeholder.com/300x200"
    }
  ];

  return (
    <div className="content home-page">
      <h1>Lost and Found</h1>
      <p>Browse items that have been found and are waiting to be claimed</p>

      <div className="items-container">
        {lostItems.map(item => (
          <div key={item.id} className="item-card">
            <img
              src={item.image}
              alt={item.name}
              className="item-image"
            />

            <div className="item-info">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
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