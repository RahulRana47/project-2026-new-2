import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { setLocationFilter } from "../action/uiActions";
import { getGuides } from "../services/api";
import "./GuiderProfiles.css";

const getGuideSlug = (guide) =>
  encodeURIComponent(guide?._id || guide?.name || "guide");

const getGuideImage = (guide) => {
  const src = guide?.avatar || guide?.photo || guide?.image;
  if (!src) return "/default_profile.jpg";
  return src.startsWith("http") ? src : `http://localhost:5000/uploads/${src}`;
};

const GuiderProfiles = () => {
  const [guides, setGuides] = useState([]);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const location = useSelector((state) => state.ui?.locationFilter || "");
  const liveCount = filteredGuides.length || guides.length;

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const data = await getGuides();
      const guideList = Array.isArray(data?.guides)
        ? data.guides
        : Array.isArray(data)
        ? data
        : [];

      setGuides(guideList);
      setFilteredGuides(guideList);
    } catch (err) {
      console.error("Failed to load guides:", err);
      setGuides([]);
      setFilteredGuides([]);
    }
  };

  const formatLocation = (loc) => {
    if (!loc) return "Location not provided";
    if (typeof loc === "string") return loc;
    if (typeof loc === "object") {
      const parts = [loc.city, loc.state, loc.country].filter(Boolean);
      return parts.length ? parts.join(", ") : "Location not provided";
    }
    return "Location not provided";
  };

  useEffect(() => {
    const filtered = guides.filter((guide) => {
      const name = (guide.name || "").toLowerCase();
      const locString = formatLocation(guide.location).toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());
      const matchesLocation =
        location === "" || locString.includes(location.toLowerCase());

      return (
        matchesSearch &&
        matchesLocation
      );
    });

    setFilteredGuides(filtered);
  }, [search, location, guides]);

  const locationOptions = useMemo(() => {
    const set = new Set();
    guides.forEach((g) => {
      const loc = formatLocation(g.location);
      if (loc && loc !== "Location not provided") {
        // split by comma to allow city/state selection
        loc.split(",").map((s) => s.trim()).filter(Boolean).forEach((part) => set.add(part));
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [guides]);

  return (
    <div className="guides-section">
      <div className="guides-header">
        <div className="header-left">
          <h1>Available Guides Near You</h1>
          <p className="subtitle">
            {liveCount
              ? `${liveCount} guide${liveCount > 1 ? "s" : ""} ready to make your trip unforgettable`
              : "Explore trusted local guides"}
          </p>

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
          <select
            value={location}
            onChange={(e) => dispatch(setLocationFilter(e.target.value))}
          >
            <option value="">All Locations</option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
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
          <Link
            key={guide._id || idx}
            to={`/guide/${getGuideSlug(guide)}`}
            className="guide-card"
          >
            <img
              src={getGuideImage(guide)}
              alt={guide.name}
            />
            <h3>{guide.name}</h3>
            <p>{formatLocation(guide.location)}</p>
            <p className="price">Rs. {guide.price} / day</p>
            <span className="guide-cta">View Profile</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GuiderProfiles;
