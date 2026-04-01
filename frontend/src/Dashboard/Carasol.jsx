import { useEffect, useState } from "react";
import "./Carasol.css";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    title: "Bali, Indonesia",
    subtitle: "Sacred temples and lush rice terraces",
  },
  {
    image:
      "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1",
    title: "Paris, France",
    subtitle: "City of love and lights",
  },
  {
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    title: "Swiss Alps",
    subtitle: "Snowy peaks and scenic beauty",
  },
];

const Carasol = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === slides.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentIndex(
      currentIndex === slides.length - 1 ? 0 : currentIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex(
      currentIndex === 0 ? slides.length - 1 : currentIndex - 1
    );
  };

  return (
    <div className="carousel">
      <img
        src={slides[currentIndex].image}
        alt="Travel"
        className="carousel-image"
      />

      {/* Dark Overlay */}
      <div className="carousel-dark"></div>

      {/* Center Content */}
      <div className="carousel-content">
        <span className="badge">TRENDING DESTINATION</span>
        <h1>{slides[currentIndex].title}</h1>
        <p>{slides[currentIndex].subtitle}</p>
      </div>

      {/* Arrows */}
      <button className="prev-btn" onClick={prevSlide}>
        ❮
      </button>
      <button className="next-btn" onClick={nextSlide}>
        ❯
      </button>

      {/* Dots */}
      <div className="dots">
        {slides.map((_, index) => (
          <span
            key={index}
            className={`dot ${
              currentIndex === index ? "active" : ""
            }`}
            onClick={() => setCurrentIndex(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default Carasol;