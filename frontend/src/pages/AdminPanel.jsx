import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../Dashboard/DashboardLayout";
import { loadUser } from "../action/authActions";
import { createPost, deletePost, getGuides, getPosts } from "../services/api";
import "./AdminPanel.css";

const initialForm = {
  title: "",
  body: "",
  state: "",
  city: "",
  lat: "",
  lng: "",
};

export default function AdminPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading } = useSelector((state) => state.auth);

  const [form, setForm] = useState(initialForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [posts, setPosts] = useState([]);
  const [guides, setGuides] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [postsError, setPostsError] = useState("");
  const [guidesError, setGuidesError] = useState("");
  const [deletingPostId, setDeletingPostId] = useState("");
  const totalLikes = posts.reduce(
    (sum, post) => sum + (Array.isArray(post?.likes) ? post.likes.length : 0),
    0
  );

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleImage = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm(initialForm);
    setPhotoFile(null);
    setPreview(null);
  };

  const loadAllPosts = async () => {
    setPostsLoading(true);
    setPostsError("");

    try {
      const response = await getPosts(1, 200);
      const list = Array.isArray(response?.posts) ? response.posts : [];
      setPosts(list);
    } catch (error) {
      setPostsError(error?.message || "Unable to load posts.");
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadAllGuides = async () => {
    setGuidesLoading(true);
    setGuidesError("");

    try {
      const response = await getGuides();
      const list = Array.isArray(response?.guides)
        ? response.guides
        : Array.isArray(response)
        ? response
        : [];
      setGuides(list);
    } catch (error) {
      setGuidesError(error?.message || "Unable to load guides.");
      setGuides([]);
    } finally {
      setGuidesLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!postId || !isAdmin) return;

    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    setDeletingPostId(postId);
    setPostsError("");

    try {
      const response = await deletePost(postId);

      if (response?.success || response?.message) {
        setPosts((current) => current.filter((post) => post._id !== postId));
      } else {
        setPostsError(response?.message || "Unable to delete post.");
      }
    } catch (error) {
      setPostsError(error?.message || "Unable to delete post.");
    } finally {
      setDeletingPostId("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      setIsError(true);
      setMessage("Only admin accounts can create posts.");
      return;
    }

    if (!form.title || !form.body || !form.state || !form.city || !photoFile) {
      setIsError(true);
      setMessage("Please fill title, description, state, city, and image.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await createPost({
        title: form.title,
        body: form.body,
        photoFile,
        location: {
          state: form.state,
          city: form.city,
          coordinates: {
            lat: form.lat,
            lng: form.lng,
          },
        },
      });

      if (response?.success || response?.post) {
        resetForm();
        setIsError(false);
        setMessage(response?.message || "Post created successfully.");
        loadAllPosts();
      } else {
        setIsError(true);
        setMessage(response?.message || "Unable to create post.");
      }
    } catch (error) {
      setIsError(true);
      setMessage(error?.message || "Unable to create post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="admin-panel">
        <div className="admin-panel__hero">
          <div>
            <p className="admin-panel__eyebrow">Admin Dashboard</p>
            <h1>Publish destination posts</h1>
            <p className="admin-panel__intro">
              This area is restricted to admin accounts and matches the post fields from your backend API.
            </p>
          </div>
          <div className="admin-panel__meta">
            <span className={`admin-panel__badge ${isAdmin ? "is-admin" : "is-guest"}`}>
              {isAdmin ? "Admin Access" : "No Admin Access"}
            </span>
            <p>{user?.email || "Sign in to continue"}</p>
          </div>
        </div>

        <div className="admin-panel__stats">
          <article className="admin-panel__stat-card">
            <span className="admin-panel__stat-label">Total Posts</span>
            <strong>{posts.length}</strong>
            <small>Loaded in admin view</small>
          </article>
          <article className="admin-panel__stat-card">
            <span className="admin-panel__stat-label">Total Guides</span>
            <strong>{guides.length}</strong>
            <small>Available guide profiles</small>
          </article>
          <article className="admin-panel__stat-card">
            <span className="admin-panel__stat-label">Total Likes</span>
            <strong>{totalLikes}</strong>
            <small>Across loaded posts</small>
          </article>
        </div>

        {!loading && user && !isAdmin ? (
          <div className="admin-panel__blocked">
            <h2>Access restricted</h2>
            <p>
              Your account role is <strong>{user.role || "unknown"}</strong>. Only users with the
              <strong> admin </strong>role should open this panel.
            </p>
          </div>
        ) : (
          <div className="admin-panel__composer-grid">
            <form className="admin-panel__card" onSubmit={handleSubmit}>
              <div className="admin-panel__section-head">
                <div className="admin-panel__section-title">
                  <h2>Create New Post</h2>
                  <p>Upload an image and publish destination content from one place.</p>
                </div>
                <div className="admin-panel__mini-actions">
                  <button
                    type="button"
                    className="admin-panel__quick-btn"
                    onClick={loadAllPosts}
                    disabled={!isAdmin || postsLoading}
                  >
                    {postsLoading ? "Loading..." : "Load Posts"}
                  </button>
                  <button
                    type="button"
                    className="admin-panel__quick-btn admin-panel__quick-btn--soft"
                    onClick={loadAllGuides}
                    disabled={!isAdmin || guidesLoading}
                  >
                    {guidesLoading ? "Loading..." : "Load Guides"}
                  </button>
                </div>
              </div>

              {message && (
                <div className={`admin-panel__message ${isError ? "is-error" : "is-success"}`}>
                  {message}
                </div>
              )}

              <label>
                <span>Title</span>
                <input
                  type="text"
                  name="title"
                  placeholder="Discover Kargil"
                  value={form.title}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  name="body"
                  placeholder="A historic region known for its mountains, culture, and scenic routes."
                  value={form.body}
                  onChange={handleChange}
                />
              </label>

              <div className="admin-panel__columns">
                <label>
                  <span>State</span>
                  <input
                    type="text"
                    name="state"
                    placeholder="JAMMU & KASHMIR"
                    value={form.state}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  <span>City</span>
                  <input
                    type="text"
                    name="city"
                    placeholder="KARGIL"
                    value={form.city}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div className="admin-panel__columns">
                <label>
                  <span>Latitude</span>
                  <input
                    type="number"
                    step="any"
                    name="lat"
                    placeholder="34.5539"
                    value={form.lat}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  <span>Longitude</span>
                  <input
                    type="number"
                    step="any"
                    name="lng"
                    placeholder="76.1348"
                    value={form.lng}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div className="admin-panel__upload">
                <span>Featured Image</span>
                {!preview ? (
                  <label className="admin-panel__upload-box">
                    <strong>Choose image</strong>
                    <small>Upload the same way you do in Postman `photo` file field.</small>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleImage(event.target.files?.[0])}
                      hidden
                    />
                  </label>
                ) : (
                  <div className="admin-panel__preview">
                    <img src={preview} alt="Post preview" />
                    <button
                      type="button"
                      className="admin-panel__secondary-btn"
                      onClick={() => {
                        setPhotoFile(null);
                        setPreview(null);
                      }}
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>

              <div className="admin-panel__actions">
                <button type="submit" disabled={submitting || !isAdmin}>
                  {submitting ? "Publishing..." : "Publish Post"}
                </button>
              </div>
            </form>
          </div>
        )}

        {isAdmin && (
          <>
            <section className="admin-panel__card">
              <div className="admin-panel__section-head">
                <div className="admin-panel__section-title">
                  <h2>All Posts</h2>
                  <p>Admin view of every post returned from the backend.</p>
                </div>
                <button
                  type="button"
                  className="admin-panel__secondary-btn"
                  onClick={loadAllPosts}
                  disabled={postsLoading}
                >
                  Refresh Posts
                </button>
              </div>

              {postsError && <div className="admin-panel__message is-error">{postsError}</div>}
              {!postsError && !posts.length && !postsLoading && (
                <p className="admin-panel__empty">Click "Get All Posts" to load posts here.</p>
              )}

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
              </div>
            </section>

            <section className="admin-panel__card">
              <div className="admin-panel__section-head">
                <div className="admin-panel__section-title">
                  <h2>All Guides</h2>
                  <p>Open guide profiles directly from the admin dashboard.</p>
                </div>
                <button
                  type="button"
                  className="admin-panel__secondary-btn"
                  onClick={loadAllGuides}
                  disabled={guidesLoading}
                >
                  Refresh Guides
                </button>
              </div>

              {guidesError && <div className="admin-panel__message is-error">{guidesError}</div>}
              {!guidesError && !guides.length && !guidesLoading && (
                <p className="admin-panel__empty">Click "Get All Guides" to load guide profiles here.</p>
              )}

              <div className="admin-panel__guide-grid">
                {guides.map((guide, index) => {
                  const image = guide?.avatar || guide?.photo || guide?.image;
                  const imageSrc = image
                    ? image.startsWith("http")
                      ? image
                      : `http://localhost:5000/uploads/${image}`
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
        )}
      </section>
    </DashboardLayout>
  );
}
