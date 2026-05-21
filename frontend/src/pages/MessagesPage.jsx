import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "../Dashboard/DashboardLayout";
import { loadUser } from "../action/authActions";
import {
  getChatMessages,
  getGuides,
  getMyChats,
  getOrCreateGuideChat,
  sendChatMessage,
} from "../services/api";
import "./MessagesPage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const formatMessageTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
};

const getOtherParticipant = (chat, currentUserId) => {
  const participants = Array.isArray(chat?.participants) ? chat.participants : [];
  return participants.find((participant) => participant?._id !== currentUserId) || participants[0] || null;
};

const getAvatarSrc = (value) => {
  if (!value) return "/default_profile.jpg";
  return value.startsWith("http") ? value : `${API_BASE}/uploads/${value}`;
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const getGuideRouteParam = (guide) =>
  encodeURIComponent(guide?._id || guide?.name || "guide");

const resolveGuideFromParticipant = (guides, participant) => {
  if (!Array.isArray(guides) || !participant) return null;

  const participantId = String(participant?._id || "");
  const participantEmail = normalizeText(participant?.email);
  const participantName = normalizeText(participant?.name);

  return (
    guides.find((guide) => String(guide?._id || "") === participantId) ||
    guides.find((guide) => String(guide?.user?._id || guide?.userId || "") === participantId) ||
    guides.find((guide) => normalizeText(guide?.email) && normalizeText(guide?.email) === participantEmail) ||
    guides.find((guide) => normalizeText(guide?.name) && normalizeText(guide?.name) === participantName) ||
    null
  );
};

const MessagesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, loading: authLoading } = useSelector((state) => state.auth);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [sendError, setSendError] = useState("");
  const initializedGuideRef = useRef("");
  const messagesEndRef = useRef(null);

  const prefillGuideId = location.state?.prefillGuideId || "";
  const currentUserId = user?._id || "";

  useEffect(() => {
    if (token && !user && !authLoading) {
      dispatch(loadUser());
    }
  }, [token, user, authLoading, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!token) {
      setPageLoading(false);
      return;
    }

    let mounted = true;

    const loadChats = async () => {
      try {
        const response = await getMyChats();
        if (!mounted) return;

        const nextChats = Array.isArray(response?.chats) ? response.chats : [];
        setChats(nextChats);
        setPageError("");
        setActiveChatId((current) => {
          if (current && nextChats.some((chat) => chat._id === current)) {
            return current;
          }
          return nextChats[0]?._id || "";
        });
      } catch (error) {
        if (!mounted) return;
        setPageError(error?.message || "Unable to load your chats.");
      } finally {
        if (mounted) {
          setPageLoading(false);
        }
      }
    };

    loadChats();

    const intervalId = window.setInterval(loadChats, 15000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    if (!token || !prefillGuideId || initializedGuideRef.current === prefillGuideId) return;

    let active = true;

    const ensureGuideChat = async () => {
      try {
        const response = await getOrCreateGuideChat(prefillGuideId);
        if (!active) return;

        const nextChat = response?.chat;
        if (!nextChat?._id) return;

        initializedGuideRef.current = prefillGuideId;
        setChats((current) => {
          const exists = current.some((chat) => chat._id === nextChat._id);
          if (exists) {
            return current.map((chat) => (chat._id === nextChat._id ? { ...chat, ...nextChat } : chat));
          }
          return [nextChat, ...current];
        });
        setActiveChatId(nextChat._id);
      } catch (error) {
        if (!active) return;
        setPageError(error?.message || "Unable to open this guide chat.");
      }
    };

    ensureGuideChat();

    return () => {
      active = false;
    };
  }, [token, prefillGuideId]);

  useEffect(() => {
    if (!token || !activeChatId) {
      setMessages([]);
      return;
    }

    let mounted = true;

    const loadMessages = async ({ silent = false } = {}) => {
      if (!silent) {
        setChatLoading(true);
      }

      try {
        const response = await getChatMessages(activeChatId, { page: 1, limit: 100 });
        if (!mounted) return;

        const nextMessages = Array.isArray(response?.messages) ? response.messages : [];
        setMessages(nextMessages);
        setSendError("");
        setChats((current) =>
          current.map((chat) =>
            chat._id === activeChatId ? { ...chat, unreadCount: 0 } : chat
          )
        );
      } catch (error) {
        if (!mounted) return;
        setSendError(error?.message || "Unable to load messages for this chat.");
      } finally {
        if (mounted && !silent) {
          setChatLoading(false);
        }
      }
    };

    loadMessages();

    const intervalId = window.setInterval(() => {
      loadMessages({ silent: true });
    }, 10000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [token, activeChatId]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat._id === activeChatId) || null,
    [chats, activeChatId]
  );

  const activeParticipant = useMemo(
    () => getOtherParticipant(activeChat, currentUserId),
    [activeChat, currentUserId]
  );

  const totalUnreadCount = useMemo(
    () => chats.reduce((sum, chat) => sum + Number(chat?.unreadCount || 0), 0),
    [chats]
  );

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const content = draft.trim();
    if (!content || !activeChatId || !activeParticipant?._id) {
      return;
    }

    setSendLoading(true);
    setSendError("");

    try {
      const response = await sendChatMessage({
        chatId: activeChatId,
        receiverId: activeParticipant._id,
        message: content,
      });

      const nextMessage = response?.message;
      if (nextMessage?._id) {
        setMessages((current) => [...current, nextMessage]);
        setChats((current) =>
          current
            .map((chat) =>
              chat._id === activeChatId
                ? {
                    ...chat,
                    lastMessage: nextMessage.message,
                    lastMessageTime: nextMessage.createdAt,
                  }
                : chat
            )
            .sort((left, right) => {
              const leftTime = new Date(left?.lastMessageTime || 0).getTime();
              const rightTime = new Date(right?.lastMessageTime || 0).getTime();
              return rightTime - leftTime;
            })
        );
      }

      window.dispatchEvent(new CustomEvent("notification:sync"));
      setDraft("");
    } catch (error) {
      setSendError(error?.message || "Unable to send this message.");
    } finally {
      setSendLoading(false);
    }
  };

  const handleOpenProfile = async () => {
    if (!activeParticipant?._id) return;

    const fallbackTarget = `/guide/${encodeURIComponent(activeParticipant._id)}`;

    try {
      const guidesResponse = await getGuides();
      const guides = Array.isArray(guidesResponse?.guides)
        ? guidesResponse.guides
        : Array.isArray(guidesResponse)
        ? guidesResponse
        : [];

      const matchedGuide = resolveGuideFromParticipant(guides, activeParticipant);
      const routeParam = matchedGuide ? getGuideRouteParam(matchedGuide) : encodeURIComponent(activeParticipant._id);

      console.debug("[MessagesPage] Open profile requested", {
        participant: activeParticipant,
        guidesLoaded: guides.length,
        matchedGuide,
        routeParam,
      });

      navigate(`/guide/${routeParam}`, {
        state: {
          fallbackGuide: matchedGuide || activeParticipant,
          openedFromMessages: true,
          debugSource: "messages-open-profile",
        },
      });
    } catch (error) {
      console.debug("[MessagesPage] Guide resolution failed, using participant fallback", {
        participant: activeParticipant,
        error: error?.message || error,
      });

      navigate(fallbackTarget, {
        state: {
          fallbackGuide: activeParticipant,
          openedFromMessages: true,
          debugSource: "messages-open-profile-fallback",
        },
      });
    }
  };

  if (!token) {
    return (
      <DashboardLayout>
        <div className="messages-page">
          <div className="messages-empty-state">
            <p className="messages-pill">Private chat</p>
            <h1>Login to message guides and travelers.</h1>
            <p>
              Your backend chat APIs are ready. Sign in here and the frontend will load your
              conversations, sender details, and unread messages.
            </p>
            <Link to="/login" className="messages-primary-btn">
              Login
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="messages-page">
        <div className="messages-header">
          <div>
            <p className="messages-pill">Chat inbox</p>
            <h1>Messages</h1>
            <p className="messages-subtitle">
              Chat with guides and travelers using the existing backend `chatMessage`,
              sender, and receiver flow.
            </p>
          </div>
          <div className="messages-summary-card">
            <strong>{chats.length}</strong>
            <span>{chats.length === 1 ? "conversation" : "conversations"}</span>
            <small>{totalUnreadCount} unread</small>
          </div>
        </div>

        {pageError ? <div className="messages-banner is-error">{pageError}</div> : null}

        <div className="messages-shell">
          <aside className="messages-sidebar">
            <div className="messages-sidebar__header">
              <h2>Inbox</h2>
              <button type="button" onClick={() => navigate("/dashboard")}>
                Explore guides
              </button>
            </div>

            {pageLoading ? <p className="messages-sidebar__empty">Loading chats...</p> : null}

            {!pageLoading && !chats.length ? (
              <div className="messages-sidebar__empty">
                <p>No conversations yet.</p>
                <span>Open a guide profile and tap "Message guide" to start chatting.</span>
              </div>
            ) : null}

            {!pageLoading && chats.length ? (
              <div className="messages-chat-list">
                {chats.map((chat) => {
                  const participant = getOtherParticipant(chat, currentUserId);
                  const isActive = chat._id === activeChatId;
                  return (
                    <button
                      key={chat._id}
                      type="button"
                      className={`messages-chat-card ${isActive ? "is-active" : ""}`}
                      onClick={() => setActiveChatId(chat._id)}
                    >
                      <img
                        src={getAvatarSrc(participant?.avatar)}
                        alt={participant?.name || "User"}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/default_profile.jpg";
                        }}
                      />
                      <div className="messages-chat-card__content">
                        <div className="messages-chat-card__top">
                          <strong>{participant?.name || "Unknown user"}</strong>
                          <span>{formatMessageTime(chat?.lastMessageTime || chat?.createdAt)}</span>
                        </div>
                        <p>{chat?.lastMessage || "Start a conversation"}</p>
                        <div className="messages-chat-card__meta">
                          <small>{participant?.role || "member"}</small>
                          {chat?.unreadCount ? <em>{chat.unreadCount} new</em> : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </aside>

          <section className="messages-thread">
            {!activeChat ? (
              <div className="messages-thread__empty">
                <h2>Select a conversation</h2>
                <p>Choose a chat from the inbox to view sender and receiver messages.</p>
              </div>
            ) : (
              <>
                <div className="messages-thread__header">
                  <div className="messages-thread__person">
                    <img
                      src={getAvatarSrc(activeParticipant?.avatar)}
                      alt={activeParticipant?.name || "User"}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/default_profile.jpg";
                      }}
                    />
                    <div>
                      <h2>{activeParticipant?.name || "Unknown user"}</h2>
                      <p>
                        {activeParticipant?.role || "member"}
                        {activeParticipant?.email ? ` - ${activeParticipant.email}` : ""}
                      </p>
                    </div>
                  </div>

                  {activeParticipant?._id && ["guide", "admin"].includes(activeParticipant?.role) ? (
                    <button
                      type="button"
                      className="messages-secondary-btn"
                      onClick={handleOpenProfile}
                    >
                      Open profile
                    </button>
                  ) : null}
                </div>

                <div className="messages-thread__body">
                  {chatLoading ? <p className="messages-thread__hint">Loading messages...</p> : null}
                  {!chatLoading && !messages.length ? (
                    <p className="messages-thread__hint">No messages yet. Send the first one below.</p>
                  ) : null}

                  {messages.map((item) => {
                    const isMine = item?.sender?._id === currentUserId || item?.sender === currentUserId;
                    return (
                      <article
                        key={item._id}
                        className={`message-bubble ${isMine ? "is-mine" : "is-theirs"}`}
                      >
                        <p>{item?.message || ""}</p>
                        <span>{formatMessageTime(item?.createdAt)}</span>
                      </article>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form className="messages-composer" onSubmit={handleSendMessage}>
                  <label htmlFor="message-input" className="sr-only">
                    Message
                  </label>
                  <textarea
                    id="message-input"
                    rows="2"
                    placeholder={`Message ${activeParticipant?.name || "user"}...`}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <div className="messages-composer__footer">
                    <div>
                      {sendError ? <span className="messages-form-error">{sendError}</span> : null}
                    </div>
                    <button
                      type="submit"
                      className="messages-primary-btn"
                      disabled={sendLoading || !draft.trim()}
                    >
                      {sendLoading ? "Sending..." : "Send message"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;
