import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadUser, logout } from "../action/authActions";
import "./Navbar.css";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const closeMobile = () => setMobileOpen(false);

  const { user, token, loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && !user && !loading && !error) {
      dispatch(loadUser());
    }
  }, [token, user, loading, error, dispatch]);

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

  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const isGuide = (user?.role || "").toLowerCase() === "guide";

  return (
    <div className="navbar">
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

      <div className={`navbar-center ${mobileOpen ? "show" : ""}`}>
        <div className="search-box">
          <i className="fa fa-search"></i>
          <input type="text" placeholder="Search guides by name or location..." />
        </div>
      </div>

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

            <div
              className="dropdown-item"
              onClick={() => {
                navigate(isGuide ? "/dashboard/guide" : "/dashboard/myprofile");
                closeMobile();
              }}
            >
              {isGuide ? "Guide Dashboard" : "My Profile"}
            </div>

            {isAdmin && (
              <div
                className="dropdown-item"
                onClick={() => {
                  navigate("/dashboard/admin");
                  closeMobile();
                }}
              >
                Admin Panel
              </div>
            )}

            <div
              className="dropdown-item"
              onClick={() => {
                navigate("/settings");
                closeMobile();
              }}
            >
              Settings
            </div>

            <div
              className="dropdown-item logout"
              onClick={() => {
                handleLogout();
                closeMobile();
              }}
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
