import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { TbArrowLeft, TbSearch } from "react-icons/tb";

function Notfound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-main">
      <div className="notfound-card">
        <div className="notfound-code">404</div>
        <div className="notfound-divider" />
        <h1 className="notfound-title">Page not found</h1>
        <p className="notfound-sub">
          Looks like this page took a long walk and got lost. Even the best
          dictionaries don't have an entry for this URL.
        </p>
        <div className="notfound-actions">
          <button className="notfound-btn-secondary" onClick={() => navigate(-1)}>
            <TbArrowLeft /> Go back
          </button>
          <Link to="/" className="notfound-btn-primary">
            <TbSearch /> Search a word
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Notfound;
