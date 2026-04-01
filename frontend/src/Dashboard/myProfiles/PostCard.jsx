import { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faCommentDots } from "@fortawesome/free-solid-svg-icons";

import {
  updatePost,
  deletePost,
  likePost,
  dislikePost,
  commentPost,
  getMe,
} from "../../services/api";

import "./PostCard.css";

const PostCard = ({ post, refreshPosts, currentUser, showMenu = false }) => {

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [dislikes, setDislikes] = useState(post.dislikes?.length || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [me, setMe] = useState(currentUser || null);
  const [liked, setLiked] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");

  const menuRef = useRef();

  if (!post) return null;

  // Determine post owner (some places use postedBy, older code used user)
  const postOwner = post?.postedBy || post?.user || null;
  const postOwnerId = postOwner?._id || null;

  // compute current viewer id from prop or fetched `me`
  const viewerId = (currentUser && currentUser._id) || (me && me._id) || null;
  const isOwner = viewerId ? postOwnerId === viewerId : false;

  // Resolve avatar URL: backend may return a full URL (Cloudinary) or just a filename stored on the server.
  const avatarSrc = postOwner?.avatar
    ? (postOwner.avatar.startsWith("http") ? postOwner.avatar : `http://localhost:5000/uploads/${postOwner.avatar}`)
    : (post?.avatar || "/default_profile.jpg");

  // ---------------- LIKE ----------------

  const handleLike = async () => {
    try {
      // Toggle like/unlike depending on current state
      const res = liked ? await dislikePost(post._id) : await likePost(post._id);

      setLikes(res.post.likes.length);

      const userId = (currentUser && currentUser._id) || (me && me._id);
      setLiked(Boolean(res.post.likes?.some((id) => id.toString() === userId)));
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- DISLIKE ----------------

  const handleDislike = async () => {
    try {
      // This app currently uses an "unlike" endpoint. Treat dislike button as "remove like".
      const res = await dislikePost(post._id);

      // update likes count and liked flag from response
      setLikes(res.post.likes.length);
      const userId = (currentUser && currentUser._id) || (me && me._id);
      setLiked(Boolean(res.post.likes?.some((id) => id.toString() === userId)));

      // keep any existing dislikes count updated (if backend supports it later)
      setDislikes(res.post.dislikes?.length || 0);
    } catch (err) {
      console.error(err);
    }
  };

  // fetch current user if not provided via props
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!currentUser) {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await getMe(token);
        if (mounted && res && res.success) setMe(res.user);
      }
    };
    init();
    return () => (mounted = false);
  }, [currentUser]);

  // initialize liked state when we have user or post.likes changes
  useEffect(() => {
    const userId = (currentUser && currentUser._id) || (me && me._id);
    if (userId) setLiked(Boolean(post.likes?.some((id) => id.toString() === userId)));
  }, [post.likes, currentUser, me]);

  // Close menu when clicking outside or when scrolling the page
  useEffect(() => {
    if (!menuOpen) return;

    const handleDocumentClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setMenuOpen(false);
    };

    document.addEventListener("click", handleDocumentClick);
    // passive true for better scroll performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [menuOpen]);

  // ---------------- COMMENT ----------------

  const handleComment = async () => {

    if (!commentText.trim()) return;

    try {

      const res = await commentPost(post._id, commentText);

      setComments(res.post.comments);

      setCommentText("");

    } catch (err) {
      console.error(err);
    }

  };

  // ---------------- EDIT ----------------

  const openEdit = (type) => {

    setMenuOpen(false);

    setEditing(type);

    if (type === "title") setEditValue(post.title || "");
    if (type === "body") setEditValue(post.body || "");

  };

  const handleUpdate = async () => {

    setLoading(true);

    try {

      const payload = {};

      if (editing === "title") payload.title = editValue;
      if (editing === "body") payload.body = editValue;
      if (editing === "photo") payload.photoFile = editFile;

      await updatePost(post._id, payload);

      setEditing(null);

      if (refreshPosts) refreshPosts();

    } catch (err) {

      console.error(err);

      alert("Update failed");

    }

    setLoading(false);

  };

  // ---------------- DELETE ----------------

  const handleDelete = async () => {

    const ok = window.confirm("Delete this post?");

    if (!ok) return;

    setLoading(true);

    try {

      await deletePost(post._id);

      if (refreshPosts) refreshPosts();

    } catch (err) {

      console.error(err);

    }

    setLoading(false);

  };

  return (

    <div className="post-card">

      {/* HEADER */}

      <div className="post-header">

        <div className="post-user">
          <img
            className="user-avatar"
            src={avatarSrc}
            alt={postOwner?.name || 'User'}
          />

          <div className="user-info">
            <span className="user-name">{postOwner?.name || 'User'}</span>

            {post.location && (
              <span className="post-location">
                {typeof post.location === 'string'
                  ? post.location
                  : post.location?.city || post.location?.state || ''}
              </span>
            )}
          </div>
        </div>

        {showMenu && isOwner && (

          <div className="post-menu" ref={menuRef}>

            <i
              className="fa fa-ellipsis-v menu-icon"
              onClick={() => setMenuOpen((s) => !s)}
            />

            {menuOpen && (

              <div className="menu-dropdown">

                <button onClick={() => openEdit("title")}>
                  Edit Title
                </button>

                <button onClick={() => openEdit("body")}>
                  Edit Description
                </button>

                <button onClick={() => openEdit("photo")}>
                  Change Image
                </button>

                <button
                  className="delete-btn"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete Post
                </button>

              </div>

            )}

          </div>

        )}

      </div>

      {/* Title placed below header so it doesn't conflict with avatar/menu spacing */}
      {post.title && (
        <h3 className="post-title">{post.title}</h3>
      )}


      {/* IMAGE */}

      <div className="post-image">

        <img src={post.photo || post.image} alt="post" />

      </div>


      {/* DESCRIPTION */}

      <div className="post-description">

        <p>{post.body || post.description}</p>

      </div>


      {/* ACTION BUTTONS */}

      <div className="post-actions">

        <button
          className={`like-btn ${liked ? 'is-liked' : ''}`}
          onClick={handleLike}
          aria-pressed={liked}
        >
          <FontAwesomeIcon icon={faHeart} className={liked ? 'heart liked' : 'heart'} />
          <span>{likes}</span>
        </button>

        <button className="dislike-btn" onClick={handleDislike}>
          👎 {dislikes}
        </button>

        <button
          className="comment-btn"
          onClick={() => setShowCommentBox(!showCommentBox)}
        >
          <FontAwesomeIcon icon={faCommentDots} />
          <span>{comments.length}</span>
        </button>

      </div>

      {/* COMMENTS PANEL (context-like) */}
      {showCommentBox && (
        <div className="comments-panel" role="dialog">
          <div className="panel-header">
            <strong>Comments</strong>
            <button className="close-panel" onClick={() => setShowCommentBox(false)}>✕</button>
          </div>

          <div className="panel-list">
            {comments.length === 0 ? (
              <div className="empty">No comments yet.</div>
            ) : (
              comments.map((c, i) => (
                <div key={i} className="comment-item">
                  <strong>{c.commentedBy?.name || 'User'}:</strong>
                  <span className="comment-text"> {c.text}</span>
                </div>
              ))
            )}
          </div>

          <div className="panel-input">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button onClick={handleComment}>Post</button>
          </div>
        </div>
      )}

      {/* Inline comments removed — comments shown only in context panel */}


      {/* COMMENT BOX */}

      {showCommentBox && (

        <div className="comment-box">

          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />

          <button onClick={handleComment}>
            Post
          </button>

        </div>

      )}


      {/* EDIT MODAL */}

      {editing && (

        <div className="edit-modal">

          <div className="edit-panel">

            <h4>

              {editing === "title"
                ? "Edit Title"
                : editing === "body"
                ? "Edit Description"
                : "Change Image"}

            </h4>

            {(editing === "title" || editing === "body") && (

              editing === "title" ? (

                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />

              ) : (

                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />

              )

            )}

            {editing === "photo" && (

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setEditFile(e.target.files[0] || null)
                }
              />

            )}

            <div className="edit-actions">

              <button
                onClick={() => setEditing(null)}
                className="cancel-btn"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                disabled={loading}
                className="save-btn"
              >
                {loading ? "Saving..." : "Save"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};

export default PostCard;