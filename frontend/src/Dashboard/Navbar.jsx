import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadUser, logout } from "../action/authActions";
import { fetchPosts } from "../action/postActions";
import { setLocationFilter } from "../action/uiActions";
import "./Navbar.css";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, setLocation] = useState("");
  const dropdownRef = useRef(null);
  const closeMobile = () => setMobileOpen(false);

  const { user, token, loading, error } = useSelector((state) => state.auth);
  const { posts = [], loading: postsLoading } = useSelector((state) => state.post || {});
  const locationFilter = useSelector((state) => state.ui?.locationFilter || "");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Fetch logged-in user once token is available
  useEffect(() => {
    if (token && !user && !loading && !error) {
      dispatch(loadUser());
    }
  }, [token, user, loading, error, dispatch]);

  // Load posts for dynamic locations list
  useEffect(() => {
    if (!posts.length && !postsLoading) {
      dispatch(fetchPosts());
    }
  }, [posts.length, postsLoading, dispatch]);

  // Close dropdown on outside click or scroll
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleScroll = () => setDropdownOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [dropdownOpen]);

  // collapse mobile menu when viewport grows
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 960 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileOpen]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Build unique location options (city, fallback state)
  const locationOptions = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => {
      const loc = p?.location;
      if (!loc) return;
      if (typeof loc === "string") {
        set.add(loc);
        return;
      }
      if (loc.city) set.add(loc.city);
      else if (loc.state) set.add(loc.state);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  // keep local select in sync with global filter
  useEffect(() => {
    setLocation(locationFilter);
  }, [locationFilter]);

  return (
    <div className="navbar">
      {/* Left */}
      <div className="navbar-left">
        <Link
          to="/dashboard"
          className="home-link"
          onClick={closeMobile}
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div className="logo-box">
            <span className="logo-icon">🌏</span>
          </div>
          <h2 className="logo-text">GullyGuide</h2>
        </Link>
      </div>

      <button
        className="mobile-toggle"
        aria-label="Toggle navigation"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        <i className={`fa ${mobileOpen ? "fa-times" : "fa-bars"}`}></i>
      </button>

      {/* Center */}
      <div className={`navbar-center ${mobileOpen ? "show" : ""}`}>
        <div className="search-box">
          <i className="fa fa-search"></i>
          <input type="text" placeholder="Search guides by name or location..." />
        </div>

        <select
          className="location-select"
          value={location}
          onChange={(e) => {
            const val = e.target.value;
            setLocation(val);
            dispatch(setLocationFilter(val));
          }}
        >
          <option value="">All Locations</option>
          {locationOptions.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Right */}
      <div className={`navbar-right ${mobileOpen ? "show" : ""}`} ref={dropdownRef}>
        <div className="nav-home-link" style={{ marginRight: 12 }}>
          <Link
            to="/dashboard"
            onClick={closeMobile}
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <i className="fa fa-home" style={{ marginRight: 8 }}></i>
            <span>Home</span>
          </Link>
        </div>

        <div className="notification">
          <i className="fa fa-bell" style={{ transform: "translateX(-20px)" }}></i>
          <span className="badge">3</span>
        </div>

        <div className="profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <img
            src={user?.avatar || localStorage.getItem("avatar") || "/default_profile.jpg"}
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

            <div className="dropdown-item" onClick={() => { navigate("/dashboard/myprofile"); closeMobile(); }}>
              My Profile
            </div>

            <div className="dropdown-item" onClick={() => { navigate("/settings"); closeMobile(); }}>
              Settings
            </div>

            <div className="dropdown-item logout" onClick={() => { handleLogout(); closeMobile(); }}>
              Log Out
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;

