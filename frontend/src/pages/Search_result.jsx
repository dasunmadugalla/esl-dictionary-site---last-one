import React, { useContext } from "react";
import { Helmet } from "react-helmet-async";
import { TbArrowLeft } from "react-icons/tb";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Word_container from "../components/Word_container";
import { supabase } from "../lib/supabase";
import { IPContext } from "../context/IPContext";
import Recently_viewed from "../components/Recently_viewed";
import WordSkeleton from "../components/WordSkeleton";
import Searchbar from "../components/Searchbar";

function Search_result() {
  const { ip } = useContext(IPContext);
  const { search } = useParams();
  const location = useLocation();
  const navigate = useNavigate();


  const { data: searchResult, isLoading, error } = useQuery({
    queryKey: ["word", search],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${ip}/word/${encodeURIComponent(search)}`, { headers });

      if (res.status === 404) {
        const err = new Error(`"${search}" doesn't appear to be a valid English word.`);
        err.status = 404;
        throw err;
      }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      // Only record history after confirmed valid word
      if (token) {
        const type = location.state?.fromSearch ? "search" : "view";
        fetch(`${ip}/search/add-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ word: search, type }),
        }).catch(() => {});
      }

      return res.json();
    },
    enabled: !!search && !!ip,
    staleTime: 10 * 60 * 1000, // word definitions don't change — cache 10 mins
  });

  const { data: suggestions } = useQuery({
    queryKey: ["suggestions", search],
    queryFn: async () => {
      const [spRes, slRes] = await Promise.all([
        fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(search)}&max=10`),
        fetch(`https://api.datamuse.com/words?sl=${encodeURIComponent(search)}&max=10`),
      ]);
      const [spData, slData] = await Promise.all([spRes.json(), slRes.json()]);

      // deduplicate candidates
      const seen = new Set();
      const candidates = [];
      for (const w of [...spData, ...slData]) {
        if (!seen.has(w.word)) {
          seen.add(w.word);
          candidates.push(w.word);
        }
      }

      // validate each candidate against Free Dictionary API in parallel
      const results = await Promise.all(
        candidates.map(async (word) => {
          try {
            const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            return r.status === 200 ? word : null;
          } catch {
            return null;
          }
        })
      );

      return results.filter(Boolean).slice(0, 5);
    },
    enabled: !!search && error?.status === 404,
    staleTime: 5 * 60 * 1000,
  });

  const renderContent = () => {
    if (isLoading) return <WordSkeleton />;

    if (error) {
      if (error.status === 404) {
        return (
          <div className="word-not-found-wrapper">
            <button className="word-not-found-back" onClick={() => navigate(-1)}>
              <TbArrowLeft />
            </button>
            <div className="word-not-found">
              <div className="word-not-found-term">{search}</div>
              <div className="word-not-found-divider" />
              <p className="word-not-found-title">Not a valid word</p>
              <p className="word-not-found-sub">
                We couldn't find <strong>"{search}"</strong> in the dictionary. Check your spelling and try again.
              </p>
              {suggestions?.length > 0 && (
                <div className="word-not-found-suggestions">
                  <p className="word-not-found-suggestions-label">Did you mean?</p>
                  <div className="word-not-found-suggestions-list">
                    {suggestions.map((word) => (
                      <button
                        key={word}
                        className="word-not-found-suggestion-chip"
                        onClick={() => navigate(`/word/${encodeURIComponent(word)}`)}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
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

  const capitalised = search
    ? search.charAt(0).toUpperCase() + search.slice(1).toLowerCase()
    : "";

  const metaDescription = searchResult
    ? `${capitalised} — ${searchResult.meanings?.[0]?.definition ?? "Look up the definition, examples, and more on Grasperr."}`
    : `Look up "${capitalised}" on Grasperr — the ESL dictionary built for English learners.`;

  return (
    <>
      <Helmet>
        <title>{capitalised ? `${capitalised} - Grasperr Dictionary` : "Grasperr"}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${capitalised} - Grasperr Dictionary`} />
        <meta property="og:description" content={metaDescription} />
      </Helmet>
      <div className="search-result-page">
        <div className="middle-container">
          <div className="input-wrapper">
            <Searchbar />
          </div>
          {renderContent()}
        </div>
        {!isLoading && <Recently_viewed />}
      </div>
    </>
  );
}

export default Search_result;
