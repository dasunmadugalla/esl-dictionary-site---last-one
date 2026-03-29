import React, { useState, useEffect, useContext } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { TbStarFilled, TbCards, TbBrain } from "react-icons/tb";
import Loader from "../components/Loader.jsx";
import Lexicaldata from "../components/Lexicaldata.jsx";
import { IPContext } from "../context/IPContext";
import { useToast } from "../context/ToastContext.jsx";

function Bookmarks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { ip } = useContext(IPContext);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bookmarkData, setBookmarkdata] = useState([]);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("az");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [removingIds, setRemovingIds] = useState([]);

  useEffect(() => {
    setLoading(true);
    if (!user) return;

    const fetchData = async () => {
      const { data, error: db_error } = await supabase
        .from("Bookmarks")
        .select("wordIDs, created_at")
        .eq("email", user.email);

      if (db_error) {
        setError(db_error);
        console.log(error);
        return;
      }

      const wordIDs = data.map((item) => item.wordIDs);

      const { data: words, error: wordDB_error } = await supabase
        .from("Words")
        .select("*")
        .in("word", wordIDs);

      if (wordDB_error) {
        console.log(wordDB_error);
        return;
      }

      const merged = words.map((word) => {
        const bookmark = data.find((b) => b.wordIDs === word.word);
        return {
          ...word,
          created_at: bookmark?.created_at,
        };
      });

      setBookmarkdata(merged);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  // 🔥 REMOVE WITH ANIMATION
  async function toggleBookmark(wordID) {
    if (!user) return;

    // Optimistic — animate out immediately
    const removed = bookmarkData.find((item) => item.word === wordID);
    setRemovingIds((prev) => [...prev, wordID]);
    setTimeout(() => {
      setBookmarkdata((prev) => prev.filter((item) => item.word !== wordID));
      setRemovingIds((prev) => prev.filter((id) => id !== wordID));
    }, 300);

    try {
      const res = await fetch(`${ip}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, wordID: wordID }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch (err) {
      if (removed) setBookmarkdata((prev) => [...prev, removed]);
      setRemovingIds((prev) => prev.filter((id) => id !== wordID));
      showToast("Failed to remove bookmark. Try again.");
    }
  }

  const FREQUENCIES = ["all", "essential", "common", "intermediate", "advanced", "rare"];

  const filteredData = frequencyFilter === "all"
    ? bookmarkData
    : bookmarkData.filter((w) => w.frequency?.toLowerCase() === frequencyFilter);

  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case "az":  return a.word.localeCompare(b.word);
      case "za":  return b.word.localeCompare(a.word);
      case "recent":  return new Date(b.created_at) - new Date(a.created_at);
      case "oldest":  return new Date(a.created_at) - new Date(b.created_at);
      default: return 0;
    }
  });

  return (
    <div className="bookmarks-main-container">
      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="bookmarks-wrapper">
            <div className="bookmarks-header">
              <h2 className="bookmarks-title">Bookmarks</h2>
              <span className="bookmarks-count">{bookmarkData.length}</span>
              {bookmarkData.length > 0 && (
                <>
                  <button
                    className="fc-practice-btn"
                    onClick={() => navigate("/flashcards?source=bookmarks")}
                  >
                    <TbCards /> Practice
                  </button>
                  <button
                    className="fc-practice-btn fc-practice-btn--review"
                    onClick={() => navigate("/review?source=bookmarks")}
                  >
                    <TbBrain /> Review
                  </button>
                </>
              )}
            </div>

            <div className="bookmark-controls">
              <div className="sort-controls">
                <button
                  className={sortBy === "az" ? "active" : ""}
                  onClick={() => setSortBy("az")}
                >
                  A → Z
                </button>
                <button
                  className={sortBy === "za" ? "active" : ""}
                  onClick={() => setSortBy("za")}
                >
                  Z → A
                </button>
                <button
                  className={sortBy === "recent" ? "active" : ""}
                  onClick={() => setSortBy("recent")}
                >
                  Recent
                </button>
                <button
                  className={sortBy === "oldest" ? "active" : ""}
                  onClick={() => setSortBy("oldest")}
                >
                  Oldest
                </button>
              </div>

              <div className="frequency-filter" onBlur={() => setDropdownOpen(false)} tabIndex={0}>
                <div className="frequency-filter-selected" onClick={() => setDropdownOpen((p) => !p)}>
                  <span>{frequencyFilter.charAt(0).toUpperCase() + frequencyFilter.slice(1)}</span>
                  <span className={`frequency-filter-arrow ${dropdownOpen ? "open" : ""}`}>▾</span>
                </div>
                {dropdownOpen && (
                  <ul className="frequency-filter-list">
                    {FREQUENCIES.map((freq) => (
                      <li
                        key={freq}
                        className={`frequency-filter-option ${frequencyFilter === freq ? "active" : ""}`}
                        onMouseDown={() => { setFrequencyFilter(freq); setDropdownOpen(false); }}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {sortedData.map((row) => (
              <div
                className={`bookmark-card ${
                  removingIds.includes(row.word) ? "removing" : ""
                }`}
                key={row.word}
                onClick={() =>
                  navigate(`/word/${encodeURIComponent(row.word)}`)
                }
              >
                <div className="bookmark-content">
                  <h1 className="bookmark-word">{row.word}</h1>

                  <div className="bookmark-bottom-bar">
                    <Lexicaldata data={row} />
                  </div>
                </div>

                <button
                  className="bookmark-btn interaction-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // ❗ prevent navigation
                    toggleBookmark(row.word);
                  }}
                >
                  <TbStarFilled className="interaction-icon bookmark-star" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Bookmarks;
