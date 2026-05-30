import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Navbar from "../Dashboard/Navbar";
import { fetchPosts } from "../action/postActions";

const StateDetails = () => {
  const { stateName } = useParams();
  const decodedState = decodeURIComponent(stateName || "");
  const dispatch = useDispatch();
  const { posts = [], loading } = useSelector((state) => state.post || {});

  useEffect(() => {
    if (!posts.length && !loading) {
      dispatch(fetchPosts());
    }
  }, [dispatch, posts.length, loading]);

  const statePosts = useMemo(() => {
    const target = decodedState.toLowerCase();
    return posts.filter((post) => {
      const loc = post?.location;
      const stateValue = typeof loc === "string" ? loc : loc?.state;
      return stateValue && stateValue.toLowerCase() === target;
    });
  }, [posts, decodedState]);

  const sortedPosts = useMemo(() => {
    return [...statePosts].sort((a, b) => {
      const aDate = new Date(a?.createdAt || 0).getTime();
      const bDate = new Date(b?.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }, [statePosts]);

  const cities = useMemo(() => {
    const set = new Set();
    statePosts.forEach((post) => {
      const loc = post?.location;
      const cityVal = typeof loc === "string" ? loc : loc?.city;
      if (cityVal) set.add(cityVal);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [statePosts]);

  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    if (!selectedCity && cities.length) {
      setSelectedCity(cities[0]);
    }
  }, [cities, selectedCity]);

  const filteredByCity = useMemo(() => {
    if (!selectedCity) return sortedPosts;
    const target = selectedCity.toLowerCase();
    return sortedPosts.filter((post) => {
      const loc = post?.location;
      const cityVal = typeof loc === "string" ? loc : loc?.city;
      return cityVal && cityVal.toLowerCase() === target;
    });
  }, [sortedPosts, selectedCity]);

  const heroImage = useMemo(() => {
    const withImage = statePosts.find((p) => p?.photo || p?.image);
    return (
      withImage?.photo ||
      withImage?.image ||
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80"
    );
  }, [statePosts]);

  const totalCities = cities.length;
  const totalPosts = statePosts.length;

  const description =
    "Handpicked experiences, photos, and stories curated by locals. Jump into a city to see what people love right now.";

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50">
        <header
          className="relative h-64 md:h-80 w-full overflow-hidden"
          style={{ backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-900/30" />
          <div className="relative z-10 h-full flex flex-col justify-end px-6 md:px-12 pb-8 text-white">
            <p className="uppercase tracking-widest text-xs md:text-sm text-slate-200">State guide - curated by locals</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">{decodedState}</h1>
            <p className="max-w-3xl text-slate-200 mt-2">{description}</p>
            <div className="flex gap-4 mt-4 text-sm text-slate-100">
              <span className="bg-white/10 backdrop-blur px-3 py-1 rounded-full">{totalPosts} posts</span>
              <span className="bg-white/10 backdrop-blur px-3 py-1 rounded-full">{totalCities} cities</span>
            </div>
          </div>
        </header>

        <main className="px-6 md:px-12 py-10 space-y-10">
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Cities</p>
                <h2 className="text-xl font-semibold">Where the community is posting</h2>
              </div>
              <p className="text-sm text-slate-500">Tap a city to filter posts</p>
            </div>

            {cities.length === 0 ? (
              <p className="text-slate-500">No places found for this state yet.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`shrink-0 px-4 py-2 rounded-full border transition hover:-translate-y-0.5 hover:shadow ${
                      city === selectedCity
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    {city}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedCity("")}
                  className={`shrink-0 px-4 py-2 rounded-full border transition hover:-translate-y-0.5 hover:shadow ${
                    selectedCity === ""
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  All cities
                </button>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">City posts</p>
                <h2 className="text-xl font-semibold">What locals are sharing</h2>
              </div>
              <span className="text-sm text-slate-500">Sorted by latest</span>
            </div>

            {loading ? (
              <p className="text-slate-500">Loading posts�</p>
            ) : filteredByCity.length === 0 ? (
              <p className="text-slate-500">No places found for this state yet.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredByCity.map((post) => {
                  const loc = post?.location;
                  const cityVal = typeof loc === "string" ? loc : loc?.city;
                  const likes = Array.isArray(post?.likes) ? post.likes.length : post?.likes || 0;
                  const image = post?.photo || post?.image || heroImage;
                  return (
                    <article
                      key={post._id}
                      className="group rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative h-48 w-full overflow-hidden">
                        <img src={image} alt={post?.title || "post"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 text-white text-sm font-medium px-3 py-1 rounded-full bg-black/40 backdrop-blur">
                          {cityVal || decodedState}
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">{post?.title || "Untitled"}</h3>
                        <p className="text-sm text-slate-600 overflow-hidden text-ellipsis h-12">{post?.body || post?.description || ""}</p>
                        <div className="flex items-center justify-between text-sm text-slate-500 pt-2">
                          <span>{likes} likes</span>
                          {post?.createdAt && (
                            <span>
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
};

export default StateDetails;
