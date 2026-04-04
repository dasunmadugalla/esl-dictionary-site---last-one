import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/cookieBanner.css";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "all");
    setVisible(false);
  }

  function leave() {
    window.location.href = "https://www.google.com";
  }

  if (!visible) return null;

  return (
    <div className="cookie-gate">
      <div className="cookie-gate-card">
        <h2 className="cookie-gate-title">Before you continue</h2>
        <p className="cookie-gate-text">
          Grasperr uses essential cookies to keep the site running and advertising
          cookies (Google AdSense) to support free access to the dictionary.
          By continuing, you agree to our use of cookies as described in our{" "}
          <Link to="/policy" className="cookie-gate-link">Privacy Policy</Link>.
        </p>
        <div className="cookie-gate-actions">
          <button className="cookie-btn cookie-btn--secondary" onClick={leave}>
            Leave
          </button>
          <button className="cookie-btn cookie-btn--primary" onClick={accept}>
            Accept & continue
          </button>
        </div>
      </div>
    </div>
  );
}
