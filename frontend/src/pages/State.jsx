import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPosts, getGuides } from "../services/api";
import PostCard from "../Dashboard/myProfiles/PostCard";
import Navbar from "../Dashboard/Navbar";
import "./State.css";

const staticPlaces = {
  Chandigarh: [
    {
      title: "Rock Garden",
      image:
        "https://images.unsplash.com/photo-1549880338-65ddcdfd017b",
      desc: "A unique garden of sculptures made from urban and industrial waste.",
    },
    {
      title: "Sukhna Lake",
      image:
        "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
      desc: "Popular lake for boating and evening strolls.",
    },
  ],
};

const heroImages = {
  Chandigarh:
    "https://images.unsplash.com/photo-1582719478248-54e9f2b55b8b?auto=format&fit=crop&w=1600&q=80",
  Delhi:
    "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1600&q=80",
  Punjab:
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
  "Himachal Pradesh":
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
  "Jammu & Kashmir":
    "/Sonmarg4.jpg",
  GOA:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  Utrakhand:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
};

const vibeTags = {
  Utrakhand: ["Himalayan escapes", "Lake views", "Starry nights"],
  Chandigarh: ["Modernist city", "Gardens", "Cafés"],
  Delhi: ["Heritage", "Street food", "Night bazaars"],
  Punjab: ["Golden farms", "Gurdwaras", "Folk vibes"],
  GOA: ["Beaches", "Sunsets", "Shacks"],
};

const State = () => {
  const { stateName } = useParams();
  const decoded = decodeURIComponent(stateName || "");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guides, setGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [cityFilter, setCityFilter] = useState("");

  const heroImage = useMemo(
    () => heroImages[decoded] || "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
    [decoded]
  );

  const tags = vibeTags[decoded] || ["Local gems", "Hidden cafés", "Weekend plans"];

  const availableCities = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => {
      const loc = p?.location;
      const city = typeof loc === "string" ? loc : loc?.city;
      if (city) set.add(city);
    });
    guides.forEach((g) => {
      const city = g?.location?.city;
      if (city) set.add(city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [posts, guides]);

  const filteredPosts = useMemo(() => {
    if (!cityFilter) return posts;
    return posts.filter((p) => {
      const loc = p?.location;
      const city = typeof loc === "string" ? loc : loc?.city;
      return city?.toLowerCase() === cityFilter.toLowerCase();
    });
  }, [cityFilter, posts]);

  const filteredGuides = useMemo(() => {
    if (!cityFilter) return guides;
    return guides.filter(
      (g) => g?.location?.city?.toLowerCase() === cityFilter.toLowerCase()
    );
  }, [cityFilter, guides]);

  const getGuideSlug = (g) =>
    encodeURIComponent(g?._id || g?.name || "guide");

  const getGuideImage = (guide) => {
    const src = guide?.avatar || guide?.photo || guide?.image;
    if (!src) return "/default_profile.jpg";
    return src.startsWith("http") ? src : `http://localhost:5000/uploads/${src}`;
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await getPosts(1, 50);

        if (!mounted) return;

        if (res && res.success && Array.isArray(res.posts)) {
          const filtered = res.posts.filter((p) => {
            const text = `${p.title || ""} ${p.body || ""}`.toLowerCase();
            return text.includes(decoded.toLowerCase());
          });
          setPosts(filtered);
        } else if (res && Array.isArray(res.posts)) {
          setPosts(res.posts);
        }
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [decoded]);

  useEffect(() => {
    let mounted = true;
    const loadGuides = async () => {
      setGuidesLoading(true);
      try {
        const res = await getGuides();
        const list = Array.isArray(res?.guides)
          ? res.guides
          : Array.isArray(res)
          ? res
          : [];
        if (!mounted) return;
        const filtered = list.filter((g) => {
          const s = (g?.location?.state || "").toLowerCase();
          return s === decoded.toLowerCase();
        });
        setGuides(filtered);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setGuides([]);
      }
      setGuidesLoading(false);
    };

    loadGuides();

    return () => (mounted = false);
  }, [decoded]);

  return (
    <>
      {/* ✅ Navbar added */}
      <Navbar />

      <div className="state-page">
        <header className="state-hero" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">State guide • curated by locals</p>
            <h1>{decoded}</h1>
            <p className="hero-sub">Top places, local posts, and people to help you explore {decoded} better.</p>
            <div className="hero-tags">
              {tags.map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
            <div className="hero-stats">
              <div>
                <strong>{filteredPosts.length}</strong>
                <span>community posts</span>
              </div>
              <div>
                <strong>{filteredGuides.length}</strong>
                <span>local guides</span>
              </div>
              <div>
                <strong>{(staticPlaces[decoded] || []).length}</strong>
                <span>must-visit spots</span>
              </div>
            </div>
          </div>
        </header>

        {/* Places Section */}
        <section className="state-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Best visiting places</p>
              <h3>Static picks locals swear by</h3>
              <p className="section-sub">
                A quick shortlist of spots you can drop into without heavy planning.
              </p>
            </div>
          </div>

          <div className="places-grid">
            {(staticPlaces[decoded] || []).map((p, i) => (
              <article key={i} className="place-card">
                <div className="place-media">
                  <img src={p.image} alt={p.title} />
                  <div className="place-fade" />
                  <span className="pill">Evergreen</span>
                </div>
                <div className="place-body">
                  <h4>{p.title}</h4>
                  <p>{p.desc}</p>
                </div>
              </article>
            ))}

            {!(staticPlaces[decoded] || []).length && (
              <p className="muted">No static places defined for {decoded} yet.</p>
            )}
          </div>
        </section>

        {/* Posts Section */}
        <section className="state-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Area posts</p>
              <h3>What locals are talking about</h3>
              <p className="section-sub">Fresh experiences, guides, and hidden gems from the community.</p>
            </div>
            <div className="filter-bar">
              <label htmlFor="city-filter">Filter by city</label>
              <select
                id="city-filter"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <option value="">All cities</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="muted">Loading posts…</p>
          ) : filteredPosts.length === 0 ? (
            <p className="muted">No posts found {cityFilter ? `for ${cityFilter}` : `for ${decoded}` }.</p>
          ) : (
            <div className="posts-grid">
              {filteredPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* Guides Section */}
        <section className="state-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Local guides</p>
              <h3>Meet the people who can show you around</h3>
              <p className="section-sub">Ping a guide, plan an itinerary, or join a walking tour.</p>
            </div>
            <div className="filter-bar">
              <label htmlFor="city-filter-guides">Filter by city</label>
              <select
                id="city-filter-guides"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <option value="">All cities</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {guidesLoading ? (
            <p className="muted">Loading guides…</p>
          ) : filteredGuides.length === 0 ? (
            <p className="muted">No guides found {cityFilter ? `for ${cityFilter}` : `for ${decoded}` }.</p>
          ) : (
            <div className="guide-grid">
              {filteredGuides.map((g) => (
                <Link
                  key={g._id}
                  className="guide-card"
                  to={`/guide/${getGuideSlug(g)}`}
                >
                  <div className="guide-avatar">
                    <img
                      src={getGuideImage(g)}
                      alt={g.name}
                    />
                    <span className="pill">Trusted</span>
                  </div>
                  <div className="guide-body">
                    <h4>{g.name}</h4>
                    <p className="muted">
                      {g.location?.city || ""}
                      {g.location?.state ? `, ${g.location.state}` : ""}
                    </p>
                    <p className="price">{g.price ? `Rs. ${g.price} / day` : "Pricing on request"}</p>
                    <span className="ghost-btn link-btn">View Profile</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default State;
