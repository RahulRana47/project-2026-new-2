import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../Dashboard/Navbar";
import { loadUser } from "../action/authActions";
import {
  createBooking,
  getGuideReviews,
  getGuideReviewStats,
  getGuides,
  getPosts,
} from "../services/api";
import "./GuideProfile.css";

const getGuideSlug = (guide) =>
  encodeURIComponent(guide?._id || guide?.name || "guide");

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const resolveGuideMatch = (guides, guideId, fallbackGuide) => {
  const decodedId = decodeURIComponent(guideId || "");
  const normalizedDecodedId = normalizeText(decodedId);
  const fallbackId = String(fallbackGuide?._id || "");
  const fallbackEmail = normalizeText(fallbackGuide?.email);
  const fallbackName = normalizeText(fallbackGuide?.name);

  return (
    guides.find((g) => getGuideSlug(g) === encodeURIComponent(decodedId)) ||
    guides.find((g) => String(g?._id || "") === decodedId) ||
    guides.find((g) => String(g?.user?._id || g?.userId || "") === decodedId) ||
    guides.find((g) => normalizeText(g?.name) === normalizedDecodedId) ||
    guides.find((g) => fallbackId && String(g?._id || "") === fallbackId) ||
    guides.find((g) => fallbackId && String(g?.user?._id || g?.userId || "") === fallbackId) ||
    guides.find((g) => fallbackEmail && normalizeText(g?.email) === fallbackEmail) ||
    guides.find((g) => fallbackName && normalizeText(g?.name) === fallbackName) ||
    null
  );
};

