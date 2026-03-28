import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

async function fetchTrending(timeFrame) {
  const startDate = new Date();
  if (timeFrame === "24h") startDate.setHours(startDate.getHours() - 24);
  else if (timeFrame === "7d") startDate.setDate(startDate.getDate() - 7);
  else if (timeFrame === "30d") startDate.setDate(startDate.getDate() - 30);

  const { data, error } = await supabase
    .from("searches")
    .select("word")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", new Date().toISOString());

  if (error) throw new Error(error.message);

  const counts = data.reduce((acc, row) => {
    acc[row.word] = (acc[row.word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function Trending() {
  const navigate = useNavigate();
  const [timeFrame, setTimeFrame] = useState("24h");

  const { data: wordCounts = [], isLoading } = useQuery({
    queryKey: ["trending", timeFrame],
    queryFn: () => fetchTrending(timeFrame),
    staleTime: 5 * 60 * 1000, // cache 5 minutes per timeframe
  });

  return (
    <div className="trending-main-container">
      <div className="trending-header">
        <h2 className="trending-title">Trending Searches</h2>
        <p className="trending-subtitle">Most looked-up words by our users</p>
      </div>

      <div className="timeframe-buttons">
        {[
          { value: "24h", label: "24 hours" },
          { value: "7d",  label: "7 days"   },
          { value: "30d", label: "30 days"  },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTimeFrame(value)}
            className={timeFrame === value ? "active timeframe-btn" : "timeframe-btn"}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loader />
      ) : wordCounts.length === 0 ? (
        <p className="trending-empty">No searches recorded in this period.</p>
      ) : (
        <ol className="trending-word-list">
          {wordCounts.map((item, index) => (
            <li
              key={index}
              className="trending-word-item"
              onClick={() => navigate(`/word/${encodeURIComponent(item.word)}`)}
            >
              <span className="trending-rank">#{index + 1}</span>
              <span className="trending-word">{item.word}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default Trending;
