import "./Services.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShield,
  faGlobe,
  faHeadset,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";

const Services = () => {
  return (
    <div className="services">
      <div className="service-card">
        <div className="icon-box">
          <FontAwesomeIcon icon={faShield} size="lg" />
        </div>
        <h3>Verified Guides</h3>
        <p>
          Every guide is background-checked and certified for your safety.
        </p>
      </div>

      <div className="service-card">
        <div className="icon-box">
          <FontAwesomeIcon icon={faGlobe} size="lg" />
        </div>
        <h3>100+ Destinations</h3>
        <p>
          Explore guides across the globe in over 100 stunning destinations.
        </p>
      </div>

      <div className="service-card">
        <div className="icon-box">
          <FontAwesomeIcon icon={faHeadset} size="lg" />
        </div>
        <h3>24/7 Support</h3>
        <p>
          Our team is always available to help you, day or night.
        </p>
      </div>

      <div className="service-card">
        <div className="icon-box">
          <FontAwesomeIcon icon={faCreditCard} size="lg" />
        </div>
        <h3>Secure Payments</h3>
        <p>
          Book with confidence. Your payments are fully protected.
        </p>
      </div>
    </div>
  );
};

export default Services;