import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadUser, logout } from "../action/authActions";
import { getUnreadChatCount } from "../services/api";
import NotificationBell from "../components/NotificationBell";
import "./Navbar.css";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const dropdownRef = useRef(null);
  const closeMobile = () => setMobileOpen(false);

  const { user, token, loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token && !user && !loading && !error) {
      dispatch(loadUser());
    }
  }, [token, user, loading, error, dispatch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("search") || "");
  }, [location.search]);

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleScroll = () => {
      setDropdownOpen(false);
    };

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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = searchTerm.trim();
    const params = new URLSearchParams();
    if (value) params.set("search", value);
    const query = params.toString();
    const target = `/dashboard${query ? `?${query}` : ""}#guides`;
    navigate(target);
    closeMobile();
  };

  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const isGuide = (user?.role || "").toLowerCase() === "guide";
  useEffect(() => {
    if (!token) {
      setUnreadMessages(0);
      return;
    }

    let mounted = true;

    const loadUnreadMessages = async () => {
      try {
        const response = await getUnreadChatCount();
        if (mounted) {
          setUnreadMessages(Number(response?.unreadCount || 0));
        }
      } catch (error) {
        if (mounted) {
          setUnreadMessages(0);
        }
      }
    };

    loadUnreadMessages();

    const intervalId = window.setInterval(loadUnreadMessages, 5000);

    const handleForceSync = () => {
      loadUnreadMessages();
    };
    window.addEventListener("notification:sync", handleForceSync);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("notification:sync", handleForceSync);
    };
  }, [token]);

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
        <form className="search-box" onSubmit={handleSearchSubmit}>
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="Search guides by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
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

        {token ? (
          <button
            type="button"
            className="messages-nav-trigger"
            aria-label="Open messages"
            onClick={() => {
              navigate("/dashboard/messages");
              closeMobile();
            }}
          >
            <i className="fa fa-envelope"></i>
            <span>Messages</span>
            {unreadMessages ? <span className="badge badge-inline">{unreadMessages}</span> : null}
          </button>
        ) : null}

        {token && !isGuide ? (
          <button
            type="button"
            className="messages-nav-trigger"
            aria-label="Open itinerary"
            onClick={() => {
              navigate("/dashboard/itinerary");
              closeMobile();
            }}
          >
            <i className="fa fa-map"></i>
            <span>Itinerary</span>
          </button>
        ) : null}

        {token ? <NotificationBell /> : null}

        <div
          className="profile"
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
          }}
        >
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
                navigate(isGuide ? "/dashboard/guide" : "/dashboard/bookings");
                closeMobile();
              }}
            >
              {isGuide ? "Guide Dashboard" : "My Bookings"}
            </div>

            {isGuide && (
              <div
                className="dropdown-item"
                onClick={() => {
                  navigate("/dashboard/bookings");
                  closeMobile();
                }}
              >
                Bookings
              </div>
            )}

            {token && (
              <div
                className="dropdown-item"
                onClick={() => {
                  navigate("/dashboard/messages");
                  closeMobile();
                }}
              >
                Messages {unreadMessages ? `(${unreadMessages})` : ""}
              </div>
            )}

            {token && !isGuide && (
              <div
                className="dropdown-item"
                onClick={() => {
                  navigate("/dashboard/itinerary");
                  closeMobile();
                }}
              >
                My Itinerary
              </div>
            )}

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
