import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import StreakBadge from "./components/StreakBadge";
import CookieBanner from "./components/CookieBanner";
import { Outlet, useLocation } from "react-router-dom";
import { TbMenu2 } from "react-icons/tb";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";

const SKIP_PATHS = ["/auth", "/verify-otp", "/admin/monitor", "/admin/feedback", "*"];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const path = location.pathname;
    if (SKIP_PATHS.some(p => path.startsWith(p))) return;

    supabase.from("page_views").insert({
      email: user?.email ?? null,
      path,
    }).then(({ error }) => {
      if (error) console.error("Page view tracking error:", error);
    });
  }, [location.pathname]);

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
        <span className="mobile-topbar-title">Grasperr</span>
      </div>

      <div className="page-content">
        <Outlet />
        <Footer />
      </div>

      <StreakBadge />
      <CookieBanner />
    </>
  );
}

export default App;
