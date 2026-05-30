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
import AdminPanel from "./pages/AdminPanel";
import BookingsPage from "./pages/BookingsPage";
import MessagesPage from "./pages/MessagesPage";
import ItineraryPage from "./pages/ItineraryPage";
import SharedItineraryPage from "./pages/SharedItineraryPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyOtp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/admin" element={<AdminPanel />} />
        <Route
          path="/dashboard/guide"
          element={
            <DashboardLayout>
              <MyProfile />
            </DashboardLayout>
          }
        />
        <Route path="/state/:stateName" element={<StateDetails />} />
        <Route path="/guide/:guideId" element={<GuideProfile />} />
        <Route path="/dashboard/bookings" element={<BookingsPage />} />
        <Route path="/dashboard/messages" element={<MessagesPage />} />
        <Route path="/dashboard/itinerary" element={<ItineraryPage />} />
        <Route path="/itinerary/shared/:shareCode" element={<SharedItineraryPage />} />
        <Route
          path="/dashboard/myprofile"
          element={
            <BookingsPage />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
