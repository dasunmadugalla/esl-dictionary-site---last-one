import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";
import {
  TbArrowLeft, TbCheck, TbX, TbBrain, TbCalendar,
} from "react-icons/tb";
import Loader from "../components/Loader.jsx";
import { useToast } from "../context/ToastContext.jsx";
import "../styles/srsReview.css";

// ── SM-2 algorithm ──────────────────────────────────────────
function calcNext(card, knew) {
  const now = new Date();
  if (knew) {
    const reps = (card.repetitions ?? 0) + 1;
    let interval;
    if (reps === 1)      interval = 1;
    else if (reps === 2) interval = 6;
    else                 interval = Math.round((card.interval_days ?? 1) * (card.ease_factor ?? 2.5));
    const ease = Math.min(2.8, Math.max(1.3, (card.ease_factor ?? 2.5) + 0.1));
    const due = new Date(); due.setDate(due.getDate() + interval);
    return {
      interval_days: interval, ease_factor: ease,
      repetitions: reps, due_date: due.toISOString(),
      last_reviewed: now.toISOString(),
    };
  } else {
    const ease = Math.max(1.3, (card.ease_factor ?? 2.5) - 0.2);
    const due = new Date(); due.setMinutes(due.getMinutes() + 10);
    return {
      interval_days: 1, ease_factor: ease,
      repetitions: 0, due_date: due.toISOString(),
      last_reviewed: now.toISOString(),
    };
  }
}

function previewNext(card, knew) {
  if (!knew) return "10m";
  const reps = (card.repetitions ?? 0) + 1;
  let d;
  if (reps === 1)      d = 1;
  else if (reps === 2) d = 6;
  else                 d = Math.round((card.interval_days ?? 1) * (card.ease_factor ?? 2.5));
  if (d === 1)  return "1d";
  if (d < 7)    return `${d}d`;
  if (d < 30)   return `${Math.round(d / 7)}w`;
  return              `${Math.round(d / 30)}mo`;
}

function formatRelative(date) {
  const ms = date - new Date();
  const min = Math.round(ms / 60000);
  if (min < 60)  return `in ${min} min`;
  const h = Math.round(ms / 3600000);
  if (h < 24)    return `in ${h}h`;
  const d = Math.round(ms / 86400000);
  if (d === 1)   return "tomorrow";
  return         `in ${d} days`;
}

