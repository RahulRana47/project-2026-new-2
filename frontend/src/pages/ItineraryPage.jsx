import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import DashboardLayout from "../Dashboard/DashboardLayout";
import {
  createItinerary,
  deleteItinerary,
  exportItineraryPDF,
  getItinerary,
  getMyItineraries,
  removeItineraryActivity,
  shareItinerary,
  updateItineraryActivity,
} from "../services/api";
import "./ItineraryPage.css";

const today = new Date().toISOString().slice(0, 10);

const formatDate = (value) => {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const normalizeDestination = (destination = {}) => {
  if (typeof destination === "string") return destination;
  return [destination.city, destination.state].filter(Boolean).join(", ") || "Destination not set";
};

const sortActivities = (activities = []) => {
  return [...activities].sort((a, b) => {
    if (Number(a.day || 1) !== Number(b.day || 1)) return Number(a.day || 1) - Number(b.day || 1);
    return Number(a.order || 0) - Number(b.order || 0);
  });
};

const ItineraryPage = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const [itineraries, setItineraries] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [editingActivityId, setEditingActivityId] = useState("");
  const [editForm, setEditForm] = useState({ day: 1, time: "10:00 AM", notes: "" });
  const [createForm, setCreateForm] = useState({
    title: "My Trip Plan",
    city: "",
    state: "",
    startDate: today,
    endDate: today,
  });

  const isTourist = String(user?.role || "").toLowerCase() === "tourist";

  const selectedActivities = useMemo(
    () => sortActivities(selected?.activities || []),
    [selected?.activities]
  );

  const groupedActivities = useMemo(() => {
    return selectedActivities.reduce((groups, activity) => {
      const day = activity.day || 1;
      if (!groups[day]) groups[day] = [];
      groups[day].push(activity);
      return groups;
    }, {});
  }, [selectedActivities]);

  const loadItineraries = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getMyItineraries();
      const nextItineraries = Array.isArray(data?.itineraries) ? data.itineraries : [];
      setItineraries(nextItineraries);
      const stillExists = nextItineraries.some((itinerary) => itinerary._id === selectedId);
      const nextSelectedId = stillExists ? selectedId : nextItineraries[0]?._id || "";
      setSelectedId(nextSelectedId);
    } catch (requestError) {
      setError(requestError?.message || "Unable to load itineraries.");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedItinerary = async (itineraryId) => {
    if (!itineraryId) {
      setSelected(null);
      return;
    }

    setDetailLoading(true);
    setError("");

    try {
      const data = await getItinerary(itineraryId);
      setSelected(data?.itinerary || null);
      setShareUrl("");
    } catch (requestError) {
      setError(requestError?.message || "Unable to load itinerary details.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadItineraries();
  }, [token]);

  useEffect(() => {
    loadSelectedItinerary(selectedId);
  }, [selectedId]);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!isTourist) {
      setError("Only tourist accounts can manage itineraries.");
      return;
    }

    setMessage("");
    setError("");

    try {
      const data = await createItinerary({
        title: createForm.title,
        destination: {
          city: createForm.city,
          state: createForm.state,
        },
        startDate: createForm.startDate,
        endDate: createForm.endDate,
      });
      setMessage(data?.message || "Itinerary created.");
      setCreateForm((current) => ({ ...current, title: "My Trip Plan" }));
      await loadItineraries();
      if (data?.itinerary?._id) setSelectedId(data.itinerary._id);
    } catch (requestError) {
      setError(requestError?.message || "Unable to create itinerary.");
    }
  };

  const startEdit = (activity) => {
    setEditingActivityId(activity._id);
    setEditForm({
      day: activity.day || 1,
      time: activity.time || "10:00 AM",
      notes: activity.notes || "",
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleSaveActivity = async (activityId) => {
    setMessage("");
    setError("");

    try {
      await updateItineraryActivity(selectedId, activityId, {
        day: Number(editForm.day),
        time: editForm.time,
        notes: editForm.notes,
      });
      setEditingActivityId("");
      setMessage("Activity updated.");
      await loadSelectedItinerary(selectedId);
    } catch (requestError) {
      setError(requestError?.message || "Unable to update activity.");
    }
  };

  const handleRemoveActivity = async (activityId) => {
    const confirmed = window.confirm("Remove this activity from your itinerary?");
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await removeItineraryActivity(selectedId, activityId);
      setMessage("Activity removed.");
      await loadSelectedItinerary(selectedId);
      await loadItineraries();
    } catch (requestError) {
      setError(requestError?.message || "Unable to remove activity.");
    }
  };

  const handleDeleteItinerary = async () => {
    if (!selectedId) return;
    const confirmed = window.confirm("Delete this itinerary permanently?");
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await deleteItinerary(selectedId);
      setSelectedId("");
      setSelected(null);
      setMessage("Itinerary deleted.");
      await loadItineraries();
    } catch (requestError) {
      setError(requestError?.message || "Unable to delete itinerary.");
    }
  };

  const handleShare = async () => {
    if (!selectedId) return;
    setMessage("");
    setError("");

    try {
      const data = await shareItinerary(selectedId);
      const publicUrl = data?.shareCode
        ? `${window.location.origin}/itinerary/shared/${data.shareCode}`
        : data?.shareableLink;
      setShareUrl(publicUrl);
      if (publicUrl) {
        await navigator.clipboard?.writeText(publicUrl).catch(() => {});
      }
      setMessage("Share link ready.");
    } catch (requestError) {
      setError(requestError?.message || "Unable to share itinerary.");
    }
  };

  const handleExport = async () => {
    if (!selectedId) return;
    setMessage("");
    setError("");

    try {
      const blob = await exportItineraryPDF(selectedId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(selected?.title || "itinerary").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError?.message || "Unable to export PDF.");
    }
  };

  if (!token) {
    return (
      <DashboardLayout>
        <main className="itinerary-page">
          <section className="itinerary-empty-state">
            <h1>My Itineraries</h1>
            <p>Login with a tourist account to create trip plans and save guide posts.</p>
            <Link to="/login">Login</Link>
          </section>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="itinerary-page">
        <section className="itinerary-toolbar">
          <div>
            <h1>My Itineraries</h1>
            <p>Plan days, save posts, share trips, and export PDFs.</p>
          </div>
          <Link to="/dashboard">Browse posts</Link>
        </section>

        {!isTourist ? (
          <div className="itinerary-alert itinerary-alert--error">
            Only tourist accounts can create and manage itineraries.
          </div>
        ) : null}

        {error ? <div className="itinerary-alert itinerary-alert--error">{error}</div> : null}
        {message ? <div className="itinerary-alert itinerary-alert--success">{message}</div> : null}

        <div className="itinerary-shell">
          <aside className="itinerary-sidebar">
            <form className="itinerary-form" onSubmit={handleCreate}>
              <h2>Create Trip</h2>
              <label>
                Title
                <input name="title" value={createForm.title} onChange={handleCreateChange} required />
              </label>
              <div className="itinerary-two-col">
                <label>
                  City
                  <input name="city" value={createForm.city} onChange={handleCreateChange} />
                </label>
                <label>
                  State
                  <input name="state" value={createForm.state} onChange={handleCreateChange} />
                </label>
              </div>
              <div className="itinerary-two-col">
                <label>
                  Start
                  <input type="date" name="startDate" value={createForm.startDate} onChange={handleCreateChange} required />
                </label>
                <label>
                  End
                  <input type="date" name="endDate" value={createForm.endDate} onChange={handleCreateChange} required />
                </label>
              </div>
              <button type="submit" disabled={!isTourist}>Create itinerary</button>
            </form>

            <div className="itinerary-list">
              <h2>Your Trips</h2>
              {loading ? <p className="muted">Loading itineraries...</p> : null}
              {!loading && !itineraries.length ? <p className="muted">No itineraries yet.</p> : null}
              {itineraries.map((itinerary) => (
                <button
                  type="button"
                  key={itinerary._id}
                  className={itinerary._id === selectedId ? "is-active" : ""}
                  onClick={() => setSelectedId(itinerary._id)}
                >
                  <strong>{itinerary.title}</strong>
                  <span>{normalizeDestination(itinerary.destination)}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="itinerary-detail">
            {!selected && !detailLoading ? (
              <div className="itinerary-empty-state">
                <h2>Select or create an itinerary</h2>
                <p>After creating a trip, use the Add to itinerary button on posts.</p>
              </div>
            ) : null}

            {detailLoading ? <p className="muted">Loading itinerary details...</p> : null}

            {selected ? (
              <>
                <header className="itinerary-detail__header">
                  <div>
                    <h2>{selected.title}</h2>
                    <p>
                      {normalizeDestination(selected.destination)} · {formatDate(selected.startDate)} to{" "}
                      {formatDate(selected.endDate)}
                    </p>
                  </div>
                  <div className="itinerary-actions">
                    <button type="button" onClick={handleShare}>Share</button>
                    <button type="button" onClick={handleExport}>Export PDF</button>
                    <button type="button" className="danger" onClick={handleDeleteItinerary}>Delete</button>
                  </div>
                </header>

                {shareUrl ? (
                  <div className="itinerary-share">
                    <span>{shareUrl}</span>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(shareUrl)}>
                      Copy
                    </button>
                  </div>
                ) : null}

                {!selectedActivities.length ? (
                  <p className="muted">No saved posts yet. Browse posts and add places to this trip.</p>
                ) : null}

                {Object.entries(groupedActivities).map(([day, activities]) => (
                  <div className="itinerary-day" key={day}>
                    <h3>Day {day}</h3>
                    <div className="itinerary-activity-list">
                      {activities.map((activity) => {
                        const post = activity.post || {};
                        const isEditing = editingActivityId === activity._id;

                        return (
                          <article className="itinerary-activity" key={activity._id}>
                            <img src={post.photo || post.image || "/default_profile.jpg"} alt={post.title || "Activity"} />
                            <div className="itinerary-activity__body">
                              <strong>{post.title || "Untitled post"}</strong>
                              <span>{normalizeDestination(post.location)}</span>
                              {isEditing ? (
                                <div className="itinerary-edit-row">
                                  <input type="number" min="1" name="day" value={editForm.day} onChange={handleEditChange} />
                                  <input name="time" value={editForm.time} onChange={handleEditChange} />
                                  <input name="notes" value={editForm.notes} onChange={handleEditChange} placeholder="Notes" />
                                </div>
                              ) : (
                                <p>{activity.time} {activity.notes ? `· ${activity.notes}` : ""}</p>
                              )}
                            </div>
                            <div className="itinerary-activity__actions">
                              {isEditing ? (
                                <>
                                  <button type="button" onClick={() => handleSaveActivity(activity._id)}>Save</button>
                                  <button type="button" onClick={() => setEditingActivityId("")}>Cancel</button>
                                </>
                              ) : (
                                <>
                                  <button type="button" onClick={() => startEdit(activity)}>Edit</button>
                                  <button type="button" className="danger" onClick={() => handleRemoveActivity(activity._id)}>
                                    Remove
                                  </button>
                                </>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            ) : null}
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default ItineraryPage;