const GuideProfile = () => {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const fallbackGuide = location.state?.fallbackGuide || null;
  const { user, token, loading: authLoading } = useSelector((state) => state.auth);

  const [guide, setGuide] = useState(null);
  const [guidePosts, setGuidePosts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    postId: "",
    tourDate: "",
    numberOfPeople: 1,
    specialRequests: "",
  });

  useEffect(() => {
    if (token && !user && !authLoading) {
      dispatch(loadUser());
    }
  }, [token, user, authLoading, dispatch]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      try {
        const [guidesResponse, postsResponse] = await Promise.all([
          getGuides(),
          getPosts(1, 200),
        ]);

        const list = Array.isArray(guidesResponse?.guides)
          ? guidesResponse.guides
          : Array.isArray(guidesResponse)
          ? guidesResponse
          : [];

        const match = resolveGuideMatch(list, guideId, fallbackGuide);

        const resolvedGuide = match || fallbackGuide || null;

        console.debug("[GuideProfile] Guide resolution", {
          routeGuideId: guideId,
          decodedGuideId: decodeURIComponent(guideId || ""),
          fallbackGuide,
          guidesLoaded: list.length,
          matchedGuide: match,
          resolvedGuide,
          locationState: location.state || null,
        });

        if (!mounted) return;

        setGuide(resolvedGuide);

        const allPosts = Array.isArray(postsResponse?.posts) ? postsResponse.posts : [];
        const nextGuidePosts = resolvedGuide?._id
          ? allPosts.filter((post) => {
              const ownerId = post?.postedBy?._id || post?.postedBy;
              return ownerId === resolvedGuide._id;
            })
          : [];

        setGuidePosts(nextGuidePosts);
        setBookingForm((current) => ({
          ...current,
          postId: nextGuidePosts[0]?._id || "",
        }));

        if (resolvedGuide?._id) {
          const [reviewsResponse, statsResponse] = await Promise.all([
            getGuideReviews(resolvedGuide._id),
            getGuideReviewStats(resolvedGuide._id),
          ]);

          if (!mounted) return;

          setReviews(Array.isArray(reviewsResponse?.reviews) ? reviewsResponse.reviews : []);
          setReviewStats(statsResponse || null);
        } else {
          setReviews([]);
          setReviewStats(null);
        }
      } catch (err) {
        console.error("Failed to fetch guide profile", err);
        console.debug("[GuideProfile] Falling back after fetch failure", {
          routeGuideId: guideId,
          fallbackGuide,
          locationState: location.state || null,
        });
        if (mounted) {
          setGuide(fallbackGuide || null);
          setGuidePosts([]);
          setReviews([]);
          setReviewStats(null);
        }
      }

      if (mounted) setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [guideId, fallbackGuide, location.state]);

  const role = (user?.role || "").toLowerCase();
  const isTourist = role === "tourist";
  const canMessageGuide = Boolean(token && guide?._id && guide._id !== user?._id);

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

  const selectedPost = useMemo(
    () => guidePosts.find((post) => post._id === bookingForm.postId) || guidePosts[0] || null,
    [guidePosts, bookingForm.postId]
  );

  const selectedPostPrice = useMemo(() => {
    const price = Number(selectedPost?.price);
    return Number.isFinite(price) ? price : null;
  }, [selectedPost]);

  const reviewDistribution = useMemo(() => {
    const distribution = reviewStats?.ratingDistribution || {};
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: distribution[rating] || 0,
    }));
  }, [reviewStats]);

  const handleBookingChange = (event) => {
    const { name, value } = event.target;
    setBookingForm((current) => ({ ...current, [name]: value }));
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!bookingForm.postId) {
      setBookingError("Please select a guide trip before booking.");
      setBookingMessage("");
      return;
    }

    if (!bookingForm.tourDate) {
      setBookingError("Please choose a tour date.");
      setBookingMessage("");
      return;
    }

    const normalizedPeople = Number(bookingForm.numberOfPeople);
    if (!Number.isFinite(normalizedPeople) || normalizedPeople < 1 || normalizedPeople > 20) {
      setBookingError("Number of people must be between 1 and 20.");
      setBookingMessage("");
      return;
    }

    if (selectedPostPrice === null) {
      setBookingError("This guide post has no valid price yet, so it cannot be booked.");
      setBookingMessage("");
      return;
    }

    setBookingSubmitting(true);
    setBookingError("");
    setBookingMessage("");

    try {
      const response = await createBooking({
        postId: bookingForm.postId,
        tourDate: new Date(bookingForm.tourDate).toISOString(),
        numberOfPeople: normalizedPeople,
        specialRequests: bookingForm.specialRequests,
      });

      setBookingMessage(response?.message || "Booking request sent successfully.");
      setBookingForm((current) => ({
        ...current,
        tourDate: "",
        numberOfPeople: 1,
        specialRequests: "",
      }));
    } catch (error) {
      setBookingError(error?.message || "Unable to send booking request.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleMessageGuide = () => {
    if (!guide?._id) return;

    if (!token) {
      navigate("/login");
      return;
    }

    navigate("/dashboard/messages", {
      state: {
        prefillGuideId: guide._id,
      },
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="guide-profile page">
          <p className="muted">Loading guide profile...</p>
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
              {guide.languages?.length ? (
                <span className="pill">Languages: {guide.languages.join(", ")}</span>
              ) : null}
              {guide.experience ? <span className="pill">{guide.experience} yrs experience</span> : null}
              <span className="pill">
                {selectedPostPrice !== null ? `Rs. ${selectedPostPrice} / person` : "Pricing unavailable"}
              </span>
              <span className="pill">
                Rating: {reviewStats?.averageRating || guide.averageRating || 0}/5
              </span>
            </div>
            <div className="cta-row">
              <a className="primary-btn" href={guide.phone ? `tel:${guide.phone}` : `mailto:${guide.email || ""}`}>
                Contact guide
              </a>
              {canMessageGuide ? (
                <button className="primary-btn guide-chat-btn" type="button" onClick={handleMessageGuide}>
                  Message guide
                </button>
              ) : null}
              <button className="ghost-btn" onClick={() => navigate(-1)}>
                Back
              </button>
              {token ? (
                <button className="ghost-btn" onClick={() => navigate("/dashboard/bookings")}>
                  Open bookings
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="guide-body">
          <section className="guide-panel">
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
              <h4>Rating</h4>
              <p>
                {reviewStats?.averageRating || guide.averageRating || 0}/5 from{" "}
                {reviewStats?.totalReviews || guide.totalReviews || 0} reviews
              </p>
            </div>
            <div>
              <h4>Contact</h4>
              <p>{guide.email || guide.phone || "Available on request"}</p>
            </div>
          </section>

          <section className="guide-panel">
            <div className="section-heading">
              <div>
                <h3>Available experiences</h3>
                <p className="muted">Choose a guide post to create your booking request.</p>
              </div>
              {guidePosts.length ? <span className="guide-count">{guidePosts.length} trips</span> : null}
            </div>

            {guidePosts.length ? (
              <div className="guide-post-grid">
                {guidePosts.map((post) => (
                  <button
                    key={post._id}
                    type="button"
                    className={`guide-post-card ${bookingForm.postId === post._id ? "is-active" : ""}`}
                    onClick={() => setBookingForm((current) => ({ ...current, postId: post._id }))}
                  >
                    <img src={post.photo || "/default_profile.jpg"} alt={post.title || "guide post"} />
                    <div>
                      <h4>{post.title}</h4>
                      <p>{post.body || "No description available."}</p>
                      <span>Rs. {post.price ?? 0} per person</span>
                      {Number.isFinite(Number(post.price)) ? null : (
                        <small className="guide-post-warning">Update required before booking</small>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">This guide has not published any bookable posts yet.</p>
            )}
          </section>

          <section className="guide-split">
            <div className="guide-panel">
              <div className="section-heading">
                <div>
                  <h3>Book this guide</h3>
                  <p className="muted">Tourists can send a request directly to the selected guide post.</p>
                </div>
              </div>

              {!token ? (
                <div className="notice-box">
                  <p>Login as a tourist account to book this guide.</p>
                  <Link to="/login" className="primary-btn">
                    Login to book
                  </Link>
                </div>
              ) : !isTourist ? (
                <div className="notice-box">
                  <p>Only tourist accounts can create bookings.</p>
                </div>
              ) : !guidePosts.length ? (
                <div className="notice-box">
                  <p>No trip post is available for booking yet.</p>
                </div>
              ) : (
                <form className="booking-form" onSubmit={handleBookingSubmit}>
                  <label>
                    Selected trip
                    <select name="postId" value={bookingForm.postId} onChange={handleBookingChange} required>
                      {guidePosts.map((post) => (
                        <option key={post._id} value={post._id}>
                          {post.title} - {Number.isFinite(Number(post.price)) ? `Rs. ${post.price}` : "Price unavailable"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="booking-form__row">
                    <label>
                      Tour date
                      <input
                        type="datetime-local"
                        name="tourDate"
                        value={bookingForm.tourDate}
                        onChange={handleBookingChange}
                        required
                      />
                    </label>

                    <label>
                      People
                      <input
                        type="number"
                        min="1"
                        max="20"
                        name="numberOfPeople"
                        value={bookingForm.numberOfPeople}
                        onChange={handleBookingChange}
                        required
                      />
                    </label>
                  </div>

                  <label>
                    Special requests
                    <textarea
                      name="specialRequests"
                      rows="4"
                      maxLength="500"
                      value={bookingForm.specialRequests}
                      onChange={handleBookingChange}
                      placeholder="Food preferences, language requests, or tour notes"
                    />
                  </label>

                  {selectedPost ? (
                    <div className="booking-summary">
                      <span>Estimated total</span>
                      <strong>
                        {selectedPostPrice !== null
                          ? `Rs. ${selectedPostPrice * Number(bookingForm.numberOfPeople || 1)}`
                          : "Unavailable"}
                      </strong>
                    </div>
                  ) : null}

                  {bookingMessage ? <div className="inline-message is-success">{bookingMessage}</div> : null}
                  {bookingError ? <div className="inline-message is-error">{bookingError}</div> : null}

                  <button type="submit" className="primary-btn" disabled={bookingSubmitting}>
                    {bookingSubmitting ? "Sending..." : "Send booking request"}
                  </button>
                </form>
              )}
            </div>

            <div className="guide-panel">
              <div className="section-heading">
                <div>
                  <h3>Reviews</h3>
                  <p className="muted">Recent tourist feedback from completed bookings.</p>
                </div>
              </div>

              <div className="review-stats-card">
                <div>
                  <strong>{reviewStats?.averageRating || guide.averageRating || 0}/5</strong>
                  <span>{reviewStats?.totalReviews || guide.totalReviews || 0} total reviews</span>
                </div>
                <div className="review-bars">
                  {reviewDistribution.map((item) => (
                    <div key={item.rating} className="review-bar-row">
                      <span>{item.rating} star</span>
                      <div className="review-bar-track">
                        <div
                          className="review-bar-fill"
                          style={{
                            width: `${
                              (item.count / Math.max(reviewStats?.totalReviews || 1, 1)) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {reviews.length ? (
                <div className="review-list">
                  {reviews.map((review) => (
                    <article key={review._id} className="review-card">
                      <div className="review-card__header">
                        <div>
                          <h4>{review?.tourist?.name || "Traveler"}</h4>
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="review-score">{review.rating}/5</span>
                      </div>
                      <p>{review.comment}</p>
                      <small>{review?.post?.title || "Guided experience"}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">No reviews yet for this guide.</p>
              )}
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
