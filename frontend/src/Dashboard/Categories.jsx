import "./Categories.css";
import { useRef, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { fetchPosts } from "../action/postActions";

const Categories = () => {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { posts = [], loading } = useSelector((state) => state.post || {});

  useEffect(() => {
    if (!posts.length && !loading) {
      dispatch(fetchPosts());
    }
  }, [dispatch, posts.length, loading]);

  // manage scroll button visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    };

    update();
    el.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const stateCards = useMemo(() => {
    const grouped = new Map();

    posts.forEach((p) => {
      const loc = p?.location;
      const stateName =
        typeof loc === "string" ? loc : (loc?.state || "").trim();
      if (!stateName) return;
      const current = grouped.get(stateName) || [];
      current.push(p);
      grouped.set(stateName, current);
    });

    return Array.from(grouped.entries())
      .map(([title, list]) => {
        const firstWithImage =
          list.find((p) => p?.photo || p?.image) || list[0] || {};
        const image =
          firstWithImage?.photo ||
          firstWithImage?.image ||
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";
        return { title, image, count: list.length };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [posts]);

  return (
    <div className="categories bg-white px-6 md:px-10 py-12">
      <div className="categories-header flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Explore by State</h2>
          <p className="text-sm text-slate-500 mt-1">Find your perfect getaway curated from community posts.</p>
        </div>

        <div className="category-arrows flex items-center gap-2">
          <button
            className="shadow-sm hover:bg-slate-200 disabled:opacity-50 disabled:cursor-default"
            onClick={() => {
              if (containerRef.current) containerRef.current.scrollBy({ left: -320, behavior: "smooth" });
            }}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button
            className="shadow-sm hover:bg-slate-200 disabled:opacity-50 disabled:cursor-default"
            onClick={() => {
              if (containerRef.current) containerRef.current.scrollBy({ left: 320, behavior: "smooth" });
            }}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>

      <div className="category-cards" ref={containerRef}>
        {loading && <p className="text-slate-500">Loading states...</p>}
        {!loading && stateCards.length === 0 && (
          <p className="text-slate-500">No states found yet.</p>
        )}
        {stateCards.map((cat) => (
          <Link
            key={cat.title}
            to={`/state/${encodeURIComponent(cat.title)}`}
            className="category-card"
            style={{ backgroundImage: `url(${cat.image})` }}
          >
            <div className="overlay"></div>
            <div className="absolute inset-0 flex flex-col justify-end p-4 z-10 text-white">
              <h3 className="text-lg font-semibold">{cat.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Categories;
