import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getMe } from "../services/api";
import "./Navbar.css";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [user, setUser] = useState(null);

  const dropdownRef = useRef(null);

  // 🔥 Fetch logged in user
  useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const data = await getMe(token);

      console.log("ME RESPONSE:", data); // check once

      if (data.success) {
        setUser(data.user);  // 👈 fix here
        try {
          localStorage.setItem('avatar', data.user.avatar || '');
        } catch (e) {}
      }
    } catch (err) {
      console.log(err);
    }
  };

  fetchUser();
}, []);

  // 🔥 Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    const handleScroll = () => {
      setDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    // also support touch devices
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="navbar">
      {/* Left */}
      <div className="navbar-left">
        <Link to="/dashboard" className="home-link" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}>
          <div className="logo-box">
            <span className="logo-icon">🌿</span>
          </div>
          <h2 className="logo-text">GullyGuide</h2>
        </Link>
      </div>

      {/* Center */}
      <div className="navbar-center">
        <div className="search-box">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="Search guides by name or location..."
          />
        </div>

        <select
          className="location-select"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          <option value="Delhi">Delhi</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Jaipur">Jaipur</option>
        </select>
      </div>

      {/* Right */}
      <div className="navbar-right" ref={dropdownRef}>
        <div className="nav-home-link" style={{ marginRight: 12 }}>
          <Link to="/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}>
            <i className="fa fa-home" style={{ marginRight: 8 }}></i>
            <span>Home</span>
          </Link>
        </div>

        <div className="notification">
          <i className="fa fa-bell" style={{ transform: "translateX(-20px)" }}></i>
          <span className="badge">3</span>
        </div>

        <div
          className="profile"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <img
            src={user?.avatar || localStorage.getItem('avatar') || "/default_profile.jpg"}
            alt="profile"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/default_profile.jpg";
            }}
          />
        </div>

        {dropdownOpen && user && (
          <div className="dropdown">
            <div className="dropdown-header">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>

            <div
              className="dropdown-item"
              onClick={() => (window.location.href = "/dashboard/myprofile")}
            >
              My Profile  
            </div>

            <div
              className="dropdown-item"
              onClick={() => (window.location.href = "/settings")}
            >
              Settings
            </div>

            <div
              className="dropdown-item logout"
              onClick={handleLogout}
            >
              Log Out
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;