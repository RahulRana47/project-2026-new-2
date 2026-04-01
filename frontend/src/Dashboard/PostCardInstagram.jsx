import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faComment, faShare, faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import "./PostCardInstagram.css";

const PostCardInstagram = ({ post, onLike, onComment, onShare, currentUser }) => {
  const [commentText, setCommentText] = useState("");

  if (!post) return null;

  const owner = post.postedBy || post.user || {};
  const avatar = owner.avatar || "/default-avatar.png";
  const username = owner.name || "User";

  const handleLike = () => {
    if (onLike) onLike(post);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    if (onComment) onComment(post, commentText.trim());
    setCommentText("");
  };

  return (
    <article className="ig-card">
      <header className="ig-header">
        <div className="ig-user">
          <img className="ig-avatar" src={avatar} alt={username} />
          <div className="ig-user-info">
            <div className="ig-username">{username}</div>
            {post.location && (
              <div className="ig-location">
                {typeof post.location === 'string'
                  ? post.location
                  : post.location?.city || post.location?.state || ''}
              </div>
            )}
          </div>
        </div>
        <button className="ig-more" aria-label="more">
          <FontAwesomeIcon icon={faEllipsisH} />
        </button>
      </header>

      <div className="ig-image-wrap">
        <img className="ig-image" src={post.photo || post.image} alt={post.title || "post"} />
      </div>

      <div className="ig-actions">
        <div className="ig-actions-left">
          <button className="ig-btn" onClick={handleLike} aria-label="like">
            <FontAwesomeIcon icon={faHeart} />
          </button>
          <button className="ig-btn" onClick={() => { if (onComment) onComment(post); }} aria-label="comment">
            <FontAwesomeIcon icon={faComment} />
          </button>
          <button className="ig-btn" onClick={() => onShare && onShare(post)} aria-label="share">
            <FontAwesomeIcon icon={faShare} />
          </button>
        </div>
      </div>

      <div className="ig-body">
        <div className="ig-likes">{(Array.isArray(post.likes) ? post.likes.length : 0)} likes</div>

        <div className="ig-caption">
          <span className="ig-caption-user">{username}</span>
          <span className="ig-caption-text"> {post.body || post.description}</span>
        </div>

        {post.comments && post.comments.length > 0 && (
          <div className="ig-comments">
            {post.comments.slice(0, 2).map((c, i) => (
              <div key={i} className="ig-comment">
                <strong>{c.commentedBy?.name || 'User'}:</strong>
                <span> {c.text}</span>
              </div>
            ))}
            {post.comments.length > 2 && (
              <div className="ig-view-more">View all {post.comments.length} comments</div>
            )}
          </div>
        )}
      </div>

      <footer className="ig-footer">
        <div className="ig-comment-input">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
          />
          <button className="ig-post-btn" onClick={handleComment}>Post</button>
        </div>
      </footer>
    </article>
  );
};

export default PostCardInstagram;
