import { useEffect, useState } from "react";
import { getMe } from "../../services/api";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import "./MyProfile.css";

const MyProfile = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    avatar: "",
    languages: "",
    location: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);

  const token = localStorage.getItem("token");
  const [showCreate, setShowCreate] = useState(false);

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
    const fetchUser = async () => {
      const res = await getMe(token);

      if (res.success) {
        setUser(res.user);
        setFormData({
          name: res.user.name || "",
          phone: res.user.phone || "",
          avatar: res.user.avatar || "",
          languages: res.user.languages || "",
          location: res.user.location || "",
        });
      }
    };

    fetchUser();
    fetchMyPosts();
  }, [token]);

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
        alert("Profile updated successfully");
        setUser(data.user);
        // update local preview and clear avatarFile
        setFormData((f) => ({ ...f, avatar: data.user.avatar || f.avatar }));
        setAvatarFile(null);
      }
    } catch (error) {
      console.error(error);
      alert("Error updating profile");
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="profile-wrapper">

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
            onClick={() => setShowCreate((s) => !s)}
          >
            {showCreate ? "Close" : "Create Post"}
          </button>

          <h3 className="my-post-title">My Posts</h3>
        </div>

        {showCreate && (
          <CreatePost
            refreshPosts={fetchMyPosts}
            onClose={() => setShowCreate(false)}
          />
        )}

        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          <div className="posts-grid">

            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                refreshPosts={fetchMyPosts}
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