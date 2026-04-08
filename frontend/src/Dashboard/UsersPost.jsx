import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPosts } from "../action/postActions";
import PostCard from "./myProfiles/PostCard";

const UsersPost = () => {
  const dispatch = useDispatch();
  const { posts = [], loading } = useSelector((state) => state.post || {});
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    if (!posts.length && !loading) {
      dispatch(fetchPosts());
    }
  }, [posts.length, loading, dispatch]);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
  }, [posts]);

  const visiblePosts = sortedPosts.slice(0, visibleCount);

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(sortedPosts.length, prev + 40));
  };

  const allShown = visibleCount >= sortedPosts.length;

  return (
    <div className="postsContainer">
      <div className="postsHeader">
        <h2>Community Posts</h2>
      </div>

      <div className="postsGrid">
        {visiblePosts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            refreshPosts={() => dispatch(fetchPosts())}
            showMenu={false}
          />
        ))}
        {!visiblePosts.length && !loading && <p className="muted">No posts yet.</p>}
        {loading && <p className="muted">Loading posts...</p>}
      </div>

      {!allShown && (
        <div className="show-more-row">
          <button className="show-more-btn" onClick={handleShowMore} disabled={loading}>
            Show More (+40)
          </button>
        </div>
      )}
    </div>
  );
};

export default UsersPost;
