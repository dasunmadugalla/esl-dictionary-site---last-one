import React, { useContext, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Word_container from "../components/Word_container";
import { supabase } from "../lib/supabase";
import { IPContext } from "../context/IPContext";
import Recently_viewed from "../components/Recently_viewed";
import WordSkeleton from "../components/WordSkeleton";
import Searchbar from "../components/Searchbar";
import { useAuth } from "../context/AuthContext";

function Search_result() {
  const { ip } = useContext(IPContext);
  const { search } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  // Track word views (clicks) — only when not arriving from the searchbar
  useEffect(() => {
    if (!user?.email || !search || !ip || location.state?.fromSearch) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token;
      if (!token) return;
      fetch(`${ip}/search/add-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ word: search, type: "view" }),
      }).catch(() => {});
    });
  }, [search, ip, user, location.state?.fromSearch]);

  const { data: searchResult, isLoading, error } = useQuery({
    queryKey: ["word", search],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${ip}/word/${encodeURIComponent(search)}`, { headers });

      if (res.status === 404) throw new Error(`"${search}" doesn't appear to be a valid English word.`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    },
    enabled: !!search && !!ip,
    staleTime: 10 * 60 * 1000, // word definitions don't change — cache 10 mins
  });

  const renderContent = () => {
    if (isLoading) return <WordSkeleton />;

    if (error) {
      return (
        <div className="word-result-wrapper">
          <p className="result-error">{error.message}</p>
        </div>
      );
    }

    if (!searchResult) {
      return (
        <div className="word-result-wrapper">
          <p className="result-empty">No results found for "{search}".</p>
        </div>
      );
    }

    return <Word_container details={searchResult} />;
  };

  return (
    <div className="search-result-page">
      <div className="middle-container">
        <div className="input-wrapper">
          <Searchbar />
        </div>
        {renderContent()}
      </div>
      {!isLoading && <Recently_viewed />}
    </div>
  );
}

export default Search_result;
