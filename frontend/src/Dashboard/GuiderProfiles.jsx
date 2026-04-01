import { useEffect, useState } from "react";
import { getGuides } from "../services/api";
import "./GuiderProfiles.css";

const GuiderProfiles = () => {
  const [guides, setGuides] = useState([]);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    const data = await getGuides();

    // If backend returns: { guides: [...] }
    const guideList = data.guides || data;

    setGuides(guideList);
    setFilteredGuides(guideList);
  };

  useEffect(() => {
    const filtered = guides.filter((guide) => {
      return (
        guide.name.toLowerCase().includes(search.toLowerCase()) &&
        (location === "" || guide.location === location)
      );
    });

    setFilteredGuides(filtered);
  }, [search, location, guides]);

  return (
    <div className="guides-section">
      <div className="guides-header">
        <div className="header-left">
          <h1>Available Guides Near You</h1>
          <p className="subtitle">6 experts ready to make your trip unforgettable</p>

          <div className="search-row">
            <input
              type="text"
              placeholder="Search guide..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="header-right">
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">All Locations</option>
            <option value="Delhi">Delhi</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Jaipur">Jaipur</option>
          </select>

          <select>
            <option>Recommended</option>
            <option>Top Rated</option>
            <option>Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="guide-grid">
        {filteredGuides.map((guide, idx) => (
          <div key={guide._id || idx} className="guide-card">
            <img
              src={
                guide.avatar
                  ? `http://localhost:5000/uploads/${guide.avatar}`
                  : "/default_profile.jpg"
              }
              alt={guide.name}
            />
            <h3>{guide.name}</h3>
            <p>{guide.location}</p>
            <p className="price">₹ {guide.price} / day</p>
            <button>View Profile</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuiderProfiles;