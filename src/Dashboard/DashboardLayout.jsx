import Navbar from "./Navbar";
import Footer from "./Footer";
import "./DashboardLayout.css";

const DashboardLayout = ({ children }) => {
  return (
    <div className="layout">
      <Navbar />
      <div className="layout-content">
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;