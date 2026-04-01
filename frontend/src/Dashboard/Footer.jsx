import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <h3 className="footer-logo">GllyGuide   </h3>
        <p className="footer-text">
          Explore the world with trusted local guides.
        </p>

        <div className="footer-links">
          <span>Privacy Policy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>

        <p className="footer-copy">
          © {new Date().getFullYear()} GullyGuide. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;