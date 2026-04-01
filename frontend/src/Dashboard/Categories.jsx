import "./Categories.css";
import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const Categories = () => {
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
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
  const categories = [
    {
      title: "Chandigarh",
      image: "/chandigarh%20image.jpg",
    },
    {
      title: "Utrakhand",
      image:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    },
    {
      title: "Delhi",
      image:
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da",
    },
    {
      title: "Punjab",
      image: "/punjab%20image.jpg",
    },
    {
      title: "Himachal Pradesh",
      image: "/himachal.jpg",
    },
    {
      title: "Jammu & Kashmir",
      image: "/jammu-kashmir.jpg",
    },
    {
      title: "GOA",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    },
  ];

  return (
    <div className="categories">
      <div className="categories-header">
        <div>
          <h2>Explore by State</h2>
          <p>Find Your Perfect Getaway in Each State</p>
        </div>

        <div className="category-arrows">
          <button
            onClick={() => {
              if (containerRef.current) containerRef.current.scrollBy({ left: -320, behavior: "smooth" });
            }}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button
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
        {categories.map((cat, index) => (
          <Link
            key={index}
            to={`/state/${encodeURIComponent(cat.title)}`}
            className="category-card"
            style={{ backgroundImage: `url(${cat.image})` }}
          >
            <div className="overlay"></div>
            <h3>{cat.title}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Categories;