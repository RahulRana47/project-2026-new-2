import { useRef, useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

import {
  updatePost,
  deletePost,
  likePost,
  dislikePost,
  commentPost,
  getMe,
  deleteComment,
} from "../../services/api";

import "./PostCard.css";

const PostCard = ({ post, refreshPosts, currentUser, showMenu = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [me, setMe] = useState(currentUser || null);
  const [liked, setLiked] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");

  const menuRef = useRef();

  if (!post) return null;

  const postOwner = post?.postedBy || post?.user || null;
  const postOwnerId = postOwner?._id || null;
  const ownerName = useMemo(
    () =>
      postOwner?.name ||
      postOwner?.username ||
      postOwner?.fullName ||
      post?.name ||
      "User",
    [postOwner, post?.name]
  );

  const viewerId = (currentUser && currentUser._id) || (me && me._id) || null;
  const isOwner = viewerId ? postOwnerId === viewerId : false;

  const avatarSrc = postOwner?.avatar
    ? postOwner.avatar.startsWith("http")
      ? postOwner.avatar
      : `http://localhost:5000/uploads/${postOwner.avatar}`
    : post?.avatar || "/default_profile.jpg";

  const locationLabel = useMemo(() => {
    const loc = post?.location;
    if (!loc) return "Location not provided";
    if (typeof loc === "string") return loc;
    const city = loc.city || "";
    const state = loc.state || "";
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    if (loc.coordinates) return `${loc.coordinates}`;
    return "Location not provided";
  }, [post]);

  const handleLike = async () => {
    try {
      const res = liked ? await dislikePost(post._id) : await likePost(post._id);

      const serverLikes = Array.isArray(res?.post?.likes) ? res.post.likes : [];
      setLikes(serverLikes.length);

      const userId = (currentUser && currentUser._id) || (me && me._id);
      setLiked(Boolean(serverLikes?.some((id) => id?.toString && id.toString() === userId?.toString())));
    } catch (err) {
      console.error(err);
      // optimistic rollback if API fails
      setLiked((prev) => !prev);
    }
  };

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

  useEffect(() => {
    const userId = (currentUser && currentUser._id) || (me && me._id);
    if (userId) {
      setLiked(Boolean(post.likes?.some((id) => id?.toString && id.toString() === userId.toString())));
    }
  }, [post.likes, currentUser, me]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(`comments:${post._id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setComments(parsed);
      }
    } catch (e) {
      console.warn("Unable to read cached comments", e);
    }
  }, [post._id]);

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
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [menuOpen]);

  const getCommentOwnerId = (c) =>
    c?.commentedBy?._id ||
    c?.user?._id ||
    (typeof c?.commentedBy === "string" ? c.commentedBy : null) ||
    (typeof c?.user === "string" ? c.user : null);

  const persistComments = (nextComments) => {
    setComments(nextComments);
    try {
      localStorage.setItem(`comments:${post._id}`, JSON.stringify(nextComments || []));
    } catch (e) {
      console.warn("Unable to persist comments", e);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      const res = await commentPost(post._id, commentText);
      persistComments(res.post.comments);
      setCommentText("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (comment) => {
    const ownerId = getCommentOwnerId(comment);
    const viewerId = (currentUser && currentUser._id) || (me && me._id);
    if (!viewerId || !ownerId || ownerId.toString() !== viewerId.toString()) return;

    const confirmed = window.confirm("Are you sure you want to delete this comment?");
    if (!confirmed) return;

    try {
      const res = await deleteComment(post._id, comment._id);
      if (res?.post?.comments) {
        persistComments(res.post.comments);
      } else {
        // fallback local removal if API does not return updated list
        const updated = comments.filter((c) => c._id !== comment._id);
        persistComments(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        <Link
          className="post-user"
          to={`/guide/${postOwnerId || encodeURIComponent(ownerName)}`}
          state={{
            fallbackGuide: {
              _id: postOwnerId,
              name: ownerName,
              avatar: postOwner?.avatar || post?.avatar,
              location: post?.location,
              price: post?.price,
            },
          }}
        >
          <img className="user-avatar" src={avatarSrc} alt={ownerName} />

          <div className="user-info">
            <span className="user-name">{ownerName}</span>
            <span className="post-location">{locationLabel}</span>
          </div>
        </Link>

        {showMenu && isOwner && (
          <div className="post-menu" ref={menuRef}>
            <i
              className="fa fa-ellipsis-v menu-icon"
              onClick={() => setMenuOpen((s) => !s)}
            />

            {menuOpen && (
              <div className="menu-dropdown">
                <button onClick={() => openEdit("title")}>Edit Title</button>
                <button onClick={() => openEdit("body")}>Edit Description</button>
                <button onClick={() => openEdit("photo")}>Change Image</button>
                <button className="delete-btn" onClick={handleDelete} disabled={loading}>
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      {post.title && <h3 className="post-title">{post.title}</h3>}

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
          className={`like-btn ${liked ? "is-liked" : ""}`}
          onClick={handleLike}
          aria-pressed={liked}
        >
          <span className="like-label">{liked ? "Unlike" : "Like"}</span>
          <span className="like-count">{likes}</span>
        </button>

        <button
          className="comment-btn"
          onClick={() => setShowCommentBox(!showCommentBox)}
        >
          <FontAwesomeIcon icon={faCommentDots} />
          <span>{comments.length}</span>
        </button>
      </div>

      {/* COMMENTS PANEL */}
      {showCommentBox && (
        <div className="comments-panel" role="dialog" aria-label="comments">
          <div className="panel-header">
            <strong>Comments</strong>
            <button
              type="button"
              className="close-panel"
              onClick={() => setShowCommentBox(false)}
            >
              Close
            </button>
          </div>

          <div className="panel-list">
            {comments.length === 0 ? (
              <div className="empty">No comments yet.</div>
            ) : (
              comments.map((c, i) => {
                const ownerName = c.commentedBy?.name || c.user?.name || "User";
                const ownerId = getCommentOwnerId(c);
                const viewerId = (currentUser && currentUser._id) || (me && me._id);
                const canDelete =
                  viewerId && ownerId && ownerId.toString() === viewerId.toString();

                return (
                  <div key={i} className="comment-item">
                    <strong>{ownerName}:</strong>
                    <span className="comment-text"> {c.text}</span>
                    {canDelete && (
                      <button
                        type="button"
                        className="comment-delete"
                        onClick={() => handleDeleteComment(c)}
                        aria-label="Delete comment"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="panel-input">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="button" onClick={handleComment}>Post</button>
          </div>
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
                onChange={(e) => setEditFile(e.target.files[0] || null)}
              />
            )}

            <div className="edit-actions">
              <button onClick={() => setEditing(null)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleUpdate} disabled={loading} className="save-btn">
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

