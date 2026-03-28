import React, { useState } from "react";
import Navbar from "./components/Navbar";
import StreakBadge from "./components/StreakBadge";
import { Outlet } from "react-router-dom";
import { TbMenu2 } from "react-icons/tb";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Navbar menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {menuOpen && (
        <div className="nav-backdrop" onClick={() => setMenuOpen(false)} />
      )}

      <div className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setMenuOpen(true)}>
          <TbMenu2 />
        </button>
        <span className="mobile-topbar-title">Lexify</span>
      </div>

      <div className="page-content">
        <Outlet />
      </div>

      <StreakBadge />
    </>
  );
}

export default App;
