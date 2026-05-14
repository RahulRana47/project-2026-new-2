import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadUser, logout } from "../action/authActions";
import {
  getGuideBookings,
  getMyBookings,
  getUnreadChatCount,
  updateBookingStatus,
} from "../services/api";
import "./Navbar.css";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationBookings, setNotificationBookings] = useState([]);
  const [notificationError, setNotificationError] = useState("");
  const [notificationActionId, setNotificationActionId] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
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
    if (!dropdownOpen && !notificationOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    const handleScroll = () => {
      setDropdownOpen(false);
      setNotificationOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [dropdownOpen, notificationOpen]);

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
  const isTourist = (user?.role || "").toLowerCase() === "tourist";
  const isGuideLike = isGuide || isAdmin;

  const loadNotifications = async ({ silent = false } = {}) => {
    if (!token || !user?.role) {
      setNotificationBookings([]);
      return;
    }

    if (!silent) {
      setNotificationsLoading(true);
    }

    setNotificationError("");

    try {
      const response = isGuideLike ? await getGuideBookings() : await getMyBookings();
      setNotificationBookings(Array.isArray(response?.bookings) ? response.bookings : []);
    } catch (requestError) {
      setNotificationError(requestError?.message || "Unable to load notifications.");
    } finally {
      if (!silent) {
        setNotificationsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!token || !user?.role) return;

    loadNotifications();

    const intervalId = window.setInterval(() => {
      loadNotifications({ silent: true });
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [token, user?.role]);

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

    const intervalId = window.setInterval(loadUnreadMessages, 15000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [token]);

  const notifications = useMemo(() => {
    const sortedBookings = [...notificationBookings].sort((a, b) => {
      const left = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
      const right = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
      return left - right;
    });

    if (isGuideLike) {
      return sortedBookings
        .filter((booking) => booking?.status === "pending")
        .map((booking) => ({
          id: booking._id,
          booking,
          type: "guide-request",
          title: "New booking request",
          body: `${booking?.tourist?.name || "A tourist"} requested ${booking?.post?.title || "a tour"}.`,
        }));
    }

    if (isTourist) {
      return sortedBookings
        .filter((booking) => booking?.status && booking.status !== "pending")
        .map((booking) => {
          const guideName = booking?.guide?.name || "Your guide";
          const postTitle = booking?.post?.title || "your booking";
          const statusText =
            booking.status === "confirmed"
              ? "confirmed"
              : booking.status === "cancelled"
              ? "rejected"
              : booking.status;

          return {
            id: booking._id,
            booking,
            type: "tourist-update",
            title:
              booking.status === "confirmed"
                ? "Booking confirmed"
                : booking.status === "cancelled"
                ? "Booking rejected"
                : `Booking ${booking.status}`,
            body: `${guideName} ${statusText} ${postTitle}.`,
          };
        });
    }

    return [];
  }, [notificationBookings, isGuideLike, isTourist]);

  const handleNotificationStatus = async (bookingId, status) => {
    setNotificationActionId(`${bookingId}:${status}`);
    setNotificationError("");

    try {
      await updateBookingStatus(bookingId, status);
      await loadNotifications({ silent: true });
    } catch (requestError) {
      setNotificationError(requestError?.message || "Unable to update booking.");
    } finally {
      setNotificationActionId("");
    }
  };

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

        <div className="notification" ref={notificationRef}>
          <button
            type="button"
            className="notification-trigger"
            aria-label="Open notifications"
            onClick={() => {
              setNotificationOpen((prev) => !prev);
              setDropdownOpen(false);
              if (!notificationOpen) {
                loadNotifications();
              }
            }}
          >
            <i className="fa fa-bell"></i>
            {notifications.length ? <span className="badge">{notifications.length}</span> : null}
          </button>

          {notificationOpen ? (
            <div className="notification-dropdown">
              <div className="notification-dropdown__header">
                <strong>Notifications</strong>
                <button type="button" className="notification-link" onClick={() => navigate("/dashboard/bookings")}>
                  View all
                </button>
              </div>

              {notificationsLoading ? <p className="notification-empty">Loading notifications...</p> : null}
              {!notificationsLoading && notificationError ? (
                <p className="notification-empty notification-empty--error">{notificationError}</p>
              ) : null}
              {!notificationsLoading && !notificationError && !notifications.length ? (
                <p className="notification-empty">No notifications right now.</p>
              ) : null}

              {!notificationsLoading && !notificationError && notifications.length ? (
                <div className="notification-list">
                  {notifications.slice(0, 6).map((item) => (
                    <div key={item.id} className="notification-item">
                      <div className="notification-item__content">
                        <strong>{item.title}</strong>
                        <p>{item.body}</p>
                        <small>
                          {item.booking?.tourDate
                            ? new Date(item.booking.tourDate).toLocaleString()
                            : "Schedule pending"}
                        </small>
                      </div>

                      {item.type === "guide-request" ? (
                        <div className="notification-item__actions">
                          <button
                            type="button"
                            className="notification-accept"
                            disabled={notificationActionId === `${item.id}:confirmed`}
                            onClick={() => handleNotificationStatus(item.id, "confirmed")}
                          >
                            {notificationActionId === `${item.id}:confirmed` ? "Saving..." : "Accept"}
                          </button>
                          <button
                            type="button"
                            className="notification-reject"
                            disabled={notificationActionId === `${item.id}:cancelled`}
                            onClick={() => handleNotificationStatus(item.id, "cancelled")}
                          >
                            {notificationActionId === `${item.id}:cancelled` ? "Saving..." : "Reject"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div
          className="profile"
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
            setNotificationOpen(false);
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
