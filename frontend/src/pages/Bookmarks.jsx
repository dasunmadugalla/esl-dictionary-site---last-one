import React, { useState, useEffect, useContext } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { TbStarFilled } from "react-icons/tb";
import Loader from "../components/Loader.jsx";
import Lexicaldata from "../components/Lexicaldata.jsx";
import { IPContext } from "../context/IPContext";

function Bookmarks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {ip} = useContext(IPContext)
  const [loading, setLoading] = useState(false);
  const [bookmarkData, setBookmarkdata] = useState([]);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("az");
  const [removingIds, setRemovingIds] = useState([]); // 🔥 animation state

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
    if (!user) {
      alert("You must be logged in.");
      return;
    }

    try {
      // 🔥 trigger animation
      setRemovingIds((prev) => [...prev, wordID]);

      // 🔥 wait for animation to finish
      setTimeout(() => {
        setBookmarkdata((prev) => prev.filter((item) => item.word !== wordID));

        // cleanup
        setRemovingIds((prev) => prev.filter((id) => id !== wordID));
      }, 300); // must match CSS transition

      const res = await fetch(`${ip}:3000/bookmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          wordID: wordID,
        }),
      });

      const data = await res.json();
    } catch (err) {
      console.error(err);
    }
  }

  // 🔥 SORTING
  const sortedData = [...bookmarkData].sort((a, b) => {
    switch (sortBy) {
      case "az":
        return a.word.localeCompare(b.word);
      case "za":
        return b.word.localeCompare(a.word);
      case "recent":
        return new Date(b.created_at) - new Date(a.created_at);
      case "oldest":
        return new Date(a.created_at) - new Date(b.created_at);
      default:
        return 0;
    }
  });

  return (
    <div className="bookmarks-main-container">
      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="bookmarks-wrapper">
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

            {sortedData.map((row, index) => (
              <div
                className={`bookmark-card ${
                  removingIds.includes(row.word) ? "removing" : ""
                }`}
                key={index}
                onClick={() =>
                  navigate(`/word/${encodeURIComponent(row.word)}`)
                }
              >
                <div className="bookmark-content">
                  <h1 className="bk-word">{row.word}</h1>

                  <div className="bookmark-bottom-bar">
                    <Lexicaldata data={row} />
                  </div>
                </div>

                <button
                  className="bookmark-btn interation-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // ❗ prevent navigation
                    toggleBookmark(row.word);
                  }}
                >
                  <TbStarFilled className="interaction-icon bk-star" />
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
