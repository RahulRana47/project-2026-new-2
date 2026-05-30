import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createBooking, getPostPackages } from "../services/api";
import notificationSound from "../assets/mixkit-kids-cartoon-close-bells-2256.wav";
import "./BookingModal.css";

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const packageContent = {
  Standard: {
    badge: "",
    features: ["Basic tour", "Non-AC transport", "Water bottle", "Local guide"],
  },
  Medium: {
    badge: "\uD83D\uDD25 MOST POPULAR",
    features: ["AC car transport", "1 complimentary meal", "Professional guide", "Water bottles"],
  },
  Premium: {
    badge: "\u2B50 RECOMMENDED",
    features: [
      "Luxury AC car",
      "All meals included",
      "5-star hotel stay",
      "Professional photographer",
      "Airport pickup/drop",
      "24/7 concierge",
    ],
  },
};

const fallbackPackages = [
  { name: "Standard", multiplier: 1 },
  { name: "Medium", multiplier: 1.5 },
  { name: "Premium", multiplier: 3 },
];

const formatCurrency = (value) => {
  if (!Number.isFinite(value)) return "Unavailable";
  return `\u20B9${value.toLocaleString("en-IN")}`;
};

const getInclusiveDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
  return Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
};

const BookingModal = ({ post, isOpen, isTourist, onClose, onBooked }) => {
  const [packages, setPackages] = useState(fallbackPackages);
  const [basePrice, setBasePrice] = useState(Number(post?.price || 0));
  const [selectedPackageName, setSelectedPackageName] = useState("Standard");
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    numberOfPeople: 1,
    specialRequests: "",
  });
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !post?._id) return;

    let active = true;
    setLoadingPackages(true);
    setError("");

    getPostPackages(post._id)
      .then((response) => {
        if (!active) return;
        const nextPackages = Array.isArray(response?.packages) && response.packages.length
          ? response.packages
          : fallbackPackages;
        setPackages(nextPackages);
        setBasePrice(Number(response?.basePrice ?? post?.price ?? 0));
        setSelectedPackageName(nextPackages[0]?.name || "Standard");
      })
      .catch((requestError) => {
        if (!active) return;
        setPackages(fallbackPackages);
        setBasePrice(Number(post?.price || 0));
        setError(requestError?.message || "Unable to load packages.");
      })
      .finally(() => {
        if (active) setLoadingPackages(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, post?._id, post?.price]);

  useEffect(() => {
    if (isOpen) return;
    setShowConfirmation(false);
    setError("");
    setForm({
      startDate: "",
      endDate: "",
      numberOfPeople: 1,
      specialRequests: "",
    });
  }, [isOpen]);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.name === selectedPackageName) || packages[0] || fallbackPackages[0],
    [packages, selectedPackageName]
  );

  const numberOfPeople = Number(form.numberOfPeople || 1);
  const days = useMemo(() => getInclusiveDays(form.startDate, form.endDate), [form.startDate, form.endDate]);
  const totalPrice = useMemo(() => {
    const price = Number(basePrice);
    const multiplier = Number(selectedPackage?.multiplier || 1);
    if (!Number.isFinite(price) || !Number.isFinite(multiplier) || !Number.isFinite(numberOfPeople)) return null;
    return price * multiplier * numberOfPeople * days;
  }, [basePrice, selectedPackage, numberOfPeople, days]);

  const priceBreakdown = `${formatCurrency(Number(basePrice))} x ${selectedPackage?.multiplier || 1}(${selectedPackage?.name || "Standard"}) x ${numberOfPeople || 1}(people) x ${days}(days) = ${formatCurrency(totalPrice)}`;

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "startDate" && current.endDate && current.endDate < value ? { endDate: value } : {}),
    }));
  };

  const validateForm = () => {
    if (!isTourist) {
      return "Only tourist accounts can create bookings.";
    }

    if (!form.startDate || !form.endDate) {
      return "Please choose start and end dates.";
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      return "End date cannot be before start date.";
    }

    if (!Number.isFinite(numberOfPeople) || numberOfPeople < 1 || numberOfPeople > 20) {
      return "Number of people must be between 1 and 20.";
    }

    return "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setShowConfirmation(true);
  };

  const playSuccessSound = () => {
    try {
      const audio = new Audio(notificationSound);
      audio.volume = 0.45;
      audio.play().catch(() => {});
    } catch {
      // Browser audio permissions can block playback until user interaction.
    }
  };

  const confirmBooking = async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await createBooking({
        postId: post._id,
        startDate: form.startDate,
        endDate: form.endDate,
        numberOfPeople,
        selectedPackage: selectedPackage.name,
        specialRequests: form.specialRequests,
      });

      playSuccessSound();
      onBooked?.(response);
      setShowConfirmation(false);
      setForm({
        startDate: "",
        endDate: "",
        numberOfPeople: 1,
        specialRequests: "",
      });
      onClose?.();
    } catch (requestError) {
      setError(requestError?.message || "Unable to send booking request.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="booking-modal" role="dialog" aria-modal="true" aria-label="Book package">
      <div className="booking-panel">
        <div className="booking-panel__header">
          <div>
            <h4>Book this package</h4>
            <p>{post?.title || "Guide experience"}</p>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <form className="booking-modal-form" onSubmit={handleSubmit}>
          {loadingPackages ? <p className="booking-muted">Loading packages...</p> : null}

          <div className="package-card-grid">
            {packages.map((pkg) => {
              const content = packageContent[pkg.name] || { badge: "", features: [] };
              const packageTotal = Number(basePrice) * Number(pkg.multiplier) * numberOfPeople * days;
              return (
                <button
                  key={pkg.name}
                  type="button"
                  className={`package-card ${selectedPackageName === pkg.name ? "is-selected" : ""}`}
                  onClick={() => setSelectedPackageName(pkg.name)}
                >
                  {content.badge ? <span className="package-badge">{content.badge}</span> : null}
                  <span className="package-name">{pkg.name}</span>
                  <strong>{pkg.multiplier}x</strong>
                  <small>{formatCurrency(packageTotal)}</small>
                  <ul>
                    {content.features.map((feature) => (
                      <li key={feature}>{"\u2713"} {feature}</li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <div className="booking-form-grid">
            <label>
              Start date
              <input
                type="date"
                min={todayInputValue()}
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              End date
              <input
                type="date"
                min={form.startDate || todayInputValue()}
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label>
            People
            <input
              type="number"
              min="1"
              max="20"
              name="numberOfPeople"
              value={form.numberOfPeople}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Special requests
            <textarea
              name="specialRequests"
              rows="4"
              maxLength="500"
              value={form.specialRequests}
              onChange={handleChange}
              placeholder="Pickup point, language, food, or timing notes"
            />
          </label>

          <div className="booking-total">
            <span>Total</span>
            <strong>{formatCurrency(totalPrice)}</strong>
            <small>{priceBreakdown}</small>
          </div>

          {error ? <div className="booking-inline-error">{error}</div> : null}

          <button type="submit" className="submit-booking-btn" disabled={submitting || !isTourist}>
            {submitting ? "Sending..." : "Send booking request"}
          </button>
        </form>
      </div>

      {showConfirmation ? (
        <div className="booking-confirmation-modal" role="dialog" aria-modal="true" aria-label="Confirm booking">
          <div className="booking-confirmation-panel">
            <h4>Confirm booking</h4>
            <div className="booking-summary-list">
              <p><span>Package</span><strong>{selectedPackage?.name}</strong></p>
              <p><span>People</span><strong>{numberOfPeople}</strong></p>
              <p><span>Dates</span><strong>{form.startDate} to {form.endDate}</strong></p>
              <p><span>Days</span><strong>{days}</strong></p>
              <p><span>Total</span><strong>{formatCurrency(totalPrice)}</strong></p>
            </div>
            <div className="booking-summary-note">
              <span>Special requests</span>
              <p>{form.specialRequests?.trim() || "None"}</p>
            </div>
            <small className="booking-breakdown">{priceBreakdown}</small>
            {error ? <div className="booking-inline-error">{error}</div> : null}
            <div className="booking-confirmation-actions">
              <button type="button" className="booking-cancel-btn" onClick={() => setShowConfirmation(false)} disabled={submitting}>
                Cancel
              </button>
              <button type="button" className="submit-booking-btn" onClick={confirmBooking} disabled={submitting}>
                {submitting ? <span className="booking-spinner" /> : null}
                {submitting ? "Confirming..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>,
    document.body
  );
};

export default BookingModal;
