import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Word_container from "../components/Word_container";
import { supabase } from "../lib/supabase";
import { IPContext } from "../context/IPContext";
import Recently_viewed from "../components/Recently_viewed";
import WordSkeleton from "../components/WordSkeleton";
import Searchbar from "../components/Searchbar";

function Search_result() {
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { ip } = useContext(IPContext);
  const { search } = useParams();

  useEffect(() => {
    if (!search) return;

    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          setError("You must be logged in to search words.");
          setSearchResult(null);
          return;
        }

        const res = await fetch(
          `${ip}:3000/word/${encodeURIComponent(search)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();
        setSearchResult(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Something went wrong. Please try again.");
        setSearchResult(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [search]);

  // ── Content slot ──────────────────────────────────────────────────────────
  // Searchbar always stays rendered. Only the content below it swaps.

  const renderContent = () => {
    if (loading) {
      return <WordSkeleton />;
    }

    if (error) {
      return (
        <div className="srch-wrapper">
          <p className="result-error">{error}</p>
        </div>
      );
    }

    if (!searchResult) {
      return (
        <div className="srch-wrapper">
          <p className="result-empty">No results found for "{search}".</p>
        </div>
      );
    }

    return <Word_container details={searchResult} />;
  };

  return (
    <div className="search_result-main">
      <div className="middle-container">
        <div className="input-wrapper">
          <Searchbar />
        </div>
        {renderContent()}
      </div>
      {!loading && <Recently_viewed />}
    </div>
  );
}

export default Search_result;