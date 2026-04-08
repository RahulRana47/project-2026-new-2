import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../Dashboard/Navbar";
import { getGuides } from "../services/api";
import "./GuideProfile.css";

const getGuideSlug = (guide) =>
  encodeURIComponent(guide?._id || guide?.name || "guide");

const GuideProfile = () => {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fallbackGuide = location.state?.fallbackGuide || null;
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await getGuides();
        const list = Array.isArray(res?.guides)
          ? res.guides
          : Array.isArray(res)
          ? res
          : [];

        const decodedId = decodeURIComponent(guideId || "");

        const match =
          list.find((g) => getGuideSlug(g) === encodeURIComponent(decodedId)) ||
          list.find((g) => (g._id || "") === decodedId) ||
          list.find(
            (g) => (g.name || "").toLowerCase() === decodedId.toLowerCase()
          );

        if (mounted) setGuide(match || fallbackGuide || null);
      } catch (err) {
        console.error("Failed to fetch guide profile", err);
        if (mounted) setGuide(fallbackGuide || null);
      }
      if (mounted) setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [guideId]);

  const locationText = useMemo(() => {
    if (!guide?.location) return "Location not provided";
    if (typeof guide.location === "string") return guide.location;
    const { city, state, country } = guide.location;
    return [city, state, country].filter(Boolean).join(", ") || "Location not provided";
  }, [guide]);

  const avatarSrc = useMemo(() => {
    const src = guide?.avatar || guide?.photo || guide?.image;
    if (!src) return "/default_profile.jpg";
    return src.startsWith("http") ? src : `http://localhost:5000/uploads/${src}`;
  }, [guide]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="guide-profile page">
          <p className="muted">Loading guide profile…</p>
        </div>
      </>
    );
  }

  if (!guide) {
    return (
      <>
        <Navbar />
        <div className="guide-profile page">
          <p className="muted">We couldn&apos;t find that guide.</p>
          <button className="primary-btn" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="guide-profile page">
        <div className="guide-hero">
          <img src={avatarSrc} alt={guide.name} />
          <div className="guide-meta">
            <p className="eyebrow">Local guide</p>
            <h1>{guide.name}</h1>
            <p className="muted">{locationText}</p>
            <div className="guide-tags">
              {guide.languages?.length && (
                <span className="pill">
                  Languages: {guide.languages.join(", ")}
                </span>
              )}
              {guide.experience && (
                <span className="pill">{guide.experience} yrs experience</span>
              )}
              <span className="pill">
                {guide.price ? `Rs. ${guide.price} / day` : "Pricing on request"}
              </span>
            </div>
            <div className="cta-row">
              <button className="primary-btn">Message guide</button>
              <button
                className="ghost-btn"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
            </div>
          </div>
        </div>

        <div className="guide-body">
          <section>
            <h3>About {guide.name}</h3>
            <p className="muted">
              {guide.bio ||
                "This guide loves showing visitors around hidden corners, local eateries, and heritage spots. Reach out to plan a custom itinerary."}
            </p>
          </section>

          <section className="info-grid">
            <div>
              <h4>Location</h4>
              <p>{locationText}</p>
            </div>
            <div>
              <h4>Day rate</h4>
              <p>{guide.price ? `Rs. ${guide.price}` : "Contact for quote"}</p>
            </div>
            <div>
              <h4>Contact</h4>
              <p>{guide.email || guide.phone || "Available on request"}</p>
            </div>
          </section>

          <section>
            <h3>Similar guides</h3>
            <div className="similar-row">
              <Link to="/dashboard" className="pill-link">
                Explore more guides
              </Link>
              <Link to="/state/Delhi" className="pill-link">
                Delhi guides
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default GuideProfile;
