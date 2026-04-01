import { useState } from "react";
import { createPost } from "../../services/api";
import "./CreatePost.css";

const CreatePost = ({ refreshPosts, onClose }) => {

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [location, setLocation] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImage = (file) => {
    if (!file) return;

    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !body) {
      alert("Please provide title and description");
      return;
    }

    setLoading(true);

    try {
      const res = await createPost({ title, body, photoFile, location });

      if (res && (res.post || res.success)) {

        setTitle("");
        setBody("");
        setPhotoFile(null);
        setPreview(null);

        if (refreshPosts) refreshPosts();

        if (onClose) onClose();   // close form automatically

        alert(res.message || "Post created successfully");
      }

    } catch (err) {
      console.error(err);
      alert("Error creating post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">

      <form onSubmit={handleSubmit}>

        {/* Title */}
        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Upload Box (Hidden after upload) */}
        {!preview && (
          <div
            className="upload-box"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <p>Drag image here</p>
            <span>or</span>

            <label className="upload-btn">
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImage(e.target.files[0])}
                hidden
              />
            </label>
          </div>
        )}

        {/* Image Preview */}
        {preview && (
          <div className="image-preview">
            <img src={preview} alt="preview" />
          </div>
        )}

        {/* Description */}
        <textarea
          placeholder="Share your travel experience..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

          {/* Location */}
          <input
            type="text"
            placeholder="Location (city, state or place)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

        <button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post"}
        </button>

      </form>

    </div>
  );
};

export default CreatePost;