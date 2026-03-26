// Trending.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Loader from "../components/Loader";

function Trending() {
  const [wordCounts, setWordCounts] = useState([]);
  const [timeFrame, setTimeFrame] = useState("24h"); // default: last 24 hours
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTopWords = async () => {
      setLoading(true);

      let startDate = new Date();

      if (timeFrame === "24h") {
        startDate.setHours(startDate.getHours() - 24);
      } else if (timeFrame === "7d") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeFrame === "30d") {
        startDate.setDate(startDate.getDate() - 30);
      }

      const startISO = startDate.toISOString();
      const endISO = new Date().toISOString();

      const { data, error } = await supabase
        .from("searches")
        .select("word")
        .gte("created_at", startISO)
        .lte("created_at", endISO);

      if (error) {
        console.error("Supabase error:", error);
        setWordCounts([]);
        setLoading(false);
        return;
      }

      // Count occurrences of each word
      const counts = data.reduce((acc, row) => {
        acc[row.word] = (acc[row.word] || 0) + 1;
        return acc;
      }, {});

      // Convert to array and sort descending
      const sortedCounts = Object.entries(counts)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count);

      // Take top 10
      setWordCounts(sortedCounts.slice(0, 10));
      setLoading(false);
    };

    fetchTopWords();
  }, [timeFrame]);

  return (
    <div className="trending-main-container">
      {loading ? (
        <Loader />
      ) : (
        <>
          <h2>Trending Searches.</h2>

          {/* Time frame buttons */}
          <div className="timeframe-buttons" style={{ marginBottom: "10px" }}>
            <button
              onClick={() => setTimeFrame("24h")}
              className={timeFrame === "24h" ? "active timeframeBtn" : "timeframeBtn"}
            >
              Last 24 hours
            </button>
            <button
              onClick={() => setTimeFrame("7d")}
              className={timeFrame === "7d" ? "active timeframeBtn" : "timeframeBtn"}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setTimeFrame("30d")}
              className={timeFrame === "30d" ? "active timeframeBtn" : "timeframeBtn"}
            >
              Last 30 days
            </button>
          </div>

          {wordCounts.length === 0 ? (
            <p>No words searched yet in this period.</p>
          ) : (
            <ol className="trnd-word-wrapper">
              {wordCounts.map((item, index) => (
                <li key={index} className="trnd-word-item">
                  {item.word}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

export default Trending;
