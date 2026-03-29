import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  TbBulb, TbTool, TbBug, TbMessageCircle,
  TbArrowLeft, TbRefresh, TbTrash,
} from "react-icons/tb";
import "../styles/adminFeedback.css";

// ── Put your admin email(s) here ────────────────────────────
const ADMIN_EMAILS = ["dasunsucharith2002@gmail.com"];

const TYPE_META = {
  suggestion:  { label: "Suggestion",  icon: <TbBulb />,          color: "var(--af-blue)"   },
  improvement: { label: "Improvement", icon: <TbTool />,          color: "var(--af-amber)"  },
  bug:         { label: "Bug / Error", icon: <TbBug />,           color: "var(--af-red)"    },
  other:       { label: "Other",       icon: <TbMessageCircle />, color: "var(--af-purple)" },
};

function timeAgo(iso) {
  const sec = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (sec < 60)         return "just now";
  if (sec < 3600)       return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400)      return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 86400 * 7)  return `${Math.floor(sec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminFeedback() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("Feedback")
      .select("*")
      .order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  }

  async function deleteFeedback(id) {
    setDeletingId(id);
    await supabase.from("Feedback").delete().eq("id", id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    setDeletingId(null);
  }

  // ── Access guard ─────────────────────────────────────────────
  if (!user) {
    navigate("/auth", { replace: true });
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="af-denied">
        <h2>Access denied</h2>
        <p>You don't have permission to view this page.</p>
        <button onClick={() => navigate(-1)}><TbArrowLeft /> Go back</button>
      </div>
    );
  }

  // ── Stats ────────────────────────────────────────────────────
  const counts = rows.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  const filtered = filter === "all" ? rows : rows.filter((r) => r.type === filter);

  return (
    <div className="af-page">
      <div className="af-wrapper">

        {/* Header */}
        <div className="af-header">
          <div className="af-header-left">
            <button className="af-back-btn" onClick={() => navigate(-1)}>
              <TbArrowLeft /> Back
            </button>
            <div>
              <h1 className="af-title">Feedback Inbox</h1>
              <p className="af-sub">{rows.length} total submission{rows.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button className="af-refresh-btn" onClick={load} disabled={loading}>
            <TbRefresh className={loading ? "af-spin" : ""} />
          </button>
        </div>

        {/* Stat cards */}
        <div className="af-stats">
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <button
              key={key}
              className={`af-stat-card${filter === key ? " af-stat-card--active" : ""}`}
              style={{ "--af-accent": meta.color }}
              onClick={() => setFilter(filter === key ? "all" : key)}
            >
              <span className="af-stat-icon">{meta.icon}</span>
              <span className="af-stat-num">{counts[key] || 0}</span>
              <span className="af-stat-lbl">{meta.label}</span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="af-filter-bar">
          {["all", ...Object.keys(TYPE_META)].map((key) => (
            <button
              key={key}
              className={`af-filter-btn${filter === key ? " af-filter-btn--active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {key === "all" ? "All" : TYPE_META[key].label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="af-loading">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="af-empty">No feedback yet{filter !== "all" ? ` for "${TYPE_META[filter]?.label}"` : ""}.</div>
        ) : (
          <div className="af-list">
            {filtered.map((row) => {
              const meta = TYPE_META[row.type] || TYPE_META.other;
              return (
                <div key={row.id} className="af-card" style={{ "--af-accent": meta.color }}>
                  <div className="af-card-header">
                    <span className="af-type-badge" style={{ color: meta.color }}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="af-time">{timeAgo(row.created_at)}</span>
                  </div>
                  <p className="af-message">{row.message}</p>
                  <div className="af-card-footer">
                    <span className="af-email">{row.email || "Anonymous"}</span>
                    <button
                      className="af-delete-btn"
                      onClick={() => deleteFeedback(row.id)}
                      disabled={deletingId === row.id}
                      aria-label="Delete"
                    >
                      <TbTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
