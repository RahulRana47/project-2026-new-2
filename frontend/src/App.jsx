import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StateDetails from "./pages/StateDetails";
import DashboardLayout from "./Dashboard/DashboardLayout";
import MyProfile from "./Dashboard/myProfiles/MyProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import GuideProfile from "./pages/GuideProfile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/verify" element={<VerifyOtp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/state/:stateName" element={<StateDetails />} />
        <Route path="/guide/:guideId" element={<GuideProfile />} />
        <Route
          path="/dashboard/myprofile"
          element={
            <DashboardLayout>
              <MyProfile />
            </DashboardLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
