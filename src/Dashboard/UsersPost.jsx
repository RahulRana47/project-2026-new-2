import { useCallback, useEffect, useMemo, useState } from "react";
import PostCard from "./myProfiles/PostCard";
import { getPosts } from "../services/api";

const PAGE_SIZE = 10;

const buildPageItems = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

  if (currentPage <= 4) {
    [2, 3, 4, 5].forEach((page) => pages.add(page));
  }

  if (currentPage >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));
  }

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return sortedPages.reduce((items, page, index) => {
    const previousPage = sortedPages[index - 1];
    if (previousPage && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`);
    }
    items.push(page);
    return items;
  }, []);
};

const RoundedPagination = ({ currentPage, totalPages, onPageChange, disabled }) => {
  if (totalPages <= 1) return null;

  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <nav className="rounded-pagination" aria-label="Posts pagination">
      <button
        type="button"
        className="pagination-arrow"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage <= 1}
        aria-label="Previous page"
      >
        <span aria-hidden="true">{"<"}</span>
      </button>

      {pageItems.map((item) =>
        typeof item === "number" ? (
          <button
            type="button"
            key={item}
            className={`pagination-page ${item === currentPage ? "is-active" : ""}`}
            onClick={() => onPageChange(item)}
            disabled={disabled || item === currentPage}
            aria-current={item === currentPage ? "page" : undefined}
          >
            {item}
          </button>
        ) : (
          <span className="pagination-ellipsis" key={item} aria-hidden="true">
            ...
          </span>
        )
      )}

      <button
        type="button"
        className="pagination-arrow"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage >= totalPages}
        aria-label="Next page"
      >
        <span aria-hidden="true">{">"}</span>
      </button>
    </nav>
  );
};

const UsersPost = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    count: 0,
  });

  const loadPosts = useCallback(async (nextPage = page) => {
    setLoading(true);
    setError("");

    try {
      const res = await getPosts(nextPage, PAGE_SIZE);
      const incoming = Array.isArray(res?.posts) ? res.posts : [];

      setPosts(incoming);
      setPagination({
        currentPage: Number(res?.currentPage) || nextPage,
        totalPages: Math.max(1, Number(res?.totalPages) || 1),
        totalPosts: Number(res?.totalPosts) || incoming.length,
        count: Number(res?.count) || incoming.length,
      });
    } catch (err) {
      console.error(err);
      setPosts([]);
      setError(err?.message || "Unable to load posts.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadPosts(page);
  }, [loadPosts, page]);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
  }, [posts]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  return (
    <div className="postsContainer">
      <div className="postsHeader">
        <div>
          <p className="posts-eyebrow">Explore stories</p>
          <h2>Community Posts</h2>
        </div>
        <span className="posts-count">
          {pagination.totalPosts} {pagination.totalPosts === 1 ? "post" : "posts"}
        </span>
      </div>

      <div className="postsGrid">
        {sortedPosts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            refreshPosts={() => loadPosts(page)}
            showMenu={false}
          />
        ))}
        {!sortedPosts.length && !loading && !error && <p className="muted">No posts yet.</p>}
        {loading && <p className="muted">Loading posts...</p>}
        {error && !loading && <p className="muted">{error}</p>}
      </div>

      <RoundedPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        disabled={loading}
      />
    </div>
  );
};

export default UsersPost;
