import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

function Recently_viewed() {
  const { user } = useAuth();
  const [data, setData] = useState([]);

  const navigate = useNavigate();

  const handleClick = (word) => {
    navigate(`/word/${word}`);
  };

useEffect(() => {
  if (!user) return;

  const fetch_recentWords = async () => {
    const { data: fetchedData, error } = await supabase
      .from("searches")
      .select("word, created_at")
      .eq("email", user.email)
      .order("created_at", { ascending: false }) // 🔥 newest first
      .limit(20); // get more to handle duplicates

    if (error) {
      console.log(error);
    } else {
      console.log(fetchedData);

      // remove duplicates while keeping order
      const seen = new Set();
      const uniqueWords = [];

      for (let item of fetchedData) {
        if (!seen.has(item.word)) {
          seen.add(item.word);
          uniqueWords.push(item.word);
        }
        if (uniqueWords.length === 5) break;
      }

      setData(uniqueWords);
    }
  };

  fetch_recentWords();
}, [user]);

  return (
    <div className="recentViewed-wrapper">
      <h2 className="recentViewed-title">recent searches</h2>
      <ol>
        {data.map((word, index) => (
          <li key={index} onClick={() => handleClick(word)}>
            {word}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default Recently_viewed;