function formatInterval(srs) {
  if (!srs?.last_reviewed) return "New";
  const ms = new Date() - new Date(srs.last_reviewed);
  const d  = Math.round(ms / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "1d";
  if (d < 7)   return `${d}d`;
  if (d < 30)  return `${Math.round(d / 7)}w`;
  return       `${Math.round(d / 30)}mo`;
}

export default function SRSReview() {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const source       = params.get("source");
  const collectionId = params.get("id");

  const { showToast } = useToast();
  const [phase, setPhase]             = useState("loading");
  const [title, setTitle]             = useState("");
  const [allWords, setAllWords]       = useState([]);
  const [srsMap, setSrsMap]           = useState({});
  const [dueWords, setDueWords]       = useState([]);
  const [newCount, setNewCount]       = useState(0);
  const [nextDueLabel, setNextDueLabel] = useState(null);

  // session — deck is a plain array of word strings, fixed length throughout
  const [deck, setDeck]             = useState([]);
  const [current, setCurrent]       = useState(0);
  const [flipped, setFlipped]       = useState(false);
  const [known, setKnown]           = useState([]);
  const [learning, setLearning]     = useState([]);

  // ── Load ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
      let wordIds = [];

      if (source === "bookmarks") {
        setTitle("Bookmarks");
        const { data, error } = await supabase.from("Bookmarks").select("wordIDs").eq("email", user.email);
        if (error) throw error;
        wordIds = (data || []).map((b) => b.wordIDs);
      } else if (source === "collection" && collectionId) {
        const [{ data: col, error: e1 }, { data: cw, error: e2 }] = await Promise.all([
          supabase.from("Collections").select("name").eq("id", collectionId).single(),
          supabase.from("CollectionWords").select("word").eq("collection_id", collectionId).eq("email", user.email),
        ]);
        if (e1 || e2) throw e1 || e2;
        setTitle(col?.name || "Collection");
        wordIds = (cw || []).map((r) => r.word);
      }

      if (wordIds.length === 0) { setPhase("empty"); return; }

      const { data: wordData, error: wErr } = await supabase
        .from("Words").select("word, definitions, frequency, complexity, register").in("word", wordIds);
      if (wErr) throw wErr;

      // SRSCards table may not exist yet — treat errors as empty
      const { data: srsRaw } = await supabase
        .from("SRSCards").select("*").eq("email", user.email).in("word", wordIds);
      const srsData = srsRaw || [];

      const valid = (wordData || []).filter((w) => w.definitions?.[0]?.definition);
      if (valid.length === 0) { setPhase("empty"); return; }

      const map = {};
      srsData.forEach((r) => { map[r.word] = r; });

      const now = new Date();
      const due = valid.filter((w) => {
        const srs = map[w.word];
        return !srs || new Date(srs.due_date) <= now;
      });
      const fresh = valid.filter((w) => !map[w.word]);

      setAllWords(valid);
      setSrsMap(map);
      setNewCount(fresh.length);
      setDueWords(due);

      if (due.length === 0) {
        const next = srsData
          .filter((r) => new Date(r.due_date) > now)
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
        if (next) setNextDueLabel(formatRelative(new Date(next.due_date)));
        setPhase("nodue");
        return;
      }

      setPhase("setup");
      } catch (err) {
        showToast("Failed to load review session. Please try again.");
        setPhase("empty");
      }
    })();
  }, [user, source, collectionId]);

  // ── Start session ───────────────────────────────────────────
  function startSession() {
    setDeck(dueWords.map((w) => w.word));
    setCurrent(0);
    setFlipped(false);
    setKnown([]);
    setLearning([]);
    setPhase("playing");
  }

  // ── Current card ────────────────────────────────────────────
  const currentWord = deck[current];
  const card    = currentWord ? allWords.find((w) => w.word === currentWord) : null;
  const srsCard = (card && srsMap[card.word]) || {};
  const isNew   = !srsCard.last_reviewed;

  // ── Good ────────────────────────────────────────────────────
  const handleKnow = useCallback(async () => {
    if (!flipped || !card) return;
    const updates = calcNext(srsMap[card.word] || {}, true);
    const { error } = await supabase.from("SRSCards").upsert(
      { email: user.email, word: card.word, ...updates },
      { onConflict: "email,word" }
    );
    if (error) showToast("Progress may not have saved. Check your connection.");
    setSrsMap((prev) => ({ ...prev, [card.word]: { ...(prev[card.word] || {}), ...updates } }));
    setKnown((prev) => [...prev, card.word]);
    const next = current + 1;
    if (next >= deck.length) setPhase("results");
    else { setCurrent(next); setFlipped(false); }
  }, [flipped, card, srsMap, current, deck.length, user, showToast]);

  // ── Again ───────────────────────────────────────────────────
  const handleLearning = useCallback(async () => {
    if (!flipped || !card) return;
    const updates = calcNext(srsMap[card.word] || {}, false);
    const { error } = await supabase.from("SRSCards").upsert(
      { email: user.email, word: card.word, ...updates },
      { onConflict: "email,word" }
    );
    if (error) showToast("Progress may not have saved. Check your connection.");
    setSrsMap((prev) => ({ ...prev, [card.word]: { ...(prev[card.word] || {}), ...updates } }));
    setLearning((prev) => [...prev, card.word]);
    const next = current + 1;
    if (next >= deck.length) setPhase("results");
    else { setCurrent(next); setFlipped(false); }
  }, [flipped, card, srsMap, current, deck.length, user, showToast]);

  const handleFlip = useCallback(() => {
    if (!flipped) setFlipped(true);
  }, [flipped]);

  // ── Keyboard ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    const handler = (e) => {
      if (e.code === "Space")      { e.preventDefault(); handleFlip(); }
      if (e.code === "ArrowRight") { e.preventDefault(); handleKnow(); }
      if (e.code === "ArrowLeft")  { e.preventDefault(); handleLearning(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleFlip, handleKnow, handleLearning]);

  // ── Render ──────────────────────────────────────────────────
  if (phase === "loading") return <Loader />;

  if (phase === "empty") return (
    <div className="fc-container">
      <button className="fc-back-btn" onClick={() => navigate(-1)}><TbArrowLeft /> Back</button>
      <div className="fc-empty">
        <p>No words to review yet.</p>
        <p className="fc-empty-sub">Add bookmarks or words to a collection first.</p>
      </div>
    </div>
  );

  if (phase === "nodue") return (
    <div className="fc-container">
      <button className="fc-back-btn" onClick={() => navigate(-1)}><TbArrowLeft /> Back</button>
      <div className="srs-nodue">
        <TbBrain className="srs-nodue-icon" />
        <h2 className="srs-nodue-title">All caught up!</h2>
        <p className="srs-nodue-sub">{title}</p>
        <p className="srs-nodue-body">No cards are due right now.</p>
        {nextDueLabel && (
          <div className="srs-nodue-next">
            <TbCalendar />
            <span>Next review: <strong>{nextDueLabel}</strong></span>
          </div>
        )}
        <div className="srs-stats-row">
          <div className="srs-stat-box">
            <span className="srs-stat-num">{allWords.length}</span>
            <span className="srs-stat-lbl">total words</span>
          </div>
          <div className="srs-stat-box">
            <span className="srs-stat-num">
              {Object.values(srsMap).filter((r) => new Date(r.due_date) > new Date()).length}
            </span>
            <span className="srs-stat-lbl">scheduled</span>
          </div>
        </div>
        <button className="fc-btn" onClick={() => navigate(-1)}>Done</button>
      </div>
    </div>
  );

  if (phase === "setup") {
    const reviewCount = dueWords.length - newCount;
    return (
      <div className="fc-container">
        <button className="fc-back-btn" onClick={() => navigate(-1)}><TbArrowLeft /> Back</button>
        <div className="srs-setup">
          <TbBrain className="srs-setup-icon" />
          <h2 className="srs-setup-title">{title}</h2>
          <p className="srs-setup-sub">Spaced Repetition</p>
          <div className="srs-stats-row">
            {newCount > 0 && (
              <div className="srs-stat-box srs-stat-box--new">
                <span className="srs-stat-num">{newCount}</span>
                <span className="srs-stat-lbl">New</span>
              </div>
            )}
            {reviewCount > 0 && (
              <div className="srs-stat-box srs-stat-box--review">
                <span className="srs-stat-num">{reviewCount}</span>
                <span className="srs-stat-lbl">Review</span>
              </div>
            )}
          </div>
          <p className="srs-setup-desc">
            Cards are shown based on the forgetting curve.<br />
            "Again" resets a card. "Good" increases its interval.
          </p>
          <button className="srs-start-btn" onClick={startSession}>
            Start · {dueWords.length} card{dueWords.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "results") return (
    <div className="fc-container">
      <button className="fc-back-btn" onClick={() => navigate(-1)}><TbArrowLeft /> Back</button>
      <div className="fc-results">
        <h2 className="fc-results-title">Review complete</h2>
        <p className="fc-results-sub">{title}</p>
        <div className="fc-results-stats">
          <div className="fc-stat fc-stat--known">
            <span className="fc-stat-num">{known.length}</span>
            <span className="fc-stat-label">Good</span>
          </div>
          <div className="fc-stat fc-stat--learning">
            <span className="fc-stat-num">{learning.length}</span>
            <span className="fc-stat-label">Again</span>
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
        <div className="srs-results-note">
          <TbCalendar className="srs-note-icon" />
          <span>Intervals updated. Cards scheduled based on your performance.</span>
        </div>
        <div className="fc-results-actions">
          <button className="fc-btn" onClick={() => navigate(-1)}>Done</button>
        </div>
      </div>
    </div>
  );

  // ── Playing ─────────────────────────────────────────────────
  return (
    <div className="fc-container">
      <div className="fc-header">
        <button className="fc-back-btn" onClick={() => navigate(-1)}><TbArrowLeft /> Back</button>
        <div className="fc-progress-wrap">
          <div className="fc-progress-bar"
            style={{ width: `${(current / deck.length) * 100}%` }} />
        </div>
        <span className="fc-counter">{current + 1} / {deck.length}</span>
      </div>

      <div className="fc-scene" onClick={handleFlip}>
        <div className={`fc-card${flipped ? " fc-card--flipped" : ""}`}>

          <div className="fc-face fc-face--front">
            <span className="fc-tap-hint">tap · or press space</span>
            <h1 className="fc-word">{card?.word}</h1>
            <div className="srs-card-meta">
              <span className={`srs-badge srs-badge--${isNew ? "new" : "review"}`}>
                {isNew ? "New" : `${formatInterval(srsCard)} ago`}
              </span>
              {card?.frequency && <span className="fc-badge">{card.frequency}</span>}
            </div>
          </div>

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

      <div className={`fc-actions${flipped ? " fc-actions--visible" : ""}`}>
        <button className="fc-action-btn fc-action-btn--learning" onClick={handleLearning}>
          <TbX />
          <span className="srs-btn-text">
            <span className="srs-btn-label">Again</span>
            <span className="srs-btn-interval">{previewNext(srsCard, false)}</span>
          </span>
          <kbd>←</kbd>
        </button>
        <button className="fc-action-btn fc-action-btn--known" onClick={handleKnow}>
          <TbCheck />
          <span className="srs-btn-text">
            <span className="srs-btn-label">Good</span>
            <span className="srs-btn-interval">{previewNext(srsCard, true)}</span>
          </span>
          <kbd>→</kbd>
        </button>
      </div>
    </div>
  );
}
