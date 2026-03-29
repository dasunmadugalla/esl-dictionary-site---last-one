import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";
import { TbArrowLeft, TbCheck, TbRefresh, TbX, TbCards } from "react-icons/tb";
import Loader from "../components/Loader.jsx";
import "../styles/flashcards.css";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Flashcards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const source = params.get("source");
  const collectionId = params.get("id");

  const [allWords, setAllWords] = useState([]);   // full loaded set
  const [words, setWords] = useState([]);          // active session set
  const [deck, setDeck] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState([]);
  const [learning, setLearning] = useState([]);
  const [phase, setPhase] = useState("loading");  // loading|empty|setup|playing|results
  const [title, setTitle] = useState("");
  const [retryMode, setRetryMode] = useState(false);

  // ── Load words ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      let wordIds = [];

      if (source === "bookmarks") {
        setTitle("Bookmarks");
        const { data } = await supabase
          .from("Bookmarks").select("wordIDs").eq("email", user.email);
        wordIds = (data || []).map((b) => b.wordIDs);
      } else if (source === "collection" && collectionId) {
        const [{ data: col }, { data: cw }] = await Promise.all([
          supabase.from("Collections").select("name").eq("id", collectionId).single(),
          supabase.from("CollectionWords").select("word")
            .eq("collection_id", collectionId).eq("email", user.email),
        ]);
        setTitle(col?.name || "Collection");
        wordIds = (cw || []).map((r) => r.word);
      }

      if (wordIds.length === 0) { setPhase("empty"); return; }

      const { data: wordData } = await supabase
        .from("Words")
        .select("word, definitions, frequency, complexity, register")
        .in("word", wordIds);

      const valid = (wordData || []).filter((w) => w.definitions?.[0]?.definition);
      if (valid.length === 0) { setPhase("empty"); return; }

      setAllWords(valid);
      setPhase("setup");
    })();
  }, [user, source, collectionId]);

  // ── Start session with chosen count ────────────────────────
  function startSession(count, wordsPool = allWords) {
    const shuffled = shuffle(wordsPool);
    const selected = count === "all" ? shuffled : shuffled.slice(0, count);
    setWords(selected);
    setDeck(selected.map((_, i) => i));
    setCurrent(0);
    setFlipped(false);
    setKnown([]);
    setLearning([]);
    setPhase("playing");
  }

  // ── Actions ─────────────────────────────────────────────────
  const card = words[deck[current]];

  const handleKnow = useCallback(() => {
    if (!flipped || !card) return;
    setKnown((prev) => [...prev, card.word]);
    const next = current + 1;
    if (next >= deck.length) setPhase("results");
    else { setCurrent(next); setFlipped(false); }
  }, [flipped, card, current, deck.length]);

  const handleLearning = useCallback(() => {
    if (!flipped || !card) return;
    setLearning((prev) => [...prev, card.word]);
    const next = current + 1;
    if (next >= deck.length) setPhase("results");
    else { setCurrent(next); setFlipped(false); }
  }, [flipped, card, current, deck.length]);

  const handleFlip = useCallback(() => {
    if (!flipped) setFlipped(true);
  }, [flipped]);

  function advance() {
    if (current + 1 >= deck.length) {
      setPhase("results");
    } else {
      setCurrent((c) => c + 1);
      setFlipped(false);
    }
  }

  function retryLearning() {
    const learningWords = allWords.filter((w) => learning.includes(w.word));
    setRetryMode(true);
    startSession("all", learningWords);
  }

  function restartFull() {
    setRetryMode(false);
    setPhase("setup");
  }

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    const handler = (e) => {
      if (e.code === "Space")       { e.preventDefault(); handleFlip(); }
      if (e.code === "ArrowRight")  { e.preventDefault(); handleKnow(); }
      if (e.code === "ArrowLeft")   { e.preventDefault(); handleLearning(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleFlip, handleKnow, handleLearning]);

  // ── Render phases ───────────────────────────────────────────
  if (phase === "loading") return <Loader />;

  if (phase === "empty") return (
    <div className="fc-container">
      <button className="fc-back-btn" onClick={() => navigate(-1)}>
        <TbArrowLeft /> Back
      </button>
      <div className="fc-empty">
        <p>No words to practice yet.</p>
        <p className="fc-empty-sub">Add some bookmarks or words to a collection first.</p>
      </div>
    </div>
  );

  if (phase === "setup") {
    const counts = [5, 10, 20].filter((n) => n < allWords.length);
    return (
      <div className="fc-container">
        <button className="fc-back-btn" onClick={() => navigate(-1)}>
          <TbArrowLeft /> Back
        </button>
        <div className="fc-setup">
          <TbCards className="fc-setup-icon" />
          <h2 className="fc-setup-title">{title}</h2>
          <p className="fc-setup-sub">{allWords.length} words available</p>
          <p className="fc-setup-label">How many cards do you want to practice?</p>
          <div className="fc-setup-options">
            {counts.map((n) => (
              <button key={n} className="fc-setup-btn" onClick={() => startSession(n)}>
                {n} cards
              </button>
            ))}
            <button className="fc-setup-btn fc-setup-btn--all" onClick={() => startSession("all")}>
              All {allWords.length}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "results") return (
    <div className="fc-container">
      <button className="fc-back-btn" onClick={() => navigate(-1)}>
        <TbArrowLeft /> Back
      </button>
      <div className="fc-results">
        <h2 className="fc-results-title">{retryMode ? "Retry complete" : "Session complete"}</h2>
        <p className="fc-results-sub">{title}</p>

        <div className="fc-results-stats">
          <div className="fc-stat fc-stat--known">
            <span className="fc-stat-num">{known.length}</span>
            <span className="fc-stat-label">Know it</span>
          </div>
          <div className="fc-stat fc-stat--learning">
            <span className="fc-stat-num">{learning.length}</span>
            <span className="fc-stat-label">Still learning</span>
          </div>
        </div>

        {learning.length > 0 && (
          <div className="fc-results-learning">
            <p className="fc-results-learning-label">Still learning:</p>
            <div className="fc-results-learning-words">
              {learning.map((w) => (
                <span key={w} className="fc-results-word-chip">{w}</span>
              ))}
            </div>
          </div>
        )}

        <div className="fc-results-actions">
          {learning.length > 0 && (
            <button className="fc-btn fc-btn--primary" onClick={retryLearning}>
              <TbRefresh /> Retry {learning.length} word{learning.length !== 1 ? "s" : ""}
            </button>
          )}
          <button className="fc-btn" onClick={restartFull}>
            <TbRefresh /> Restart
          </button>
          <button className="fc-btn" onClick={() => navigate(-1)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fc-container">
      {/* Header */}
      <div className="fc-header">
        <button className="fc-back-btn" onClick={() => navigate(-1)}>
          <TbArrowLeft /> Back
        </button>
        <div className="fc-progress-wrap">
          <div className="fc-progress-bar"
            style={{ width: `${(current / deck.length) * 100}%` }} />
        </div>
        <span className="fc-counter">{current + 1} / {deck.length}</span>
      </div>

      {/* Card */}
      <div className="fc-scene" onClick={handleFlip}>
        <div className={`fc-card${flipped ? " fc-card--flipped" : ""}`}>

          {/* Front */}
          <div className="fc-face fc-face--front">
            <span className="fc-tap-hint">tap · or press space</span>
            <h1 className="fc-word">{card?.word}</h1>
            {card?.frequency && <span className="fc-badge">{card.frequency}</span>}
          </div>

          {/* Back — all meanings */}
          <div className="fc-face fc-face--back">
            {card?.definitions?.map((def, i) => {
              const ex = Array.isArray(def.example)
                ? def.example[0]?.sentence
                : def.example;
              return (
                <div key={i} className={`fc-meaning${i > 0 ? " fc-meaning--divider" : ""}`}>
                  <span className="fc-pos">{def.part_of_speech}</span>
                  <p className="fc-definition">{def.definition}</p>
                  {ex && <p className="fc-example">"{ex}"</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`fc-actions${flipped ? " fc-actions--visible" : ""}`}>
        <button className="fc-action-btn fc-action-btn--learning" onClick={handleLearning}>
          <TbX /> Still learning <kbd>←</kbd>
        </button>
        <button className="fc-action-btn fc-action-btn--known" onClick={handleKnow}>
          <TbCheck /> Know it <kbd>→</kbd>
        </button>
      </div>
    </div>
  );
}
