import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { loadUser, logout } from "../action/authActions";
import { fetchPosts } from "../action/postActions";
import DashboardLayout from "../Dashboard/DashboardLayout";
import Carasol from "../Dashboard/Carasol";
import GuiderProfiles from "../Dashboard/GuiderProfiles";
import Services from "../Dashboard/Services";
import Categories from "../Dashboard/Categories";
import TopPost from "../Dashboard/UsersPost";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user, loading, token, error } = useSelector((state) => state.auth);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  useEffect(() => {
    if (token && !user && !loading && !error) {
      dispatch(loadUser());
    }
  }, [token, user, loading, error, dispatch]);

  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      setShowGuestPrompt(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowGuestPrompt(true);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [token]);

  const handleRetry = () => dispatch(loadUser());
  const handleLogout = () => {
    dispatch(logout());
  };

  if (token && error) {
    return (
      <div style={{ padding: 24 }}>
        <p>Could not load your dashboard: {error}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleRetry} disabled={loading}>
            Retry
          </button>
          <button onClick={handleLogout}>Continue as guest</button>
        </div>
      </div>
    );
  }

  if (token && loading && !user) return <p>Loading...</p>;

  return (
    <DashboardLayout>
      <Carasol />
      <Services />
      <Categories />
      <TopPost user={user} />
      <GuiderProfiles />

      {!token && showGuestPrompt && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 24,
            width: "min(360px, calc(100vw - 32px))",
            padding: 20,
            borderRadius: 20,
            background: "rgba(15, 23, 42, 0.96)",
            color: "#f8fafc",
            boxShadow: "0 20px 45px rgba(15, 23, 42, 0.28)",
            zIndex: 1200,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "#86efac" }}>
            Optional Login
          </p>
          <h3 style={{ margin: "10px 0 8px", fontSize: 22 }}>
            Browse freely now, sign in when you want to connect with guides.
          </h3>
          <p style={{ margin: 0, color: "rgba(248,250,252,0.8)", lineHeight: 1.55 }}>
            Login is only needed later for guide dashboards, account actions, and private interactions.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link
              to="/login"
              style={{
                textDecoration: "none",
                background: "#22c55e",
                color: "#ffffff",
                padding: "10px 18px",
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              Login
            </Link>
            <Link
              to="/register"
              style={{
                textDecoration: "none",
                background: "#e0f2fe",
                color: "#075985",
                padding: "10px 18px",
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              Register
            </Link>
            <button
              type="button"
              onClick={() => setShowGuestPrompt(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "#cbd5e1",
                padding: "10px 4px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default Dashboard;
