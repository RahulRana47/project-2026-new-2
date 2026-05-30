import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loadUser } from "../action/authActions";
import DashboardLayout from "../Dashboard/DashboardLayout";
import {
  blockGuideAvailability,
  cancelBooking,
  createReview,
  deleteGuideAvailability,
  deleteReview,
  getGuideAvailability,
  getGuideBookings,
  getMyBookings,
  getMyReviews,
  requestBookingStatusOtp,
  updateBookingStatus,
  updateReview,
} from "../services/api";
import "./BookingsPage.css";

const GUIDE_STATUS_OPTIONS = ["confirmed", "cancelled", "completed"];
const CANCELLATION_REASONS = [
  "Guide is unavailable",
  "Weather or safety issue",
  "Tour details need changes",
  "Other",
];

const formatDate = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString();
};

const formatDateRange = (booking) => {
  const start = booking.startDate || booking.tourDate;
  const end = booking.endDate || booking.tourDate;
  if (!end || formatDate(start) === formatDate(end)) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);
const addDaysInputValue = (dateValue, days) => {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
  const [otpModal, setOtpModal] = useState({
    open: false,
    bookingId: "",
    touristName: "",
    otp: "",
    message: "",
    error: "",
  });
  const [cancelModal, setCancelModal] = useState({
    open: false,
    bookingId: "",
    touristName: "",
    reason: CANCELLATION_REASONS[0],
    details: "",
    error: "",
  });
  const [availability, setAvailability] = useState({ blockedRanges: [], bookings: [] });
  const [availabilityForm, setAvailabilityForm] = useState({
    startDate: todayInputValue(),
    endDate: todayInputValue(),
    reason: "",
  });

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

  const loadAvailability = async () => {
    if (!isGuideLike || !user?._id) return;

    const from = todayInputValue();
    const to = addDaysInputValue(from, 90);
    const response = await getGuideAvailability(user._id, { from, to });
    setAvailability(response?.availability || { blockedRanges: [], bookings: [] });
  };

  useEffect(() => {
    if (isGuideLike && user?._id) {
      loadAvailability().catch((requestError) => {
        setError(requestError?.message || "Unable to load guide availability.");
      });
    }
  }, [isGuideLike, user?._id]);

  const handleAvailabilityChange = (event) => {
    const { name, value } = event.target;
    setAvailabilityForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "startDate" && current.endDate < value ? { endDate: value } : {}),
    }));
  };

  const handleBlockDates = async (event) => {
    event.preventDefault();

    if (new Date(availabilityForm.endDate) < new Date(availabilityForm.startDate)) {
      setError("End date cannot be before start date.");
      setMessage("");
      return;
    }

    setSubmittingId("availability:block");
    setError("");
    setMessage("");

    try {
      const response = await blockGuideAvailability(availabilityForm);
      setMessage(response?.message || "Dates blocked successfully.");
      setAvailabilityForm({
        startDate: todayInputValue(),
        endDate: todayInputValue(),
        reason: "",
      });
      await loadAvailability();
    } catch (requestError) {
      setError(requestError?.message || "Unable to block dates.");
    } finally {
      setSubmittingId("");
    }
  };

  const handleDeleteAvailability = async (availabilityId) => {
    setSubmittingId(`availability:${availabilityId}`);
    setError("");
    setMessage("");

    try {
      const response = await deleteGuideAvailability(availabilityId);
      setMessage(response?.message || "Blocked dates removed.");
      await loadAvailability();
    } catch (requestError) {
      setError(requestError?.message || "Unable to remove blocked dates.");
    } finally {
      setSubmittingId("");
    }
  };

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

  const openConfirmationOtp = async (booking) => {
    setSubmittingId(`${booking._id}:confirmed`);
    setError("");
    setMessage("");

    try {
      const response = await requestBookingStatusOtp(booking._id, "confirmed");
      setOtpModal({
        open: true,
        bookingId: booking._id,
        touristName: booking?.tourist?.name || "tourist",
        otp: "",
        message: response?.message || "OTP sent to tourist email.",
        error: "",
      });
    } catch (requestError) {
      setError(requestError?.message || "Unable to send OTP to tourist.");
    } finally {
      setSubmittingId("");
    }
  };

  const handleOtpChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 4);
    setOtpModal((current) => ({ ...current, otp: digitsOnly, error: "" }));
  };

  const closeOtpModal = () => {
    if (submittingId.startsWith("otp:")) return;
    setOtpModal({
      open: false,
      bookingId: "",
      touristName: "",
      otp: "",
      message: "",
      error: "",
    });
  };

  const confirmWithOtp = async () => {
    if (!/^\d{4}$/.test(otpModal.otp)) {
      setOtpModal((current) => ({ ...current, error: "Enter the exact 4-digit OTP." }));
      return;
    }

    setSubmittingId(`otp:${otpModal.bookingId}`);
    setError("");
    setMessage("");

    try {
      const response = await updateBookingStatus(otpModal.bookingId, "confirmed", otpModal.otp);
      setMessage(response?.message || "Booking confirmed after tourist OTP verification.");
      setOtpModal({
        open: false,
        bookingId: "",
        touristName: "",
        otp: "",
        message: "",
        error: "",
      });
      window.dispatchEvent(new CustomEvent("notification:sync"));
      await loadDashboard();
      await loadAvailability();
    } catch (requestError) {
      setOtpModal((current) => ({
        ...current,
        error: requestError?.message || "OTP verification failed.",
      }));
    } finally {
      setSubmittingId("");
    }
  };

  const handleGuideStatus = async (booking, status) => {
    if (status === "confirmed") {
      await openConfirmationOtp(booking);
      return;
    }

    if (status === "cancelled") {
      setCancelModal({
        open: true,
        bookingId: booking._id,
        touristName: booking?.tourist?.name || "tourist",
        reason: CANCELLATION_REASONS[0],
        details: "",
        error: "",
      });
      return;
    }

    const bookingId = booking._id;
    setSubmittingId(`${bookingId}:${status}`);
    setError("");
    setMessage("");

    try {
      const response = await updateBookingStatus(bookingId, status);
      setMessage(response?.message || `Booking marked as ${status}.`);
      window.dispatchEvent(new CustomEvent("notification:sync"));
      await loadDashboard();
      await loadAvailability();
    } catch (requestError) {
      setError(requestError?.message || "Unable to update booking.");
    } finally {
      setSubmittingId("");
    }
  };

  const closeCancelModal = () => {
    if (submittingId.startsWith("cancel-reason:")) return;
    setCancelModal({
      open: false,
      bookingId: "",
      touristName: "",
      reason: CANCELLATION_REASONS[0],
      details: "",
      error: "",
    });
  };

  const submitGuideCancellation = async () => {
    const selectedReason = cancelModal.reason === "Other"
      ? cancelModal.details.trim()
      : cancelModal.details.trim()
      ? `${cancelModal.reason}: ${cancelModal.details.trim()}`
      : cancelModal.reason;

    if (!selectedReason) {
      setCancelModal((current) => ({ ...current, error: "Please choose or enter a cancellation reason." }));
      return;
    }

    setSubmittingId(`cancel-reason:${cancelModal.bookingId}`);
    setError("");
    setMessage("");

    try {
      const response = await updateBookingStatus(cancelModal.bookingId, "cancelled", undefined, selectedReason);
      setMessage(response?.message || "Booking cancelled and tourist email sent.");
      setCancelModal({
        open: false,
        bookingId: "",
        touristName: "",
        reason: CANCELLATION_REASONS[0],
        details: "",
        error: "",
      });
      window.dispatchEvent(new CustomEvent("notification:sync"));
      await loadDashboard();
      await loadAvailability();
    } catch (requestError) {
      setCancelModal((current) => ({
        ...current,
        error: requestError?.message || "Unable to cancel booking.",
      }));
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

        {isGuideLike ? (
          <section className="availability-manager">
            <div className="availability-manager__header">
              <div>
                <h2>Availability calendar</h2>
                <p>Block days you cannot guide. Pending and confirmed bookings are held automatically.</p>
              </div>
              <span>{availability.blockedRanges?.length || 0} blocked ranges</span>
            </div>

            <form className="availability-form" onSubmit={handleBlockDates}>
              <label>
                Start
                <input
                  type="date"
                  min={todayInputValue()}
                  name="startDate"
                  value={availabilityForm.startDate}
                  onChange={handleAvailabilityChange}
                  required
                />
              </label>
              <label>
                End
                <input
                  type="date"
                  min={availabilityForm.startDate || todayInputValue()}
                  name="endDate"
                  value={availabilityForm.endDate}
                  onChange={handleAvailabilityChange}
                  required
                />
              </label>
              <label>
                Reason
                <input
                  name="reason"
                  maxLength="200"
                  value={availabilityForm.reason}
                  onChange={handleAvailabilityChange}
                  placeholder="Personal leave, already traveling..."
                />
              </label>
              <button type="submit" className="primary-btn" disabled={submittingId === "availability:block"}>
                {submittingId === "availability:block" ? "Blocking..." : "Block dates"}
              </button>
            </form>

            <div className="availability-lists">
              <div>
                <h3>Blocked by you</h3>
                {availability.blockedRanges?.length ? (
                  availability.blockedRanges.map((range) => (
                    <div key={range._id} className="availability-row">
                      <span>{formatDate(range.startDate)} - {formatDate(range.endDate)}</span>
                      <small>{range.reason || "Unavailable"}</small>
                      <button
                        type="button"
                        className="ghost-btn"
                        disabled={submittingId === `availability:${range._id}`}
                        onClick={() => handleDeleteAvailability(range._id)}
                      >
                        {submittingId === `availability:${range._id}` ? "Removing..." : "Unblock"}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="muted">No manually blocked dates.</p>
                )}
              </div>

              <div>
                <h3>Held by bookings</h3>
                {availability.bookings?.length ? (
                  availability.bookings.map((booking) => (
                    <div key={booking._id} className="availability-row is-booking">
                      <span>{formatDateRange(booking)}</span>
                      <small>{booking?.post?.title || booking.status}</small>
                    </div>
                  ))
                ) : (
                  <p className="muted">No pending or confirmed booking holds.</p>
                )}
              </div>
            </div>
          </section>
        ) : null}

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
                    <span>{formatDateRange(booking)}</span>
                    <span>{booking.durationDays || 1} day{(booking.durationDays || 1) === 1 ? "" : "s"}</span>
                    <span>{booking.numberOfPeople} people</span>
                    <span>{booking.selectedPackage?.name || "Standard"} package</span>
                    <span>Rs. {booking.totalPrice ?? 0}</span>
                    <span>{booking?.post?.location?.city || booking?.post?.location || "Location pending"}</span>
                  </div>

                  {booking.specialRequests ? (
                    <p className="booking-note">
                      <strong>Special request:</strong> {booking.specialRequests}
                    </p>
                  ) : null}

                  {booking.cancellationReason ? (
                    <p className="booking-note">
                      <strong>Cancellation reason:</strong> {booking.cancellationReason}
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
                          onClick={() => handleGuideStatus(booking, status)}
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

        {otpModal.open ? (
          <div className="booking-otp-modal" role="dialog" aria-modal="true" aria-label="Tourist confirmation OTP">
            <div className="booking-otp-panel">
              <div>
                <p className="bookings-eyebrow">Tourist approval</p>
                <h3>Enter 4-digit OTP</h3>
                <p className="muted">
                  We sent an OTP to {otpModal.touristName}. Confirm this trip only after the tourist shares the code.
                </p>
              </div>

              {otpModal.message ? <div className="bookings-banner is-success">{otpModal.message}</div> : null}
              {otpModal.error ? <div className="bookings-banner is-error">{otpModal.error}</div> : null}

              <input
                className="booking-otp-input"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength="4"
                value={otpModal.otp}
                onChange={handleOtpChange}
                placeholder="0000"
                autoFocus
              />

              <div className="booking-actions">
                <button type="button" className="ghost-btn" onClick={closeOtpModal} disabled={submittingId.startsWith("otp:")}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={confirmWithOtp}
                  disabled={submittingId === `otp:${otpModal.bookingId}` || otpModal.otp.length !== 4}
                >
                  {submittingId === `otp:${otpModal.bookingId}` ? "Verifying..." : "Confirm trip"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {cancelModal.open ? (
          <div className="booking-otp-modal" role="dialog" aria-modal="true" aria-label="Cancel booking reason">
            <div className="booking-otp-panel">
              <div>
                <p className="bookings-eyebrow">Cancellation reason</p>
                <h3>Why cancel this trip?</h3>
                <p className="muted">
                  This reason will be emailed to {cancelModal.touristName}.
                </p>
              </div>

              {cancelModal.error ? <div className="bookings-banner is-error">{cancelModal.error}</div> : null}

              <label className="booking-reason-label">
                Reason
                <select
                  value={cancelModal.reason}
                  onChange={(event) =>
                    setCancelModal((current) => ({ ...current, reason: event.target.value, error: "" }))
                  }
                >
                  {CANCELLATION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </label>

              <label className="booking-reason-label">
                Details
                <textarea
                  rows="4"
                  maxLength="300"
                  value={cancelModal.details}
                  onChange={(event) =>
                    setCancelModal((current) => ({ ...current, details: event.target.value, error: "" }))
                  }
                  placeholder={cancelModal.reason === "Other" ? "Enter the reason" : "Optional note for tourist"}
                />
              </label>

              <div className="booking-actions">
                <button type="button" className="ghost-btn" onClick={closeCancelModal} disabled={submittingId.startsWith("cancel-reason:")}>
                  Back
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={submitGuideCancellation}
                  disabled={submittingId === `cancel-reason:${cancelModal.bookingId}`}
                >
                  {submittingId === `cancel-reason:${cancelModal.bookingId}` ? "Cancelling..." : "Cancel booking"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default BookingsPage;
