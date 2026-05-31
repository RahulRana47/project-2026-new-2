import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../Dashboard/DashboardLayout";
import { loadUser } from "../action/authActions";
import {
  deletePost,
  getAdminBookingStats,
  getAdminUsers,
  getGuides,
  getPosts,
  updateUserBlockStatus,
} from "../services/api";
import "./AdminPanel.css";

const emptyStats = {
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  cancelled: 0,
  tripsDone: 0,
};

export default function AdminPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading } = useSelector((state) => state.auth);

  const [posts, setPosts] = useState([]);
  const [guides, setGuides] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookingStats, setBookingStats] = useState(emptyStats);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [deletingPostId, setDeletingPostId] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!user && !loading) {
      dispatch(loadUser());
    }
  }, [token, user, loading, dispatch, navigate]);

  const role = (user?.role || "").toLowerCase();
  const isAdmin = role === "admin";

  const blockedUsers = useMemo(
    () => users.filter((item) => item?.isBlocked).length,
    [users]
  );

  const loadAdminData = async () => {
    if (!isAdmin) return;

    setPageLoading(true);
    setError("");

    try {
      const [postResponse, guideResponse, userResponse, statsResponse] = await Promise.all([
        getPosts(1, 200),
        getGuides(),
        getAdminUsers(),
        getAdminBookingStats(),
      ]);

      setPosts(Array.isArray(postResponse?.posts) ? postResponse.posts : []);
      setGuides(Array.isArray(guideResponse?.guides) ? guideResponse.guides : []);
      setUsers(Array.isArray(userResponse?.users) ? userResponse.users : []);
      setBookingStats(statsResponse?.stats || emptyStats);
    } catch (requestError) {
      setError(requestError?.message || "Unable to load admin dashboard.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadAdminData();
  }, [isAdmin]);

  const handleDeletePost = async (postId) => {
    if (!postId || !isAdmin) return;

    const confirmed = window.confirm("Delete this post from the platform?");
    if (!confirmed) return;

    setDeletingPostId(postId);
    setError("");
    setMessage("");

    try {
      const response = await deletePost(postId);
      if (response?.success || response?.message) {
        setPosts((current) => current.filter((post) => post._id !== postId));
        setMessage(response?.message || "Post deleted.");
      } else {
        setError(response?.message || "Unable to delete post.");
      }
    } catch (requestError) {
      setError(requestError?.message || "Unable to delete post.");
    } finally {
      setDeletingPostId("");
    }
  };

  const handleToggleBlock = async (targetUser) => {
    if (!targetUser?._id || !isAdmin) return;

    const nextBlocked = !targetUser.isBlocked;
    const reason = nextBlocked ? window.prompt("Reason for suspension", "Bad user behavior") : "";
    if (nextBlocked && reason === null) return;

    setBusyId(targetUser._id);
    setError("");
    setMessage("");

    try {
      const response = await updateUserBlockStatus(targetUser._id, {
        isBlocked: nextBlocked,
        reason,
      });

      setUsers((current) =>
        current.map((item) =>
          item._id === targetUser._id ? { ...item, ...response.user } : item
        )
      );
      setMessage(response?.message || "User updated.");
    } catch (requestError) {
      setError(requestError?.message || "Unable to update user.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <DashboardLayout>
      <section className="admin-panel">
        <div className="admin-panel__hero">
          <div>
            <p className="admin-panel__eyebrow">Admin Dashboard</p>
            <h1>Moderation and trip overview</h1>
            <p className="admin-panel__intro">
              Review platform activity, booking progress, and suspend bad users from one place.
            </p>
          </div>
          <div className="admin-panel__meta">
            <span className={`admin-panel__badge ${isAdmin ? "is-admin" : "is-guest"}`}>
              {isAdmin ? "Admin Access" : "No Admin Access"}
            </span>
            <p>{user?.email || "Sign in to continue"}</p>
          </div>
        </div>

        {!loading && user && !isAdmin ? (
          <div className="admin-panel__blocked">
            <h2>Access restricted</h2>
            <p>
              Your account role is <strong>{user.role || "unknown"}</strong>. Only admin accounts
              can open this panel.
            </p>
          </div>
        ) : null}

        {isAdmin ? (
          <>
            <div className="admin-panel__stats">
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Trips Done</span>
                <strong>{bookingStats.tripsDone}</strong>
                <small>Completed bookings</small>
              </article>
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Processing</span>
                <strong>{bookingStats.processing}</strong>
                <small>Confirmed requests</small>
              </article>
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Pending</span>
                <strong>{bookingStats.pending}</strong>
                <small>Requests waiting</small>
              </article>
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Complete</span>
                <strong>{bookingStats.completed}</strong>
                <small>Finished trips</small>
              </article>
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Guides</span>
                <strong>{guides.length}</strong>
                <small>Verified guide profiles</small>
              </article>
              <article className="admin-panel__stat-card">
                <span className="admin-panel__stat-label">Suspended</span>
                <strong>{blockedUsers}</strong>
                <small>Blocked accounts</small>
              </article>
            </div>

            <div className="admin-panel__section-head">
              <div className="admin-panel__section-title">
                <h2>Admin Controls</h2>
                <p>Posts are created by guides only. Admin can moderate posts and users.</p>
              </div>
              <button
                type="button"
                className="admin-panel__secondary-btn"
                onClick={loadAdminData}
                disabled={pageLoading}
              >
                {pageLoading ? "Refreshing..." : "Refresh Dashboard"}
              </button>
            </div>

            {message ? <div className="admin-panel__message is-success">{message}</div> : null}
            {error ? <div className="admin-panel__message is-error">{error}</div> : null}

            <section className="admin-panel__card">
              <div className="admin-panel__section-head">
                <div className="admin-panel__section-title">
                  <h2>User Suspension</h2>
                  <p>Block or restore tourists and guides.</p>
                </div>
              </div>

              <div className="admin-panel__user-list">
                {users.map((item) => (
                  <article key={item._id} className="admin-panel__user-row">
                    <div>
                      <h3>{item.name || "Unnamed user"}</h3>
                      <p>{item.email}</p>
                      <span>{item.role}</span>
                      {item.isBlocked && item.blockedReason ? (
                        <small>Reason: {item.blockedReason}</small>
                      ) : null}
                    </div>
                    <div className="admin-panel__user-actions">
                      <span className={item.isBlocked ? "is-blocked" : "is-active"}>
                        {item.isBlocked ? "Suspended" : "Active"}
                      </span>
                      <button
                        type="button"
                        className={item.isBlocked ? "admin-panel__secondary-btn" : "admin-panel__delete-btn"}
                        disabled={busyId === item._id || item._id === user?._id}
                        onClick={() => handleToggleBlock(item)}
                      >
                        {busyId === item._id
                          ? "Saving..."
                          : item.isBlocked
                          ? "Restore"
                          : "Suspend"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="admin-panel__card">
              <div className="admin-panel__section-head">
                <div className="admin-panel__section-title">
                  <h2>Post Moderation</h2>
                  <p>Remove unsafe or invalid guide posts.</p>
                </div>
              </div>

              <div className="admin-panel__list">
                {posts.map((post) => {
                  const image = post?.photo || post?.image || "/default_profile.jpg";
                  const locationText =
                    typeof post?.location === "string"
                      ? post.location
                      : [post?.location?.city, post?.location?.state].filter(Boolean).join(", ");

                  return (
                    <article key={post._id} className="admin-panel__item">
                      <img src={image} alt={post?.title || "post"} className="admin-panel__item-image" />
                      <div className="admin-panel__item-body">
                        <h3>{post?.title || "Untitled post"}</h3>
                        <p>{post?.body || post?.description || "No description available."}</p>
                        <div className="admin-panel__item-meta">
                          <span>{locationText || "Location not provided"}</span>
                          <span>{post?.price !== undefined ? `Rs. ${post.price}` : "No price"}</span>
                          <span>{post?.likes?.length || 0} likes</span>
                        </div>
                        <div className="admin-panel__item-actions">
                          <button
                            type="button"
                            className="admin-panel__delete-btn"
                            onClick={() => handleDeletePost(post._id)}
                            disabled={deletingPostId === post._id}
                          >
                            {deletingPostId === post._id ? "Deleting..." : "Delete Post"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!posts.length && !pageLoading ? (
                  <p className="admin-panel__empty">No posts loaded yet.</p>
                ) : null}
              </div>
            </section>

            <section className="admin-panel__card">
              <div className="admin-panel__section-head">
                <div className="admin-panel__section-title">
                  <h2>Guide Directory</h2>
                  <p>Open guide profiles directly from the admin dashboard.</p>
                </div>
              </div>

              <div className="admin-panel__guide-grid">
                {guides.map((guide, index) => {
                  const image = guide?.avatar || guide?.photo || guide?.image;
                  const imageSrc = image
                    ? image.startsWith("http")
                      ? image
                      : `${import.meta.env.VITE_API_URL || "https://gullyguide-backend.onrender.com"}/uploads/${image}`
                    : "/default_profile.jpg";
                  const guideSlug = encodeURIComponent(guide?._id || guide?.name || `guide-${index}`);
                  const guideLocation =
                    typeof guide?.location === "string"
                      ? guide.location
                      : [guide?.location?.city, guide?.location?.state].filter(Boolean).join(", ");

                  return (
                    <Link
                      key={guide._id || guideSlug}
                      to={`/guide/${guideSlug}`}
                      className="admin-panel__guide-card"
                    >
                      <img src={imageSrc} alt={guide?.name || "guide"} />
                      <div>
                        <h3>{guide?.name || "Unnamed guide"}</h3>
                        <p>{guideLocation || "Location not provided"}</p>
                        <span>Open Guide Profile</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </DashboardLayout>
  );
}
