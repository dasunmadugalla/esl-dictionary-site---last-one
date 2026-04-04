import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  TbUsers, TbSearch, TbDatabase, TbMessageCircle,
  TbArrowUp, TbArrowDown, TbRefresh,
  TbArrowLeft, TbPhoto, TbClick,
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

// ── Trend indicator ──────────────────────────────────────────────
function Trend({ value }) {
  if (value === null || value === undefined) return null;
  if (value > 0) return <span className="am-stat-trend am-stat-trend--up"><TbArrowUp />{Math.abs(value)}% vs last week</span>;
  if (value < 0) return <span className="am-stat-trend am-stat-trend--down"><TbArrowDown />{Math.abs(value)}% vs last week</span>;
  return null;
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

  const [loading, setLoading]             = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [searches, setSearches]           = useState([]);
  const [downloads, setDownloads]         = useState([]);
  const [pageViews, setPageViews]         = useState([]);
  const [wordCount, setWordCount]         = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [chartView, setChartView]         = useState("days");
  const [pvChartView, setPvChartView]     = useState("days");

  async function load() {
    setLoading(true);
    const [
      { data: sData },
      { data: dlData },
      { data: pvData },
      { count: wCount },
      { count: fCount },
    ] = await Promise.all([
      supabase.from("searches").select("email, word, created_at, type").order("created_at", { ascending: false }),
      supabase.from("downloads").select("email, word, created_at").order("created_at", { ascending: false }),
      supabase.from("page_views").select("email, path, created_at").order("created_at", { ascending: false }),
      supabase.from("Words").select("*", { count: "exact", head: true }),
      supabase.from("Feedback").select("*", { count: "exact", head: true }),
    ]);
    setSearches(sData || []);
    setDownloads(dlData || []);
    setPageViews(pvData || []);
    setWordCount(wCount || 0);
    setFeedbackCount(fCount || 0);
    setLastRefreshed(new Date());
    setLoading(false);
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!user) { navigate("/auth", { replace: true }); return null; }
  if (!isAdmin) return (
    <div className="am-denied">
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

    // ── Downloads ─────────────────────────────────────────────
    const todayDownloads    = downloads.filter(d => d.created_at.slice(0, 10) === today).length;
    const thisWeekDl        = downloads.filter(d => new Date(d.created_at) >= startThisWeek).length;
    const lastWeekDl        = downloads.filter(d => { const dt = new Date(d.created_at); return dt >= startLastWeek && dt < startThisWeek; }).length;
    const dl30              = downloads.filter(d => new Date(d.created_at) >= last30).length;
    const avgDailyDownloads = +(dl30 / 30).toFixed(1);
    const dlWeekTrend       = lastWeekDl > 0 ? Math.round(((thisWeekDl - lastWeekDl) / lastWeekDl) * 100) : null;

    // Top downloaded words
    const dlwc = {};
    downloads.forEach(d => { dlwc[d.word] = (dlwc[d.word] || 0) + 1; });
    const topDownloaded = Object.entries(dlwc).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word, count]) => ({ word, count }));

    // ── Page views ────────────────────────────────────────────
    const todayPV      = pageViews.filter(p => p.created_at.slice(0, 10) === today).length;
    const thisWeekPV   = pageViews.filter(p => new Date(p.created_at) >= startThisWeek).length;
    const lastWeekPV   = pageViews.filter(p => { const dt = new Date(p.created_at); return dt >= startLastWeek && dt < startThisWeek; }).length;
    const pv30         = pageViews.filter(p => new Date(p.created_at) >= last30).length;
    const avgDailyPV   = +(pv30 / 30).toFixed(1);
    const pvWeekTrend  = lastWeekPV > 0 ? Math.round(((thisWeekPV - lastWeekPV) / lastWeekPV) * 100) : null;

    // Top pages
    const ppc = {};
    pageViews.forEach(p => { ppc[p.path] = (ppc[p.path] || 0) + 1; });
    const topPages = Object.entries(ppc).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([path, count]) => ({ path, count }));

    return {
      totalUsers, totalSearches: allSearches.length, totalViews: allViews.length,
      todaySearches, todayViews, activeToday,
      thisWeekS, thisWeekV, weekTrend, viewTrend,
      activeThisWeek, newUsersThisWeek,
      avgDailySearches, avgPerUser, topWords,
      todayDownloads, thisWeekDl, avgDailyDownloads, dlWeekTrend, topDownloaded,
      totalDownloads: downloads.length,
      todayPV, thisWeekPV, avgDailyPV, pvWeekTrend, topPages,
      totalPV: pageViews.length,
    };
  }, [searches, downloads, pageViews]);

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

  // ── Page view chart data ─────────────────────────────────────
  const pvChartData = useMemo(() => {
    const now = new Date();
    if (pvChartView === "days") {
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (29 - i));
        const ds = d.toISOString().slice(0, 10);
        return {
          label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          searches: pageViews.filter(p => p.created_at.slice(0, 10) === ds).length,
          views:    downloads.filter(p => p.created_at.slice(0, 10) === ds).length,
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
        searches: pageViews.filter(p => new Date(p.created_at) >= ws && new Date(p.created_at) < we).length,
        views:    downloads.filter(p => new Date(p.created_at) >= ws && new Date(p.created_at) < we).length,
        showLabel: true,
      };
    });
  }, [pageViews, downloads, pvChartView]);

  const topMax   = stats.topWords[0]?.count    || 1;
  const topDlMax = stats.topDownloaded[0]?.count || 1;
  const topPvMax = stats.topPages[0]?.count     || 1;

  return (
    <div className="am-page">
      <div className="am-wrapper">

        {/* Header */}
        <div className="am-header">
          <div className="am-header-left">
            <button className="am-back-btn" onClick={() => navigate(-1)}>
              <TbArrowLeft /> Back
            </button>
            <div>
              <h1 className="am-header-title">Site Monitor</h1>
              <p className="am-header-sub">
                {loading ? "Loading…" : `Refreshed ${timeAgo(lastRefreshed)} · ${searches.length.toLocaleString()} total records`}
              </p>
            </div>
          </div>
          <div className="am-header-actions">
            <Link to="/admin/feedback" className="am-link-btn">
              <TbMessageCircle /> Feedback inbox
            </Link>
            <button className="am-refresh-btn" onClick={load} disabled={loading}>
              <TbRefresh className={loading ? "am-spin" : ""} />
            </button>
          </div>
        </div>

        {loading ? <div className="am-loading">Loading monitor data…</div> : (
          <>
            {/* KPI band — one card, 6 stats with dividers */}
            <div className="am-kpi-band">
              <div className="am-kpi-item">
                <TbUsers className="am-kpi-item-icon" />
                <span className="am-kpi-item-value">{stats.totalUsers.toLocaleString()}</span>
                <span className="am-kpi-item-label">Registered Users</span>
              </div>
              <div className="am-kpi-item">
                <TbDatabase className="am-kpi-item-icon" />
                <span className="am-kpi-item-value">{wordCount.toLocaleString()}</span>
                <span className="am-kpi-item-label">Words in Dictionary</span>
              </div>
              <div className="am-kpi-item">
                <TbSearch className="am-kpi-item-icon" />
                <span className="am-kpi-item-value">{stats.totalSearches.toLocaleString()}</span>
                <span className="am-kpi-item-label">All-time Searches</span>
              </div>
              <div className="am-kpi-item">
                <TbMessageCircle className="am-kpi-item-icon" />
                <span className="am-kpi-item-value">{feedbackCount.toLocaleString()}</span>
                <span className="am-kpi-item-label">Feedback Received</span>
              </div>
              <div className="am-kpi-item">
                <TbPhoto className="am-kpi-item-icon" />
                <span className="am-kpi-item-value">{stats.totalDownloads.toLocaleString()}</span>
                <span className="am-kpi-item-label">Snippets Downloaded</span>
              </div>
              <div className="am-kpi-item">
                <TbClick className="am-kpi-item-icon" />
                <span className="am-kpi-item-value">{stats.totalPV.toLocaleString()}</span>
                <span className="am-kpi-item-label">Total Page Views</span>
              </div>
            </div>

            {/* Today at a glance — no boxes, just a text strip */}
            <div className="am-today-strip">
              <span className="am-today-label">Today</span>
              <span><b>{stats.todaySearches}</b> searches</span>
              <span className="am-today-sep">·</span>
              <span><b>{stats.todayViews}</b> word views</span>
              <span className="am-today-sep">·</span>
              <span><b>{stats.activeToday}</b> active users</span>
              <span className="am-today-sep">·</span>
              <span><b>{stats.todayDownloads}</b> downloads</span>
              <span className="am-today-sep">·</span>
              <span><b>{stats.todayPV}</b> page views</span>
            </div>

            {/* Activity */}
            <div className="am-section-card">
              <div className="am-section-head">
                <div>
                  <h2 className="am-section-title">Activity</h2>
                  <div className="am-section-legend">
                    <span className="am-legend-dot" style={{ background: "#3b82f6" }} />Searches
                    <span className="am-legend-dot" style={{ background: "#10b981" }} />Word views
                  </div>
                </div>
                <div className="chart-timeframe-toggle">
                  <button className={`chart-timeframe-btn${chartView === "days"  ? " active" : ""}`} onClick={() => setChartView("days")}>Days</button>
                  <button className={`chart-timeframe-btn${chartView === "weeks" ? " active" : ""}`} onClick={() => setChartView("weeks")}>Weeks</button>
                </div>
              </div>
              <div className="am-stat-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                <div className="am-stat-item">
                  <span className="am-stat-value">{stats.thisWeekS}</span>
                  <span className="am-stat-label">Searches this week</span>
                  <Trend value={stats.weekTrend} />
                </div>
                <div className="am-stat-item">
                  <span className="am-stat-value">{stats.avgDailySearches}</span>
                  <span className="am-stat-label">Avg daily (30d)</span>
                </div>
                <div className="am-stat-item">
                  <span className="am-stat-value">{stats.activeThisWeek}</span>
                  <span className="am-stat-label">Active users this week</span>
                </div>
                <div className="am-stat-item">
                  <span className="am-stat-value">{stats.newUsersThisWeek}</span>
                  <span className="am-stat-label">New users this week</span>
                </div>
              </div>
              <div className="am-chart-wrap">
                <DualLineChart data={chartData} />
              </div>
            </div>

            {/* Downloads */}
            <div className="am-section-card">
              <div className="am-section-head">
                <h2 className="am-section-title">Snippet Downloads</h2>
              </div>
              <div className="am-stat-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div className="am-stat-item">
                  <span className="am-stat-value">{stats.thisWeekDl}</span>
                  <span className="am-stat-label">This week</span>
                  <Trend value={stats.dlWeekTrend} />
                </div>
                <div className="am-stat-item">
                  <span className="am-stat-value">{stats.avgDailyDownloads}</span>
                  <span className="am-stat-label">Avg daily (30d)</span>
                </div>
                <div className="am-stat-item">
                  <span className="am-stat-value">{stats.totalDownloads.toLocaleString()}</span>
                  <span className="am-stat-label">All time</span>
                </div>
              </div>
              {stats.topDownloaded.length > 0 && (
                <div className="am-section-body">
                  <p className="am-section-sub">Most downloaded words</p>
                  <div className="am-top-words">
                    {stats.topDownloaded.map(({ word, count }, i) => (
                      <div key={word} className="am-top-word-row">
                        <span className="am-top-word-rank">#{i + 1}</span>
                        <Link to={`/word/${encodeURIComponent(word)}`} className="am-top-word-name">{word}</Link>
                        <div className="am-top-word-bar-track">
                          <div className="am-top-word-bar" style={{ width: `${(count / topDlMax) * 100}%` }} />
                        </div>
                        <span className="am-top-word-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Page Views */}
            <div className="am-section-card">
              <div className="am-section-head">
                <div>
                  <h2 className="am-section-title">Page Views</h2>
                  <div className="am-section-legend">
                    <span className="am-legend-dot" style={{ background: "#f472b6" }} />Page views
                    <span className="am-legend-dot" style={{ background: "#10b981" }} />Downloads
                  </div>
                </div>
                <div className="chart-timeframe-toggle">
                  <button className={`chart-timeframe-btn${pvChartView === "days"  ? " active" : ""}`} onClick={() => setPvChartView("days")}>Days</button>
                  <button className={`chart-timeframe-btn${pvChartView === "weeks" ? " active" : ""}`} onClick={() => setPvChartView("weeks")}>Weeks</button>
                </div>
              </div>
              <div className="am-stat-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div className="am-stat-item">
                  <span className="am-stat-value">{stats.thisWeekPV}</span>
                  <span className="am-stat-label">This week</span>
                  <Trend value={stats.pvWeekTrend} />
                </div>
                <div className="am-stat-item">
                  <span className="am-stat-value">{stats.avgDailyPV}</span>
                  <span className="am-stat-label">Avg daily (30d)</span>
                </div>
                <div className="am-stat-item">
                  <span className="am-stat-value">{stats.totalPV.toLocaleString()}</span>
                  <span className="am-stat-label">All time</span>
                </div>
              </div>
              <div className="am-chart-wrap">
                <DualLineChart data={pvChartData} />
              </div>
              {stats.topPages.length > 0 && (
                <div className="am-section-body">
                  <p className="am-section-sub">Most visited pages</p>
                  <div className="am-top-words">
                    {stats.topPages.map(({ path, count }, i) => (
                      <div key={path} className="am-top-word-row">
                        <span className="am-top-word-rank">#{i + 1}</span>
                        <span className="am-top-word-name" style={{ color: "var(--text-2)", textTransform: "none" }}>{path}</span>
                        <div className="am-top-word-bar-track">
                          <div className="am-top-word-bar" style={{ width: `${(count / topPvMax) * 100}%` }} />
                        </div>
                        <span className="am-top-word-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Top searched words */}
            <div className="am-section-card">
              <div className="am-section-head">
                <h2 className="am-section-title">Top 10 Searched Words</h2>
              </div>
              <div className="am-section-body" style={{ paddingTop: 0 }}>
                {stats.topWords.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>No search data yet.</p>
                ) : (
                  <div className="am-top-words">
                    {stats.topWords.map(({ word, count }, i) => (
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
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
