import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Searchbar from "../components/Searchbar";

const EXAMPLE_WORDS = [
  "ephemeral",
  "resilience",
  "serendipity",
  "eloquent",
  "perseverance",
  "ambiguous",
  "melancholy",
];

async function fetchTopTrending() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data } = await supabase
    .from("searches")
    .select("word")
    .gte("created_at", since);

  if (!data || data.length === 0) return [];

  const counts = data.reduce((acc, row) => {
    acc[row.word] = (acc[row.word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((item) => item.word);
}

function AnimatedPlaceholder({ inputRef }) {
  const [placeholder, setPlaceholder] = useState("");
  const wordIndex = useRef(0);
  const charIndex = useRef(0);
  const deleting = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const type = () => {
      const word = EXAMPLE_WORDS[wordIndex.current];

      if (!deleting.current) {
        charIndex.current++;
        setPlaceholder(word.slice(0, charIndex.current));

        if (charIndex.current === word.length) {
          deleting.current = true;
          timeoutRef.current = setTimeout(type, 1400);
        } else {
          timeoutRef.current = setTimeout(type, 80);
        }
      } else {
        charIndex.current--;
        setPlaceholder(word.slice(0, charIndex.current));

        if (charIndex.current === 0) {
          deleting.current = false;
          wordIndex.current = (wordIndex.current + 1) % EXAMPLE_WORDS.length;
          timeoutRef.current = setTimeout(type, 350);
        } else {
          timeoutRef.current = setTimeout(type, 45);
        }
      }
    };

    timeoutRef.current = setTimeout(type, 600);
    return () => clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (inputRef?.current) {
      inputRef.current.placeholder = placeholder
        ? `Try "${placeholder}"`
        : "Type your word here";
    }
  }, [placeholder, inputRef]);

  return null;
}

function Home() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const { data: trendingWords = [] } = useQuery({
    queryKey: ["trending-home"],
    queryFn: fetchTopTrending,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="home-main">
      <div className="home-container">
        <div className="home-tagline">
          <h1 className="home-title">ESL Online Dictionary</h1>
          <p className="home-subtitle">
            Clear, plain-English definitions anyone can understand.
          </p>
        </div>

        <AnimatedPlaceholder inputRef={inputRef} />
        <Searchbar externalInputRef={inputRef} />

        {trendingWords.length > 0 && (
          <div className="home-trending-chips">
            <span className="home-trending-label">Trending</span>
            {trendingWords.map((word) => (
              <button
                key={word}
                className="home-chip"
                onClick={() => navigate(`/word/${encodeURIComponent(word)}`)}
              >
                {word}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
