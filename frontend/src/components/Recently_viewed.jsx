import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

function Recently_viewed() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data = [] } = useQuery({
    queryKey: ["recently-viewed", user?.email],
    queryFn: async () => {
      const { data: fetched } = await supabase
        .from("searches")
        .select("word")
        .eq("email", user.email)
        .order("created_at", { ascending: false })
        .limit(20);

      const seen = new Set();
      const unique = [];
      for (const item of fetched || []) {
        if (!seen.has(item.word)) {
          seen.add(item.word);
          unique.push(item.word);
        }
        if (unique.length === 5) break;
      }
      return unique;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="recent-searches-sidebar">
      <h2 className="recent-searches-title">recent searches</h2>
      <ol>
        {data.map((word, index) => (
          <li key={index} onClick={() => navigate(`/word/${word}`)}>
            {word}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default Recently_viewed;
