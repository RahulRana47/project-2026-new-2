import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

const State = () => {
  const { stateName } = useParams();
  const decoded = decodeURIComponent(stateName || "");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guides, setGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);

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
        const list = res?.guides || res || [];
        if (!mounted) return;
        const filtered = list.filter((g) => {
          const s = (g?.location?.state || "").toLowerCase();
          return s === decoded.toLowerCase();
        });
        setGuides(filtered);
      } catch (err) {
        console.error(err);
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
        <header className="state-header">
          <h2>{decoded}</h2>
          <p>Top places and local posts from {decoded}</p>
        </header>

        {/* Places Section */}
        <section className="state-places">
          <h3>Best Visiting Places</h3>

          <div className="places-grid">
            {(staticPlaces[decoded] || []).map((p, i) => (
              <article key={i} className="place-card">
                <img src={p.image} alt={p.title} />
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
              </article>
            ))}

            {!(staticPlaces[decoded] || []).length && (
              <p>No static places defined for {decoded} yet.</p>
            )}
          </div>
        </section>

        {/* Posts Section */}
        <section className="state-posts">
          <h3>Area Posts</h3>

          {loading ? (
            <p>Loading posts…</p>
          ) : posts.length === 0 ? (
            <p>No posts found for {decoded}.</p>
          ) : (
            <div className="posts-list">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* Guides Section */}
        <section className="state-guides">
          <h3>Local Guides</h3>
          {guidesLoading ? (
            <p>Loading guides…</p>
          ) : guides.length === 0 ? (
            <p>No guides found for {decoded}.</p>
          ) : (
            <div className="guide-grid">
              {guides.map((g) => (
                <div key={g._id} className="guide-card">
                  <img src={g.avatar ? (g.avatar.startsWith('http') ? g.avatar : `http://localhost:5000/uploads/${g.avatar}`) : '/default_profile.jpg'} alt={g.name} />
                  <h4>{g.name}</h4>
                  <p>{g.location?.city || ''} {g.location?.state ? `, ${g.location.state}` : ''}</p>
                  <p className="price">{g.price ? `₹ ${g.price} / day` : ''}</p>
                  <button>View Profile</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default State;