import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loadUser } from "../action/authActions";
import DashboardLayout from "../Dashboard/DashboardLayout";
import {
  cancelBooking,
  createReview,
  deleteReview,
  getGuideBookings,
  getMyBookings,
  getMyReviews,
  updateBookingStatus,
  updateReview,
} from "../services/api";
import "./BookingsPage.css";

const GUIDE_STATUS_OPTIONS = ["confirmed", "cancelled", "completed"];

const formatDateTime = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString();
};

const canTouristCancel = (status) => status === "pending" || status === "confirmed";

const BookingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading } = useSelector((state) => state.auth);

  const [bookings, setBookings] = useState([]);
  const [reviewsByBooking, setReviewsByBooking] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [submittingId, setSubmittingId] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!user && !loading) {
      dispatch(loadUser());
    }
  }, [token, user, loading, dispatch, navigate]);

  const role = (user?.role || "").toLowerCase();
  const isGuide = role === "guide";
  const isAdmin = role === "admin";
  const isGuideLike = isGuide || isAdmin;
  const isTourist = role === "tourist";

  const loadDashboard = async () => {
    if (!token || !role) return;

    setPageLoading(true);
    setError("");
    setMessage("");

    try {
      if (isGuideLike) {
        const response = await getGuideBookings();
        setBookings(Array.isArray(response?.bookings) ? response.bookings : []);
        setReviewsByBooking({});
      } else if (isTourist) {
        const [bookingResponse, reviewResponse] = await Promise.all([
          getMyBookings(),
          getMyReviews(),
        ]);

        const nextBookings = Array.isArray(bookingResponse?.bookings) ? bookingResponse.bookings : [];
        const myReviews = Array.isArray(reviewResponse?.reviews) ? reviewResponse.reviews : [];
        const reviewMap = myReviews.reduce((acc, review) => {
          const bookingId = review?.booking;
          if (bookingId) {
            acc[bookingId] = review;
          }
          return acc;
        }, {});

        setBookings(nextBookings);
        setReviewsByBooking(reviewMap);
      } else {
        setBookings([]);
      }
    } catch (requestError) {
      setError(requestError?.message || "Unable to load bookings.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role && token) {
      loadDashboard();
    }
  }, [user?.role, token]);

  useEffect(() => {
    if (!isTourist || !bookings.length) return;

    setReviewDrafts((current) => {
      const next = { ...current };

      bookings.forEach((booking) => {
        const existing = reviewsByBooking[booking._id];
        if (!next[booking._id]) {
          next[booking._id] = {
            rating: existing?.rating || 5,
            comment: existing?.comment || "",
          };
        }
      });

      return next;
    });
  }, [bookings, reviewsByBooking, isTourist]);

  const guideReviewSummary = useMemo(() => {
    if (!isGuideLike || !user?._id) return null;

    return {
      averageRating: user.averageRating || 0,
      totalReviews: user.totalReviews || 0,
    };
  }, [isGuideLike, user]);

  const handleCancelBooking = async (bookingId) => {
    setSubmittingId(bookingId);
    setError("");
    setMessage("");

    try {
      const response = await cancelBooking(bookingId);
      setMessage(response?.message || "Booking cancelled successfully.");
      window.dispatchEvent(new CustomEvent("notification:sync"));
      await loadDashboard();
    } catch (requestError) {
      setError(requestError?.message || "Unable to cancel booking.");
    } finally {
      setSubmittingId("");
    }
  };

  const handleGuideStatus = async (bookingId, status) => {
    setSubmittingId(`${bookingId}:${status}`);
    setError("");
    setMessage("");

    try {
      const response = await updateBookingStatus(bookingId, status);
      setMessage(response?.message || `Booking marked as ${status}.`);
      window.dispatchEvent(new CustomEvent("notification:sync"));
      await loadDashboard();
    } catch (requestError) {
      setError(requestError?.message || "Unable to update booking.");
    } finally {
      setSubmittingId("");
    }
  };

  const handleDraftChange = (bookingId, field, value) => {
    setReviewDrafts((current) => ({
      ...current,
      [bookingId]: {
        ...(current[bookingId] || { rating: 5, comment: "" }),
        [field]: value,
      },
    }));
  };

  const handleSaveReview = async (bookingId) => {
    const draft = reviewDrafts[bookingId];
    const existingReview = reviewsByBooking[bookingId];

    setSubmittingId(`review:${bookingId}`);
    setError("");
    setMessage("");

    try {
      const response = existingReview?._id
        ? await updateReview(existingReview._id, {
            rating: Number(draft?.rating || 5),
            comment: draft?.comment || "",
          })
        : await createReview({
            bookingId,
            rating: Number(draft?.rating || 5),
            comment: draft?.comment || "",
          });

      setMessage(response?.message || "Review saved successfully.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError?.message || "Unable to save review.");
    } finally {
      setSubmittingId("");
    }
  };

  const handleDeleteReview = async (bookingId) => {
    const existingReview = reviewsByBooking[bookingId];
    if (!existingReview?._id) return;

    setSubmittingId(`delete-review:${bookingId}`);
    setError("");
    setMessage("");

    try {
      const response = await deleteReview(existingReview._id);
      setMessage(response?.message || "Review deleted successfully.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError?.message || "Unable to delete review.");
    } finally {
      setSubmittingId("");
    }
  };

  if (token && loading && !user) {
    return (
      <DashboardLayout>
        <div className="bookings-page">
          <p className="muted">Loading your dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bookings-page">
        <div className="bookings-hero">
          <div>
            <p className="bookings-eyebrow">{isGuideLike ? "Guide Bookings" : "My Bookings"}</p>
            <h1>{isGuideLike ? "Manage incoming booking requests" : "Track your trips and reviews"}</h1>
            <p>
              {isGuideLike
                ? "Confirm, complete, or decline tour requests sent to your guide posts."
                : "Check your booking statuses, cancel upcoming trips, and review completed tours."}
            </p>
          </div>

          {guideReviewSummary ? (
            <div className="bookings-summary-card">
              <span>Public rating</span>
              <strong>{guideReviewSummary.averageRating || 0}/5</strong>
              <small>{guideReviewSummary.totalReviews || 0} reviews</small>
            </div>
          ) : null}
        </div>

        {message ? <div className="bookings-banner is-success">{message}</div> : null}
        {error ? <div className="bookings-banner is-error">{error}</div> : null}

        {pageLoading ? <p className="muted">Loading bookings...</p> : null}

        {!pageLoading && !bookings.length ? (
          <div className="bookings-empty">
            <h3>{isGuideLike ? "No requests yet" : "No bookings yet"}</h3>
            <p>
              {isGuideLike
                ? "Once tourists book one of your guide posts, those requests will show up here."
                : "Explore guide profiles and book a trip to start seeing bookings here."}
            </p>
            {!isGuideLike ? (
              <Link to="/dashboard" className="primary-btn">
                Explore Guides
              </Link>
            ) : null}
          </div>
        ) : null}

        {!pageLoading && bookings.length ? (
          <div className="bookings-grid">
            {bookings.map((booking) => {
              const review = reviewsByBooking[booking._id];
              const draft = reviewDrafts[booking._id] || { rating: 5, comment: "" };

              return (
                <article key={booking._id} className="booking-card">
                  <div className="booking-card__header">
                    <div>
                      <h3>{booking?.post?.title || "Tour booking"}</h3>
                      <p className="muted">
                        {isGuideLike
                          ? `Tourist: ${booking?.tourist?.name || "Unknown"}`
                          : `Guide: ${booking?.guide?.name || "Unknown"}`}
                      </p>
                    </div>
                    <span className={`booking-status status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="booking-card__meta">
                    <span>{formatDateTime(booking.tourDate)}</span>
                    <span>{booking.numberOfPeople} people</span>
                    <span>Rs. {booking.totalPrice ?? 0}</span>
                    <span>{booking?.post?.location?.city || booking?.post?.location || "Location pending"}</span>
                  </div>

                  {booking.specialRequests ? (
                    <p className="booking-note">
                      <strong>Special request:</strong> {booking.specialRequests}
                    </p>
                  ) : null}

                  {isGuideLike ? (
                    <div className="booking-actions">
                      {GUIDE_STATUS_OPTIONS.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className="ghost-btn"
                          disabled={booking.status === status || submittingId === `${booking._id}:${status}`}
                          onClick={() => handleGuideStatus(booking._id, status)}
                        >
                          {submittingId === `${booking._id}:${status}` ? "Saving..." : `Mark ${status}`}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {isTourist && canTouristCancel(booking.status) ? (
                    <div className="booking-actions">
                      <button
                        type="button"
                        className="ghost-btn"
                        disabled={submittingId === booking._id}
                        onClick={() => handleCancelBooking(booking._id)}
                      >
                        {submittingId === booking._id ? "Cancelling..." : "Cancel booking"}
                      </button>
                    </div>
                  ) : null}

                  {isTourist && booking.status === "completed" ? (
                    <div className="review-box">
                      <div className="review-box__title">
                        <h4>{review ? "Update your review" : "Review this trip"}</h4>
                        {review?.createdAt ? (
                          <small>Saved on {new Date(review.createdAt).toLocaleDateString()}</small>
                        ) : null}
                      </div>

                      <div className="review-form-grid">
                        <label>
                          Rating
                          <select
                            value={draft.rating}
                            onChange={(event) =>
                              handleDraftChange(booking._id, "rating", event.target.value)
                            }
                          >
                            <option value="5">5</option>
                            <option value="4">4</option>
                            <option value="3">3</option>
                            <option value="2">2</option>
                            <option value="1">1</option>
                          </select>
                        </label>

                        <label className="review-form-grid__full">
                          Comment
                          <textarea
                            rows="4"
                            maxLength="500"
                            value={draft.comment}
                            onChange={(event) =>
                              handleDraftChange(booking._id, "comment", event.target.value)
                            }
                            placeholder="Share how the tour went..."
                          />
                        </label>
                      </div>

                      <div className="booking-actions">
                        <button
                          type="button"
                          className="primary-btn"
                          disabled={submittingId === `review:${booking._id}`}
                          onClick={() => handleSaveReview(booking._id)}
                        >
                          {submittingId === `review:${booking._id}`
                            ? "Saving..."
                            : review
                            ? "Update review"
                            : "Submit review"}
                        </button>

                        {review?._id ? (
                          <button
                            type="button"
                            className="ghost-btn"
                            disabled={submittingId === `delete-review:${booking._id}`}
                            onClick={() => handleDeleteReview(booking._id)}
                          >
                            {submittingId === `delete-review:${booking._id}` ? "Deleting..." : "Delete review"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default BookingsPage;
