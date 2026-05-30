import { useState } from "react";
import { createPost } from "../../services/api";
import "./CreatePost.css";

const CreatePost = ({ refreshPosts, onClose }) => {

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [price, setPrice] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [location, setLocation] = useState({ city: "", state: "" });
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

    const parsedLocation = {
      city: location.city.trim(),
      state: location.state.trim(),
    };

    if (!title || !body || price === "" || !photoFile || !parsedLocation.city || !parsedLocation.state) {
      alert("Please provide title, description, price, photo, and location as City, State");
      return;
    }

    setLoading(true);

    try {
      const res = await createPost({ title, body, price, photoFile, location: parsedLocation });

      if (res && (res.post || res.success)) {

        setTitle("");
        setBody("");
        setPrice("");
        setPhotoFile(null);
        setLocation({ city: "", state: "" });
        setPreview(null);

        if (refreshPosts) refreshPosts();

        if (onClose) onClose();   // close form automatically

        alert(res.message || "Post created successfully");
      } else {
        alert(res?.message || res?.error || "Unable to create post");
      }

    } catch (err) {
      console.error(err);
      alert(err?.message || "Error creating post");
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

        <input
          type="number"
          min="0"
          step="any"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

          {/* Location */}
          <div className="create-post-location">
            <input
              type="text"
              placeholder="City"
              value={location.city}
              onChange={(e) =>
                setLocation((current) => ({ ...current, city: e.target.value }))
              }
            />
            <input
              type="text"
              placeholder="State"
              value={location.state}
              onChange={(e) =>
                setLocation((current) => ({ ...current, state: e.target.value }))
              }
            />
          </div>

        <button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post"}
        </button>

      </form>

    </div>
  );
};

export default CreatePost;
