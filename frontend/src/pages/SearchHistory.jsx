import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";
import { TbExternalLink, TbSearch, TbEye } from "react-icons/tb";
import Loader from "../components/Loader.jsx";
import "../styles/searchHistory.css";

function groupByDate(searches) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const groups = [];
  const map = new Map();

  for (const item of searches) {
    const dateStr = item.created_at.slice(0, 10);
    let label;
    if (dateStr === today) label = "Today";
    else if (dateStr === yesterday) label = "Yesterday";
    else
      label = new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

    if (!map.has(label)) {
      map.set(label, []);
      groups.push({ label, items: map.get(label) });
    }
    map.get(label).push(item);
  }

  return groups;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SearchHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("searches");
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("searches")
        .select("word, created_at, type")
        .eq("email", user.email)
        .order("created_at", { ascending: false });

      setAllData(data || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <Loader />;

  const filtered = activeTab === "searches"
    ? allData.filter((r) => r.type === "search" || !r.type)
    : allData;

  const groups = groupByDate(filtered);
  const total = filtered.length;

  return (
    <div className="sh-container">
      <div className="sh-header">
        <h1 className="sh-title">History</h1>
        <p className="sh-subtitle">{total} {activeTab === "searches" ? "searches" : "entries"} total</p>
      </div>

      <div className="sh-tabs">
        <button
          className={`sh-tab${activeTab === "searches" ? " sh-tab--active" : ""}`}
          onClick={() => setActiveTab("searches")}
        >
          <TbSearch /> Searches
        </button>
        <button
          className={`sh-tab${activeTab === "all" ? " sh-tab--active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <TbEye /> All History
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="sh-empty">
          <TbSearch className="sh-empty-icon" />
          <p>{activeTab === "searches" ? "No searches yet. Start exploring words!" : "No history yet."}</p>
        </div>
      ) : (
        <div className="sh-groups">
          {groups.map((group) => (
            <div key={group.label} className="sh-group">
              <div className="sh-group-label">{group.label}</div>
              <div className="sh-group-items">
                {group.items.map((item, i) => (
                  <div
                    key={i}
                    className="sh-item"
                    onClick={() => navigate(`/word/${encodeURIComponent(item.word)}`)}
                  >
                    <div className="sh-item-left">
                      {activeTab === "all" && (
                        <span className={`sh-type-badge sh-type-badge--${item.type === "view" ? "view" : "search"}`}>
                          {item.type === "view" ? <TbEye /> : <TbSearch />}
                        </span>
                      )}
                      <span className="sh-word">{item.word}</span>
                    </div>
                    <div className="sh-item-right">
                      <span className="sh-time">{formatTime(item.created_at)}</span>
                      <TbExternalLink className="sh-link-icon" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
