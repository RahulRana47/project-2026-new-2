import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loadUser } from "../../action/authActions";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import "./MyProfile.css";

const MyProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading } = useSelector((state) => state.auth);

  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    avatar: "",
    languages: "",
    location: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchMyPosts = async () => {
    try {
      const res = await fetch(`/api/posts/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data && data.posts) setPosts(data.posts);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!user && !loading) {
      dispatch(loadUser());
    }
  }, [token, user, loading, dispatch, navigate]);

  useEffect(() => {
    if (!user || !token) return;

    const role = (user.role || "").toLowerCase();

    if (role === "admin") {
      navigate("/dashboard/admin");
      return;
    }

    if (role !== "guide") {
      navigate("/dashboard");
      return;
    }

    fetchMyPosts();
  }, [user, token, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
        languages: user.languages || "",
        location: user.location || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setFormData({ ...formData, avatar: imageURL });
      setAvatarFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const form = new FormData();
      form.append("name", formData.name || "");
      form.append("phone", formData.phone || "");
      form.append("languages", formData.languages || "");
      form.append("location", formData.location || "");
      // Append avatar file if user selected one
      if (avatarFile) form.append("avatar", avatarFile);

      const res = await fetch(`/api/users/me/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage("Profile updated successfully.");
        dispatch(loadUser());
        setFormData((f) => ({ ...f, avatar: data.user?.avatar || f.avatar }));
        setAvatarFile(null);
      } else {
        setStatusMessage(data?.message || "Unable to update profile.");
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Error updating profile.");
    }
  };

  if (loading || !user) return <p>Loading...</p>;

  const role = (user.role || "").toLowerCase();

  if (role !== "guide") {
    return (
      <div className="profile-wrapper">
        <div className="profile-empty-card">
          <h2>Guide dashboard only</h2>
          <p>This private dashboard is available only for guide accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <div className="guide-dashboard-hero">
        <div>
          <p className="guide-dashboard-eyebrow">Guide Dashboard</p>
          <h1>Manage your own profile and posts</h1>
          <p>
            Only your authenticated guide account can open this area, update your profile, and
            manage the posts created from your own account.
          </p>
        </div>
        <div className="guide-dashboard-stats">
          <div className="guide-stat-card">
            <span>Your Role</span>
            <strong>Guide</strong>
          </div>
          <div className="guide-stat-card">
            <span>Your Posts</span>
            <strong>{posts.length}</strong>
          </div>
        </div>
      </div>

      <div className="profile-card">

        {/* LEFT */}
        <div className="profile-left">
          <div className="profile-image">
            <img src={formData.avatar || "/default_profile.jpg"} alt="avatar" />
          </div>

          <label className="change-photo-btn">
            Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
          </label>
        </div>

        {/* RIGHT */}
        <div className="profile-right">

          <h2>{user.name}</h2>
          <p className="email">{user.email}</p>
          {statusMessage && <p className="profile-status">{statusMessage}</p>}

          <form onSubmit={handleSubmit} className="profile-form">

            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Languages</label>
              <input
                type="text"
                name="languages"
                value={formData.languages}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="update-btn">
              Update Profile
            </button>

          </form>

        </div>

      </div>

      {/* POSTS */}
      <div className="my-posts-section">

        <div className="posts-header">
          <button
            className="create-post-btn"
            onClick={() => setShowCreate((current) => !current)}
          >
            {showCreate ? "Close Create Post" : "Create Post"}
          </button>
          <h3 className="my-post-title">My Posts</h3>
          <p className="my-post-subtitle">
            Only posts created by your guide account appear here, and only you can edit or delete
            them.
          </p>
        </div>

        {showCreate && (
          <CreatePost
            refreshPosts={fetchMyPosts}
            onClose={() => setShowCreate(false)}
          />
        )}

        {posts.length === 0 ? (
          <div className="profile-empty-card">
            <h3>No posts yet</h3>
            <p>Create your first guide post to start sharing destinations and travel updates.</p>
          </div>
        ) : (
          <div className="posts-grid">

            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                refreshPosts={fetchMyPosts}
                currentUser={user}
                showMenu={true}
              />
            ))}

          </div>
        )}

      </div>

    </div>
  );
};

export default MyProfile;
