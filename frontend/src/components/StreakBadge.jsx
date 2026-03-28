import React from "react";
import { TbFlame } from "react-icons/tb";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

function calculateStreak(data) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const uniqueDates = [...new Set(data.map((s) => s.created_at.slice(0, 10)))]
    .sort((a, b) => b.localeCompare(a));

  if (!uniqueDates.length || (uniqueDates[0] !== today && uniqueDates[0] !== yesterday)) return 0;

  let count = 0;
  let expected = uniqueDates[0];
  for (const date of uniqueDates) {
    if (date === expected) {
      count++;
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toISOString().slice(0, 10);
    } else break;
  }
  return count;
}

function StreakBadge() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: streak = 0 } = useQuery({
    queryKey: ["streak", user?.email],
    queryFn: async () => {
      // only fetch last 90 days — streak can never exceed that window
      const since = new Date(Date.now() - 90 * 86400000).toISOString();
      const { data } = await supabase
        .from("searches")
        .select("created_at")
        .eq("email", user.email)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      return calculateStreak(data || []);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (!user || streak === 0) return null;

  return (
    <div className="streak-badge" onClick={() => navigate("/dashboard")}>
      <TbFlame className="streak-badge-icon" />
      <span className="streak-badge-number">{streak}</span>
      <span className="streak-badge-label">day streak</span>
    </div>
  );
}

export default StreakBadge;
