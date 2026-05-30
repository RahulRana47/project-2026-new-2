import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import notificationSound from "../assets/mixkit-kids-cartoon-close-bells-2256.wav";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/api";
import "./NotificationBell.css";

const supportsBrowserNotifications =
  typeof window !== "undefined" && "Notification" in window;

const getNotificationIcon = (type) => {
  const icons = {
    like: "heart",
    comment: "comment",
    booking_request: "calendar",
    booking_confirmed: "check-circle",
    booking_cancelled: "times-circle",
    booking_completed: "gift",
    new_message: "envelope",
    review_received: "star",
  };

  return icons[type] || "bell";
};

const formatRelativeTime = (value) => {
  if (!value) return "Just now";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Just now";

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
};

const NotificationBell = () => {
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
  const bellRef = useRef(null);
  const mountedRef = useRef(false);
  const knownNotificationIdsRef = useRef(new Set());
  const toastTimersRef = useRef(new Map());
  const audioContextRef = useRef(null);
  const audioEnabledRef = useRef(false);
  const displayedNotificationIdsRef = useRef(new Set());
  const hasSyncedOnceRef = useRef(false);

  const acknowledgedStorageKey = useMemo(() => {
    const userId = user?._id || "guest";
    return `gullyguide_acknowledged_notifications_${userId}`;
  }, [user?._id]);

  const displayedStorageKey = useMemo(() => {
    const userId = user?._id || "guest";
    return `gullyguide_displayed_notifications_${userId}`;
  }, [user?._id]);

  const playSound = async () => {
    if (!audioEnabledRef.current) return;

    try {
      const audio = new Audio(notificationSound);
      audio.volume = 0.5;
      await audio.play();
    } catch {
      // Fallback: if asset file fails, try programmatic beep
      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      try {
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
      } catch {
        return;
      }

      const startAt = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, startAt);
      oscillator.frequency.exponentialRampToValueAtTime(660, startAt + 0.18);

      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.28);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.3);
    }
  };

  const pushBrowserNotification = (notification) => {
    if (!supportsBrowserNotifications || window.Notification.permission !== "granted") {
      return;
    }

    new window.Notification(notification.title, {
      body: notification.message,
      icon: notification.sender?.avatar || "/default_profile.jpg",
      tag: notification._id,
    });
  };

  const dismissToast = (notificationId) => {
    const timer = toastTimersRef.current.get(notificationId);
    if (timer) {
      window.clearTimeout(timer);
      toastTimersRef.current.delete(notificationId);
    }

    setToasts((current) => current.filter((toast) => toast._id !== notificationId));
  };

  const pushToast = (notification) => {
    setToasts((current) => {
      const withoutDuplicate = current.filter((toast) => toast._id !== notification._id);
      return [notification, ...withoutDuplicate].slice(0, 4);
    });

    const existingTimer = toastTimersRef.current.get(notification._id);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      dismissToast(notification._id);
    }, 5000);

    toastTimersRef.current.set(notification._id, timer);
  };

  const persistAcknowledgedNotifications = (ids) => {
    if (typeof window === "undefined") return;

    try {
      const serializedIds = JSON.stringify(Array.from(ids));
      window.localStorage.setItem(acknowledgedStorageKey, serializedIds);
      window.sessionStorage.setItem(acknowledgedStorageKey, serializedIds);
    } catch {
      // Ignore storage failures.
    }
  };

  const persistDisplayedNotifications = (ids) => {
    if (typeof window === "undefined") return;

    try {
      const serializedIds = JSON.stringify(Array.from(ids));
      window.localStorage.setItem(displayedStorageKey, serializedIds);
      window.sessionStorage.setItem(displayedStorageKey, serializedIds);
    } catch {
      // Ignore storage failures.
    }
  };

  const syncNotifications = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getNotifications({ limit: 20 });
      const nextNotifications = Array.isArray(data?.notifications) ? data.notifications : [];
      const nextIds = new Set(knownNotificationIdsRef.current);
      const displayedIds = new Set(displayedNotificationIdsRef.current);

      const newItems = nextNotifications.filter(
        (item) =>
          item?._id &&
          !item?.isRead &&
          !nextIds.has(item._id) &&
          !displayedIds.has(item._id)
      );

      nextNotifications.forEach((item) => {
        if (item?._id) {
          nextIds.add(item._id);
        }
      });

      setNotifications(nextNotifications);
      setUnreadCount(Number(data?.unreadCount || 0));

      if (mountedRef.current && hasSyncedOnceRef.current && newItems.length) {
        newItems.forEach((item, index) => {
          if (index === 0) {
            playSound();
            pushBrowserNotification(item);
          }
          pushToast(item);

          // mark as displayed immediately to avoid re-notifying on the next sync
          displayedNotificationIdsRef.current.add(item._id);
        });

        // persist displayed ids so they won't re-trigger after reload
        persistDisplayedNotifications(displayedNotificationIdsRef.current);
      }

      knownNotificationIdsRef.current = nextIds;
      persistAcknowledgedNotifications(nextIds);
      hasSyncedOnceRef.current = true;
    } catch (requestError) {
      setError(requestError?.message || "Unable to load notifications.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return undefined;

    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;

    const enableAudio = async () => {
      try {
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
        audioEnabledRef.current = true;
      } catch {
        audioEnabledRef.current = false;
      }
    };

    window.addEventListener("pointerdown", enableAudio, { once: true });
    window.addEventListener("keydown", enableAudio, { once: true });
    window.addEventListener("click", enableAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", enableAudio);
      window.removeEventListener("keydown", enableAudio);
      window.removeEventListener("click", enableAudio);
      if (audioContextRef.current?.state && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored =
        window.localStorage.getItem(acknowledgedStorageKey) ||
        window.sessionStorage.getItem(acknowledgedStorageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      knownNotificationIdsRef.current = new Set(Array.isArray(parsed) ? parsed : []);
      try {
        const displayedStored =
          window.localStorage.getItem(displayedStorageKey) ||
          window.sessionStorage.getItem(displayedStorageKey);
        const displayedParsed = displayedStored ? JSON.parse(displayedStored) : [];
        displayedNotificationIdsRef.current = new Set(
          Array.isArray(displayedParsed) ? displayedParsed : []
        );
      } catch {
        displayedNotificationIdsRef.current = new Set();
      }
    } catch {
      knownNotificationIdsRef.current = new Set();
    }
  }, [acknowledgedStorageKey, displayedStorageKey]);

  useEffect(() => {
    syncNotifications();

    if (supportsBrowserNotifications && window.Notification.permission === "default") {
      window.Notification.requestPermission().catch(() => {});
    }

    const intervalId = window.setInterval(() => {
      syncNotifications({ silent: true });
    }, 5000);

    // Listen for custom events to sync immediately after bookings/messages
    const handleForceSync = () => {
      syncNotifications({ silent: true });
    };
    window.addEventListener("notification:sync", handleForceSync);

    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
      window.removeEventListener("notification:sync", handleForceSync);
      toastTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      toastTimersRef.current.clear();
    };
  }, [acknowledgedStorageKey]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId) => {
    const currentNotification = notifications.find((item) => item._id === notificationId);
    if (!currentNotification || currentNotification.isRead) {
      return;
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item._id === notificationId
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(notificationId);
      knownNotificationIdsRef.current.add(notificationId);
      persistAcknowledgedNotifications(knownNotificationIdsRef.current);
      dismissToast(notificationId);
    } catch (requestError) {
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notificationId ? { ...item, isRead: false, readAt: null } : item
        )
      );
      setUnreadCount((prev) => prev + 1);
      setError(requestError?.message || "Unable to mark notification as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    const hasUnread = notifications.some((item) => !item.isRead);
    if (!hasUnread) return;

    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
      notifications.forEach((item) => {
        knownNotificationIdsRef.current.add(item._id);
      });
      persistAcknowledgedNotifications(knownNotificationIdsRef.current);
      setToasts([]);
    } catch (requestError) {
      await syncNotifications({ silent: true });
      setError(requestError?.message || "Unable to mark notifications as read.");
    }
  };

  const visibleNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);

  return (
    <div className="notification-bell" ref={bellRef}>
      <div className="notification-bell__toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast._id} className="notification-bell__toast">
            <div className="notification-bell__toast-icon">
              <i className={`fa fa-${getNotificationIcon(toast.type)}`}></i>
            </div>
            <div className="notification-bell__toast-content">
              <strong>{toast.sender?.name || toast.title}</strong>
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              className="notification-bell__toast-close"
              onClick={() => dismissToast(toast._id)}
              aria-label="Close notification"
            >
              Close
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="notification-bell__trigger"
        aria-label="Open notifications"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <i className="fa fa-bell"></i>
        {unreadCount > 0 ? <span className="notification-bell__badge">{unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <div className="notification-bell__dropdown">
          <div className="notification-bell__header">
            <strong>Notifications</strong>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="notification-bell__link"
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {loading ? <p className="notification-bell__empty">Loading notifications...</p> : null}
          {!loading && error ? (
            <p className="notification-bell__empty notification-bell__empty--error">{error}</p>
          ) : null}
          {!loading && !error && !visibleNotifications.length ? (
            <p className="notification-bell__empty">No notifications right now.</p>
          ) : null}

          {!loading && !error && visibleNotifications.length ? (
            <div className="notification-bell__list">
              {visibleNotifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  className={`notification-bell__item ${
                    notification.isRead ? "" : "notification-bell__item--unread"
                  }`}
                  onClick={() => handleMarkAsRead(notification._id)}
                >
                  <span className="notification-bell__icon">
                    <i className={`fa fa-${getNotificationIcon(notification.type)}`}></i>
                  </span>
                  <span className="notification-bell__content">
                    <span className="notification-bell__title">{notification.title}</span>
                    <span className="notification-bell__message">{notification.message}</span>
                    <span className="notification-bell__time">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;
