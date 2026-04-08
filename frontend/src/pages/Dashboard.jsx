import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { user, loading, token, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // ensure posts are available for dashboard modules (categories, carousels, etc.)
    dispatch(fetchPosts());

    if (!user && !loading && !error) {
      dispatch(loadUser());
    }
  }, [token, user, loading, error, dispatch, navigate]);

  const handleRetry = () => dispatch(loadUser());
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p>Could not load your dashboard: {error}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleRetry} disabled={loading}>
            Retry
          </button>
          <button onClick={handleLogout}>Back to login</button>
        </div>
      </div>
    );
  }

  if (loading || !user) return <p>Loading...</p>;

  return (
    <DashboardLayout>

      <Carasol />

      <Services />

      <Categories />

      {/* TOP POSTS */}
      <TopPost user={user} />

      <GuiderProfiles />

    </DashboardLayout>
  );
};

export default Dashboard;
