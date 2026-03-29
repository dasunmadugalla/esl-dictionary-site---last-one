import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import {
  TbSparkles,
  TbTrendingUp,
  TbWorld,
  TbUserCircle,
  TbSettings,
  TbBookmark,
  TbLayoutDashboard,
  TbFolders,
  TbHistory,
  TbX,
  TbSun,
  TbMoon,
  TbInfoCircle,
} from "react-icons/tb";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.svg";

function Navbar({ menuOpen, onClose }) {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [logoutVisible, setLogoutVisible] = useState(false);

  const navClass = ({ isActive }) => (isActive ? "active" : "");

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
    } else {
      handleNavClick();
      navigate("/auth");
    }
  };

  return (
    <div className={`navbar${menuOpen ? " mobile-open" : ""}`}>
      {/* Mobile close button */}
      <button className="nav-close-btn" onClick={onClose}>
        <TbX />
      </button>

      {/* <img src={logo} alt="Dictionary" className="site-logo" /> */}

      <ul>
        <li>
          <NavLink to="/" end className={navClass} onClick={handleNavClick}>
            <FiHome className="nav-icon" />
            <span className="nav-txt">Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard" className={navClass} onClick={handleNavClick}>
            <TbLayoutDashboard className="nav-icon" />
            <span className="nav-txt">Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/trending" className={navClass} onClick={handleNavClick}>
            <TbTrendingUp className="nav-icon" />
            <span className="nav-txt">Trending</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/word-of-the-day" className={navClass} onClick={handleNavClick}>
            <TbWorld className="nav-icon" />
            <span className="nav-txt">Word of the Day</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/about" className={navClass} onClick={handleNavClick}>
            <TbInfoCircle className="nav-icon" />
            <span className="nav-txt">About</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/policy" className={navClass} onClick={handleNavClick}>
            <TbSparkles className="nav-icon" />
            <span className="nav-txt">Privacy Policy</span>
          </NavLink>
        </li>
      </ul>

      <hr />

      <ul>
        <li>
          <NavLink to="/bookmarks" className={navClass} onClick={handleNavClick}>
            <TbBookmark className="nav-icon" />
            <span className="nav-txt">Bookmarks</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/collections" className={navClass} onClick={handleNavClick}>
            <TbFolders className="nav-icon" />
            <span className="nav-txt">Collections</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/history" className={navClass} onClick={handleNavClick}>
            <TbHistory className="nav-icon" />
            <span className="nav-txt">History</span>
          </NavLink>
        </li>
      </ul>

      <hr />

      <ul>
        <li>
          <button className="nav-theme-btn" onClick={toggle}>
            {theme === "dark" ? <TbSun className="nav-icon" /> : <TbMoon className="nav-icon" />}
            <span className="nav-txt">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </li>
      </ul>

      <ul className="nav-list-bottom">
        <li>
          <NavLink to="/settings" className={navClass} onClick={handleNavClick}>
            <TbSettings className="nav-icon" />
            <span className="nav-txt">Settings</span>
          </NavLink>
        </li>
        <li className="account-nav-wrap" onClick={() => setLogoutVisible((v) => !v)}>
          <div className="nav-account-row">
            <TbUserCircle className="nav-icon" />
            <span className="nav-txt nav-email">
              {loading ? "Loading…" : user ? user.email : "Guest"}
            </span>
          </div>
          {logoutVisible && (
            <div className="logout-wrapper">
              <button onClick={handleLogout} className="logout-btn">
                Log out
              </button>
            </div>
          )}
        </li>
      </ul>
    </div>
  );
}

export default Navbar;
