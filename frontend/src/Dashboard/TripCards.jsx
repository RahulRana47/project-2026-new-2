<article className="social-post-card">
  {/* HEADER */}
  <div className="post-header">
    <div className="post-user">
      <img
        className="post-avatar"
        src={avatarUrl(first.postedBy?.avatar)}
        alt="user"
      />
      <div>
        <div className="post-username">
          {first.postedBy?.name || "Traveler"}
        </div>
        {getStateFromPost(first) && (
          <div className="post-location">
            {getStateFromPost(first)}
          </div>
        )}
      </div>
    </div>
  </div>

  {/* IMAGE */}
  <div className="post-image">
    <img
      src={
        first.photo ||
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
      }
      alt="post"
    />
  </div>

  {/* ACTIONS */}
  <div className="post-actions">
    <div className="left-actions">
      <button
        className={`icon-btn ${isLikedByMe(first) ? "liked" : ""}`}
        onClick={() => handleToggleLike(first)}
      >
        <FontAwesomeIcon icon={faHeart} />
      </button>

      <button
        className="icon-btn"
        onClick={() =>
          setActivePostId((prev) =>
            prev === first._id ? null : first._id
          )
        }
      >
        <FontAwesomeIcon icon={faCommentDots} />
      </button>

      <button
        className="icon-btn"
        onClick={() => handleShare(first)}
      >
        <FontAwesomeIcon icon={faPaperPlane} />
      </button>
    </div>
  </div>

  {/* TEXT CONTENT */}
  <div className="post-content">
    <div className="likes-count">
      {Array.isArray(first.likes) ? first.likes.length : 0} likes
    </div>

    <div className="post-caption">
      <span className="username">
        {first.postedBy?.name || "Traveler"}
      </span>{" "}
      {clampText(first.body, 100)}
    </div>
  </div>

  {/* COMMENT INPUT */}
  {activePostId === first._id && !first.__fallback && (
    <div className="comment-box">
      <input
        value={commentDraft}
        onChange={(e) => setCommentDraft(e.target.value)}
        placeholder="Add a comment..."
      />
      <button onClick={() => handleSubmitComment(first)}>
        Post
      </button>
    </div>
  )}
</article>