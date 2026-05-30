import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../Dashboard/DashboardLayout";
import { getSharedItinerary } from "../services/api";
import "./ItineraryPage.css";

const formatDate = (value) => {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const locationLabel = (location = {}) => {
  if (typeof location === "string") return location;
  return [location.city, location.state].filter(Boolean).join(", ") || "Location not set";
};

const SharedItineraryPage = () => {
  const { shareCode } = useParams();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const groupedActivities = useMemo(() => {
    const sorted = [...(itinerary?.activities || [])].sort((a, b) => {
      if (Number(a.day || 1) !== Number(b.day || 1)) return Number(a.day || 1) - Number(b.day || 1);
      return Number(a.order || 0) - Number(b.order || 0);
    });

    return sorted.reduce((groups, activity) => {
      const day = activity.day || 1;
      if (!groups[day]) groups[day] = [];
      groups[day].push(activity);
      return groups;
    }, {});
  }, [itinerary?.activities]);

  useEffect(() => {
    let mounted = true;

    const loadSharedItinerary = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getSharedItinerary(shareCode);
        if (mounted) setItinerary(data?.itinerary || null);
      } catch (requestError) {
        if (mounted) setError(requestError?.message || "Unable to load shared itinerary.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSharedItinerary();

    return () => {
      mounted = false;
    };
  }, [shareCode]);

  return (
    <DashboardLayout>
      <main className="itinerary-page itinerary-page--shared">
        {loading ? <p className="muted">Loading shared itinerary...</p> : null}
        {error ? (
          <section className="itinerary-empty-state">
            <h1>Itinerary unavailable</h1>
            <p>{error}</p>
            <Link to="/dashboard">Go home</Link>
          </section>
        ) : null}

        {itinerary ? (
          <section className="itinerary-detail itinerary-detail--public">
            <header className="itinerary-detail__header">
              <div>
                <h1>{itinerary.title}</h1>
                <p>
                  Shared by {itinerary.user?.name || "GullyGuide user"} · {locationLabel(itinerary.destination)} ·{" "}
                  {formatDate(itinerary.startDate)} to {formatDate(itinerary.endDate)}
                </p>
              </div>
            </header>

            {!itinerary.activities?.length ? <p className="muted">No activities were added.</p> : null}

            {Object.entries(groupedActivities).map(([day, activities]) => (
              <div className="itinerary-day" key={day}>
                <h2>Day {day}</h2>
                <div className="itinerary-activity-list">
                  {activities.map((activity) => {
                    const post = activity.post || {};

                    return (
                      <article className="itinerary-activity" key={activity._id}>
                        <img src={post.photo || post.image || "/default_profile.jpg"} alt={post.title || "Activity"} />
                        <div className="itinerary-activity__body">
                          <strong>{post.title || "Untitled post"}</strong>
                          <span>{locationLabel(post.location)}</span>
                          <p>{activity.time} {activity.notes ? `· ${activity.notes}` : ""}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </main>
    </DashboardLayout>
  );
};

export default SharedItineraryPage;
