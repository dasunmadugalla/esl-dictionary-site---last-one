import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import {
  TbFlame,
  TbSearch,
  TbBookmark,
  TbCalendarStats,
  TbArrowUp,
  TbArrowDown,
  TbHistory,
  TbChevronRight,
} from "react-icons/tb";
import Loader from "../components/Loader.jsx";
import { useToast } from "../context/ToastContext.jsx";

// ── Weekly line chart ──────────────────────────────────────────
function WeeklyChart({ data }) {
  const [hovered, setHovered] = useState(null);

  const VW = 600, VH = 210;
  const padX = 24, padTop = 28, padBottom = 42;
  const chartH = VH - padTop - padBottom;
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const n = data.length;

  const pts = data.map((w, i) => ({
    x: padX + (i / (n - 1)) * (VW - padX * 2),
    y: padTop + (1 - w.count / maxCount) * chartH,
    ...w,
  }));

  // smooth cubic bezier through all points
  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const mx = (p.x + c.x) / 2;
    linePath += ` C ${mx} ${p.y} ${mx} ${c.y} ${c.x} ${c.y}`;
  }

  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${padTop + chartH} L ${pts[0].x} ${padTop + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" className="wc-svg">
      <defs>
        <linearGradient id="wc-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0055ff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0055ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* area fill */}
      <path d={areaPath} fill="url(#wc-area-grad)" />

      {/* line */}
      <path d={linePath} fill="none" className="wc-line" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* nodes + labels */}
      {pts.map((p, i) => {
        const isHov = hovered === i;
        return (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "default" }}>
            {/* count tooltip above node */}
            {isHov && (
              <text x={p.x} y={p.y - 11} textAnchor="middle" className="wc-count">{p.count}</text>
            )}

            {/* outer ring on hover */}
            {isHov && <circle cx={p.x} cy={p.y} r="9" className="wc-node-ring" />}

            {/* node */}
            <circle
              cx={p.x} cy={p.y}
              r={isHov ? 5 : 4}
              className={`wc-node${p.isCurrent ? " wc-node--current" : ""}${isHov ? " wc-node--hov" : ""}`}
            />

            {/* week label */}
            {(p.showLabel !== false) && (
              <text
                x={p.x} y={VH - 6}
                textAnchor="middle"
                className={`wc-label${p.isCurrent ? " wc-label--current" : ""}`}
              >
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Compute last 12 weeks bucketed search counts ───────────────
function getWeeklyData(searches, createdAt) {
  const accountStart = createdAt ? new Date(createdAt) : null;
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfThisWeek.setHours(0, 0, 0, 0);

  return Array.from({ length: 12 }, (_, i) => {
    const weekStart = new Date(startOfThisWeek);
    weekStart.setDate(startOfThisWeek.getDate() - (11 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return {
      label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: searches.filter((s) => {
        const d = new Date(s.created_at);
        return d >= weekStart && d < weekEnd;
      }).length,
      isCurrent: i === 11,
      beforeAccount: accountStart ? weekEnd <= accountStart : false,
    };
  }).filter((w) => !w.beforeAccount);
}

// ── Compute last 30 days bucketed search counts ────────────────
function getDailyData(searches, createdAt) {
  const accountStart = createdAt ? new Date(createdAt) : null;
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  const all = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (29 - i));
    const dateStr = day.toISOString().slice(0, 10);
    const beforeAccount = accountStart
      ? day < new Date(accountStart.toISOString().slice(0, 10))
      : false;

    return {
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: searches.filter((s) => s.created_at.slice(0, 10) === dateStr).length,
      isCurrent: i === 29,
      beforeAccount,
    };
  }).filter((d) => !d.beforeAccount);

  // Add showLabel: show ~6 evenly spaced labels + always the last
  const len = all.length;
  const step = Math.max(1, Math.floor(len / 5));
  return all.map((d, i) => ({
    ...d,
    showLabel: i % step === 0 || i === len - 1,
  }));
}

// ── Dashboard ──────────────────────────────────────────────────
function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    streak: 0,
    longestStreak: 0,
    totalSearches: 0,
    totalBookmarks: 0,
    todaySearches: 0,
    thisWeekSearches: 0,
    lastWeekSearches: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [chartView, setChartView] = useState("weeks"); // "weeks" | "days"

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {

      const [{ data: searches, error: sErr }, { data: bookmarks, error: bErr }] = await Promise.all([
        supabase.from("searches").select("word, created_at").eq("email", user.email).order("created_at", { ascending: false }),
        supabase.from("Bookmarks").select("wordIDs").eq("email", user.email),
      ]);

      if (sErr || bErr) throw sErr || bErr;

      const bookmarkCount = new Set(bookmarks?.map((b) => b.wordIDs) ?? []).size;

      if (searches) {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

        const totalSearches = searches.length;
        const todaySearches = searches.filter(
          (s) => s.created_at.slice(0, 10) === today
        ).length;

        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startOfThisWeek.setHours(0, 0, 0, 0);
        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

        const thisWeekSearches = searches.filter((s) => new Date(s.created_at) >= startOfThisWeek).length;
        const lastWeekSearches = searches.filter((s) => {
          const d = new Date(s.created_at);
          return d >= startOfLastWeek && d < startOfThisWeek;
        }).length;

        const uniqueDates = [
          ...new Set(searches.map((s) => s.created_at.slice(0, 10))),
        ].sort((a, b) => b.localeCompare(a));

        let streak = 0;
        if (uniqueDates.length > 0 && (uniqueDates[0] === today || uniqueDates[0] === yesterday)) {
          let expected = uniqueDates[0];
          for (const date of uniqueDates) {
            if (date === expected) {
              streak++;
              const d = new Date(expected);
              d.setDate(d.getDate() - 1);
              expected = d.toISOString().slice(0, 10);
            } else {
              break;
            }
          }
        }

        const datesAsc = [...uniqueDates].sort((a, b) => a.localeCompare(b));
        let longestStreak = 0;
        let currentRun = 0;
        for (let i = 0; i < datesAsc.length; i++) {
          if (i === 0) {
            currentRun = 1;
          } else {
            const prev = new Date(datesAsc[i - 1]);
            prev.setDate(prev.getDate() + 1);
            currentRun = prev.toISOString().slice(0, 10) === datesAsc[i] ? currentRun + 1 : 1;
          }
          if (currentRun > longestStreak) longestStreak = currentRun;
        }

        setStats({
          streak,
          longestStreak,
          totalSearches,
          totalBookmarks: bookmarkCount || 0,
          todaySearches,
          thisWeekSearches,
          lastWeekSearches,
        });
        setWeeklyData(getWeeklyData(searches, user.created_at));
        setDailyData(getDailyData(searches, user.created_at));
      }

      } catch (err) {
        showToast("Failed to load dashboard data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <Loader />;

  return (
    <div className="dashboard-main-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">{user?.email}</p>
      </div>

      <div className="dashboard-stats-grid">
        <div className="stat-card stat-card--streak">
          <TbFlame className="stat-icon" />
          <span className="stat-number">{stats.streak}</span>
          <div className="stat-label-row">
            <span className="stat-label">Day Streak</span>
            {stats.longestStreak > 0 && (
              <span className="stat-longest">best {stats.longestStreak}</span>
            )}
          </div>
        </div>

        <div className="stat-card">
          <TbSearch className="stat-icon" />
          <span className="stat-number">{stats.totalSearches}</span>
          <span className="stat-label">Words Searched</span>
        </div>

        <div className="stat-card">
          <TbBookmark className="stat-icon" />
          <span className="stat-number">{stats.totalBookmarks}</span>
          <span className="stat-label">Bookmarks</span>
        </div>

        <div className="stat-card">
          <TbCalendarStats className="stat-icon" />
          <span className="stat-number">{stats.thisWeekSearches}</span>
          <div className="stat-label-row">
            <span className="stat-label">This Week</span>
            {stats.thisWeekSearches > stats.lastWeekSearches ? (
              <span className="stat-week-trend stat-week-trend--up">
                <TbArrowUp />+{stats.thisWeekSearches - stats.lastWeekSearches} than last week
              </span>
            ) : stats.thisWeekSearches < stats.lastWeekSearches ? (
              <span className="stat-week-trend stat-week-trend--down">
                <TbArrowDown />-{stats.lastWeekSearches - stats.thisWeekSearches} than last week
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Activity chart ── */}
      <div className="dashboard-chart-card">
        <div className="dashboard-history-header">
          <h2 className="dashboard-section-title">Activity</h2>
          <div className="chart-timeframe-toggle">
            <button
              className={`chart-timeframe-btn${chartView === "days" ? " active" : ""}`}
              onClick={() => setChartView("days")}
            >
              Days
            </button>
            <button
              className={`chart-timeframe-btn${chartView === "weeks" ? " active" : ""}`}
              onClick={() => setChartView("weeks")}
            >
              Weeks
            </button>
          </div>
        </div>
        <div className="dashboard-chart-body">
          <WeeklyChart data={chartView === "weeks" ? weeklyData : dailyData} />
        </div>
      </div>

      {/* ── History link ── */}
      <div className="dashboard-history-link" onClick={() => navigate("/history")}>
        <div className="dashboard-history-link-left">
          <TbHistory className="dashboard-history-link-icon" />
          <div>
            <div className="dashboard-history-link-title">Search History</div>
            <div className="dashboard-history-link-sub">{stats.totalSearches} searches — view all by date</div>
          </div>
        </div>
        <TbChevronRight className="dashboard-history-link-arrow" />
      </div>
    </div>
  );
}

export default Dashboard;
