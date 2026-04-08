import { useEffect, useState } from "react";
import "./Carasol.css";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
    title: "DISCOVER THE UNSEEN",
    subtitle: "Himalayan Escapes",
  },
  {
    image:
      "https://plus.unsplash.com/premium_photo-1697729701846-e34563b06d47?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dG91ciUyMGdvYXxlbnwwfHwwfHx8MA%3D%3D",
    title: "ESCAPE THE ORDINARY",
    subtitle: "Goa Vibes",
  },
  {
    image:
      "https://images.unsplash.com/photo-1587135941948-670b381f08ce?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dGFqJTIwbWFoYWx8ZW58MHx8MHx8fDA%3D",
    title: "Taj Mahal",
    subtitle: "Experience the beauty of India's greatest wonder",
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
      <button className="prev-btn" onClick={prevSlide} aria-label="Previous slide">
        ‹
      </button>
      <button className="next-btn" onClick={nextSlide} aria-label="Next slide">
        ›
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


