import { useEffect, useState } from "react";
import { getMe } from "../services/api";
import DashboardLayout from "../Dashboard/DashboardLayout";
import Carasol from "../Dashboard/Carasol";
import GuiderProfiles from "../Dashboard/GuiderProfiles";
import Services from "../Dashboard/Services";
import Categories from "../Dashboard/Categories";
import TopPost from "../Dashboard/UsersPost";

const Dashboard = () => {

  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    const res = await getMe(token);
    setUser(res.user);
  };

  if (!user) return <p>Loading...</p>;

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