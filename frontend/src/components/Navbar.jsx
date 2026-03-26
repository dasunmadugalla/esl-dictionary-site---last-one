import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import {
  TbSparkles,
  TbCube,
  TbWorld,
  TbUserCircle,
  TbSettings,
  TbBookmark,
  TbStar,
} from "react-icons/tb";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg"

function Navbar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [logoutVisible, setLogoutVisibility] = useState(false);

  const handleLogoutVisibility = () => {
    logoutVisible? setLogoutVisibility(false) :setLogoutVisibility(true)
  }

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error.message);
  }else{
    navigate("/auth")
  }
};
  return (
    <div className="navBar">
      {/* <img src={logo} alt="Dictionary" className="site-logo" /> */}
      <ul>
        <li>
          <Link to="/">
            <FiHome className="nav-icon" />
            <span className="nav-txt">Home</span>
          </Link>
        </li>

        <li>
          <Link to="/policy">
            <TbSparkles className="nav-icon" />
            <span className="nav-txt">Private Policy</span>
          </Link>
        </li>

        <li>
          <Link to="/trending">
            <TbCube className="nav-icon" />
            <span className="nav-txt">Trending</span>
          </Link>
        </li>

        <li>
          <Link to="/word-of-the-day">
            <TbWorld className="nav-icon" />
            <span className="nav-txt">Word of the day</span>
          </Link>
        </li>
      </ul>
        <hr />
      <ul>
        <li>
          <Link to="/bookmarks">
            <TbBookmark className="nav-icon" />
            <span className="nav-txt">Bookmark</span>
          </Link>
        </li>
        <li>
          <Link to="/">
            <TbStar className="nav-icon" />
            <span className="nav-txt">Bookmark</span>
          </Link>
        </li>
      </ul>

        <hr />


      <ul className="list-bottom">
        <li>
          <Link to="/">
            <TbSettings className="nav-icon" />
            <span className="nav-txt">Settings</span>
          </Link>
        </li>
        <li className="account-nav-wrap" onClick={handleLogoutVisibility}>

          <div className="email-box">
                        <TbUserCircle className="nav-icon" />
            <span className="nav-txt">
              {loading ? "Loading…" : user ? user.email : "Guest"}
            </span>
          </div>
                    <span className="logout-wrapper">
                             {logoutVisible && <button onClick={handleLogout} className="logout-btn">logout</button>
}

          </span>

        </li>
      </ul>
    </div>
  );
}

export default Navbar;
