import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  TbUsers, TbSearch, TbDatabase, TbMessageCircle,
  TbArrowUp, TbArrowDown, TbMinus, TbRefresh,
  TbArrowLeft, TbEye, TbUserPlus, TbChartBar,
} from "react-icons/tb";

const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS?.split(",").map(e => e.trim()) ?? [];

// ── Dual-line SVG chart ──────────────────────────────────────────
function DualLineChart({ data }) {
  const [hovered, setHovered] = useState(null);
  const VW = 600, VH = 220, padX = 28, padTop = 28, padBottom = 44;
  const chartH = VH - padTop - padBottom;
  const n = data.length;
  if (n < 2) return null;

  const maxVal = Math.max(...data.map(d => Math.max(d.searches, d.views)), 1);

  const pts = (key) => data.map((d, i) => ({
    x: padX + (i / (n - 1)) * (VW - padX * 2),
    y: padTop + (1 - d[key] / maxVal) * chartH,
    val: d[key],
    label: d.label,
    showLabel: d.showLabel,
  }));

  const sPts = pts("searches");
  const vPts = pts("views");

  function makeLine(p) {
    let d = `M ${p[0].x} ${p[0].y}`;
    for (let i = 1; i < p.length; i++) {
      const mx = (p[i - 1].x + p[i].x) / 2;
      d += ` C ${mx} ${p[i-1].y} ${mx} ${p[i].y} ${p[i].x} ${p[i].y}`;
    }
    return d;
  }

  function makeArea(p) {
    return `${makeLine(p)} L ${p[p.length-1].x} ${padTop + chartH} L ${p[0].x} ${padTop + chartH} Z`;
  }

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" className="am-chart-svg">
      <defs>
        <linearGradient id="am-sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="am-vg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={makeArea(sPts)} fill="url(#am-sg)" />
      <path d={makeArea(vPts)} fill="url(#am-vg)" />
      <path d={makeLine(sPts)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={makeLine(vPts)} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {sPts.map((sp, i) => {
        const vp = vPts[i];
        const isHov = hovered === i;
        return (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "default" }}>
            <rect x={sp.x - 14} y={padTop} width={28} height={chartH} fill="transparent" />

            {isHov && (
              <>
                <line x1={sp.x} y1={padTop} x2={sp.x} y2={padTop + chartH} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
                <rect x={sp.x - 22} y={sp.y - 26} width={44} height={18} rx={4} fill="#3b82f6" />
                <text x={sp.x} y={sp.y - 13} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">{sp.val}</text>
                <rect x={vp.x - 22} y={vp.y - 26} width={44} height={18} rx={4} fill="#10b981" />
                <text x={vp.x} y={vp.y - 13} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">{vp.val}</text>
              </>
            )}

            <circle cx={sp.x} cy={sp.y} r={isHov ? 5 : 3} fill="#3b82f6" />
            <circle cx={vp.x} cy={vp.y} r={isHov ? 5 : 3} fill="#10b981" />

            {sp.showLabel && (
              <text x={sp.x} y={VH - 6} textAnchor="middle" fill="var(--text-muted)" fontSize="10">{sp.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── KPI card ─────────────────────────────────────────────────────
function KpiCard({ icon, label, value, accent }) {
  return (
    <div className="am-kpi-card" style={{ "--am-accent": accent }}>
      <span className="am-kpi-icon">{icon}</span>
      <span className="am-kpi-value">{value}</span>
      <span className="am-kpi-label">{label}</span>
    </div>
  );
}

// ── Metric tile ──────────────────────────────────────────────────
function MetricTile({ label, value, trend, trendLabel }) {
  return (
    <div className="am-metric-tile">
      <span className="am-metric-value">{value}</span>
      <span className="am-metric-label">{label}</span>
      {trendLabel && (
        <span className={`am-metric-trend ${
          trend > 0 ? "am-metric-trend--up"
          : trend < 0 ? "am-metric-trend--down"
          : "am-metric-trend--flat"}`}>
          {trend > 0 ? <TbArrowUp /> : trend < 0 ? <TbArrowDown /> : <TbMinus />}
          {trendLabel}
        </span>
      )}
    </div>
  );
}

// ── Time ago ─────────────────────────────────────────────────────
function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── Main component ───────────────────────────────────────────────
export default function AdminMonitor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  const [loading, setLoading]           = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [searches, setSearches]         = useState([]);
  const [wordCount, setWordCount]       = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [chartView, setChartView]       = useState("days");

  async function load() {
    setLoading(true);
    const [
      { data: sData },
      { count: wCount },
      { count: fCount },
    ] = await Promise.all([
      supabase.from("searches").select("email, word, created_at, type").order("created_at", { ascending: false }),
      supabase.from("Words").select("*", { count: "exact", head: true }),
      supabase.from("Feedback").select("*", { count: "exact", head: true }),
    ]);
    setSearches(sData || []);
    setWordCount(wCount || 0);
    setFeedbackCount(fCount || 0);
    setLastRefreshed(new Date());
    setLoading(false);
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!user) { navigate("/auth", { replace: true }); return null; }
  if (!isAdmin) return (
    <div className="af-denied">
      <h2>Access denied</h2>
      <p>You don't have permission to view this page.</p>
      <button onClick={() => navigate(-1)}><TbArrowLeft /> Go back</button>
    </div>
  );

  // ── Stats ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const now   = new Date();
    const dow   = now.getDay();

    const startThisWeek = new Date(now);
    startThisWeek.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    startThisWeek.setHours(0, 0, 0, 0);
    const startLastWeek = new Date(startThisWeek);
    startLastWeek.setDate(startThisWeek.getDate() - 7);
    const last30 = new Date(now);
    last30.setDate(now.getDate() - 30);

    const allSearches = searches.filter(s => s.type !== "view");
    const allViews    = searches.filter(s => s.type === "view");
    const allEmails   = [...new Set(searches.map(s => s.email))];
    const totalUsers  = allEmails.length;

    const todaySearches  = allSearches.filter(s => s.created_at.slice(0, 10) === today).length;
    const todayViews     = allViews.filter(s => s.created_at.slice(0, 10) === today).length;
    const activeToday    = new Set(searches.filter(s => s.created_at.slice(0, 10) === today).map(s => s.email)).size;

    const thisWeekS  = allSearches.filter(s => new Date(s.created_at) >= startThisWeek).length;
    const lastWeekS  = allSearches.filter(s => { const d = new Date(s.created_at); return d >= startLastWeek && d < startThisWeek; }).length;
    const thisWeekV  = allViews.filter(s => new Date(s.created_at) >= startThisWeek).length;
    const lastWeekV  = allViews.filter(s => { const d = new Date(s.created_at); return d >= startLastWeek && d < startThisWeek; }).length;

    const activeThisWeek  = new Set(searches.filter(s => new Date(s.created_at) >= startThisWeek).map(s => s.email)).size;
    const newUsersThisWeek = allEmails.filter(email => {
      const first = searches.filter(s => s.email === email).map(s => s.created_at).sort()[0];
      return first && new Date(first) >= startThisWeek;
    }).length;

    const s30 = allSearches.filter(s => new Date(s.created_at) >= last30).length;
    const avgDailySearches = +(s30 / 30).toFixed(1);
    const activeEmails30 = new Set(searches.filter(s => new Date(s.created_at) >= last30).map(s => s.email)).size;
    const avgPerUser = activeEmails30 > 0 ? +(s30 / activeEmails30 / 30).toFixed(2) : 0;

    const weekTrend = lastWeekS > 0 ? Math.round(((thisWeekS - lastWeekS) / lastWeekS) * 100) : null;
    const viewTrend = lastWeekV > 0 ? Math.round(((thisWeekV - lastWeekV) / lastWeekV) * 100) : null;

    // Top 10 words
    const wc = {};
    allSearches.forEach(s => { wc[s.word] = (wc[s.word] || 0) + 1; });
    const topWords = Object.entries(wc).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, count]) => ({ word, count }));

    // Daily unique users (avg)
    const dayMap = {};
    searches.forEach(s => {
      const d = s.created_at.slice(0, 10);
      if (!dayMap[d]) dayMap[d] = new Set();
      dayMap[d].add(s.email);
    });
    const last30DayKeys = Object.keys(dayMap).filter(d => new Date(d) >= last30);
    const avgDailyUsers = last30DayKeys.length > 0
      ? +(last30DayKeys.reduce((sum, d) => sum + dayMap[d].size, 0) / last30DayKeys.length).toFixed(1)
      : 0;

    return {
      totalUsers, totalSearches: allSearches.length, totalViews: allViews.length,
      todaySearches, todayViews, activeToday,
      thisWeekS, lastWeekS, thisWeekV, lastWeekV,
      activeThisWeek, newUsersThisWeek,
      avgDailySearches, avgPerUser, avgDailyUsers,
      weekTrend, viewTrend, topWords,
    };
  }, [searches]);

  // ── Chart data ───────────────────────────────────────────────
  const chartData = useMemo(() => {
    const now = new Date();
    if (chartView === "days") {
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (29 - i));
        const ds = d.toISOString().slice(0, 10);
        return {
          label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          searches: searches.filter(s => s.type !== "view" && s.created_at.slice(0, 10) === ds).length,
          views:    searches.filter(s => s.type === "view"  && s.created_at.slice(0, 10) === ds).length,
          showLabel: i % 6 === 0 || i === 29,
        };
      });
    }
    const dow = now.getDay();
    const sow = new Date(now);
    sow.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    sow.setHours(0, 0, 0, 0);
    return Array.from({ length: 12 }, (_, i) => {
      const ws = new Date(sow); ws.setDate(sow.getDate() - (11 - i) * 7);
      const we = new Date(ws); we.setDate(ws.getDate() + 7);
      return {
        label: ws.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        searches: searches.filter(s => s.type !== "view" && new Date(s.created_at) >= ws && new Date(s.created_at) < we).length,
        views:    searches.filter(s => s.type === "view"  && new Date(s.created_at) >= ws && new Date(s.created_at) < we).length,
        showLabel: true,
      };
    });
  }, [searches, chartView]);

  const topMax = stats.topWords[0]?.count || 1;

  return (
    <div className="am-page">
      <div className="am-wrapper">

        {/* Header */}
        <div className="af-header">
          <div className="af-header-left">
            <button className="af-back-btn" onClick={() => navigate(-1)}>
              <TbArrowLeft /> Back
            </button>
            <div>
              <h1 className="af-title">Site Monitor</h1>
              <p className="af-sub">
                {loading ? "Loading…" : `Refreshed ${timeAgo(lastRefreshed)} · ${searches.length.toLocaleString()} total records`}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Link to="/admin/feedback" className="am-link-btn">
              <TbMessageCircle /> Feedback inbox
            </Link>
            <button className="af-refresh-btn" onClick={load} disabled={loading}>
              <TbRefresh className={loading ? "af-spin" : ""} />
            </button>
          </div>
        </div>

        {loading ? <div className="af-loading">Loading monitor data…</div> : (
          <>
            {/* KPI grid */}
            <div className="am-kpi-grid">
              <KpiCard icon={<TbUsers />}        label="Registered Users"     value={stats.totalUsers.toLocaleString()}        accent="#3b82f6" />
              <KpiCard icon={<TbDatabase />}      label="Words in Dictionary"  value={wordCount.toLocaleString()}               accent="#8b5cf6" />
              <KpiCard icon={<TbSearch />}        label="All-time Searches"    value={stats.totalSearches.toLocaleString()}     accent="#f59e0b" />
              <KpiCard icon={<TbMessageCircle />} label="Feedback Received"    value={feedbackCount.toLocaleString()}           accent="#ef4444" />
            </div>

            {/* Metrics strip */}
            <div className="am-metrics-grid">
              <MetricTile label="Searches Today"            value={stats.todaySearches} />
              <MetricTile label="Views Today"               value={stats.todayViews} />
              <MetricTile label="Active Users Today"        value={stats.activeToday} />
              <MetricTile label="Avg Daily Active Users"    value={stats.avgDailyUsers} />
              <MetricTile
                label="Searches This Week"
                value={stats.thisWeekS}
                trend={stats.weekTrend}
                trendLabel={stats.weekTrend !== null ? `${Math.abs(stats.weekTrend)}% vs last week` : null}
              />
              <MetricTile
                label="Views This Week"
                value={stats.thisWeekV}
                trend={stats.viewTrend}
                trendLabel={stats.viewTrend !== null ? `${Math.abs(stats.viewTrend)}% vs last week` : null}
              />
              <MetricTile label="Avg Daily Searches (30d)"     value={stats.avgDailySearches} />
              <MetricTile label="Avg Searches / User / Day"    value={stats.avgPerUser} />
              <MetricTile label="Active Users This Week"       value={stats.activeThisWeek} />
              <MetricTile
                label="New Users This Week"
                value={stats.newUsersThisWeek}
                trend={stats.newUsersThisWeek > 0 ? 1 : 0}
                trendLabel={stats.newUsersThisWeek > 0 ? "joined this week" : null}
              />
            </div>

            {/* Activity chart */}
            <div className="am-section-card">
              <div className="am-section-header">
                <div>
                  <h2 className="am-section-title">Activity</h2>
                  <div className="am-chart-legend">
                    <span className="am-legend-dot" style={{ background: "#3b82f6" }} />Searches
                    <span className="am-legend-dot" style={{ background: "#10b981" }} />Views
                  </div>
                </div>
                <div className="chart-timeframe-toggle">
                  <button className={`chart-timeframe-btn${chartView === "days"  ? " active" : ""}`} onClick={() => setChartView("days")}>Days</button>
                  <button className={`chart-timeframe-btn${chartView === "weeks" ? " active" : ""}`} onClick={() => setChartView("weeks")}>Weeks</button>
                </div>
              </div>
              <DualLineChart data={chartData} />
            </div>

            {/* Top words */}
            <div className="am-section-card">
              <h2 className="am-section-title">Top 10 Searched Words</h2>
              <div className="am-top-words">
                {stats.topWords.length === 0 ? (
                  <p className="af-empty">No search data yet.</p>
                ) : stats.topWords.map(({ word, count }, i) => (
                  <div key={word} className="am-top-word-row">
                    <span className="am-top-word-rank">#{i + 1}</span>
                    <Link to={`/word/${encodeURIComponent(word)}`} className="am-top-word-name">{word}</Link>
                    <div className="am-top-word-bar-track">
                      <div className="am-top-word-bar" style={{ width: `${(count / topMax) * 100}%` }} />
                    </div>
                    <span className="am-top-word-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
