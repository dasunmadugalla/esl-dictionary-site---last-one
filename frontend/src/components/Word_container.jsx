import React, { useContext, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TbVolume, TbStar, TbShare, TbStarFilled, TbDownload, TbFolderPlus, TbCheck, TbPlus, TbBulb, TbHeadphones } from "react-icons/tb";
import { useAuth } from "../context/AuthContext";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Url_snippet from "../components/Url_snippet";
import { IPContext } from "../context/IPContext";
import Word_snippet from "../components/Word_snippet";
import * as htmlToImage from "html-to-image";
import RandomButton from "./RandomButton";
import { supabase } from "../lib/supabase";
import { useToast } from "../context/ToastContext.jsx";

function ClickableSentence({ text }) {
  if (!text) return null;
  const tokens = text.split(/(\b[a-zA-Z]+(?:[''][a-zA-Z]+)*\b)/);
  return (
    <>
      {tokens.map((token, i) =>
        /^[a-zA-Z]+(?:[''][a-zA-Z]+)*$/.test(token) ? (
          <Link
            key={i}
            to={`/word/${encodeURIComponent(token.toLowerCase())}`}
            className="sentence-word-link"
          >
            {token}
          </Link>
        ) : (
          token
        )
      )}
    </>
  );
}
  
// ── Wikipedia visual card ──────────────────────────────────────────────────

function Word_container({ details: searchResult = {} }) {
  const utteranceRef = useRef(null);
  const snippetRef = useRef(null);

  const [speechSupported, setSpeechSupported] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [bookmarked, setBookmarked] = useState(searchResult.bookmarked ?? false);
  const [starPopping, setStarPopping] = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);
  const [collectionMenuOpen, setCollectionMenuOpen] = useState(false);
  const [userCollections, setUserCollections] = useState([]);
  const [wordInCollections, setWordInCollections] = useState(new Set());
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [colError, setColError] = useState("");
  const [creating, setCreating] = useState(false);
  const collectionMenuRef = useRef(null);

  const { user } = useAuth();
  const { ip } = useContext(IPContext);
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Safely extract technical definition
  const rawTechDef = searchResult.technical_definition;
  const techDef =
    rawTechDef && typeof rawTechDef === "object" && !Array.isArray(rawTechDef)
      ? rawTechDef
      : { subject: "", definition: "" };

  const hasTechDef =
    typeof techDef.definition === "string" && techDef.definition.trim() !== "";

  // ── Speech synthesis ──────────────────────────────────────────────────────
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window;

    setSpeechSupported(supported);
    if (!supported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      const googleVoices = voices.filter((v) =>
        v.name.toLowerCase().includes("google")
      );
      const preferred =
        googleVoices.find((v) => v.lang.toLowerCase().startsWith("en-gb")) ||
        googleVoices.find((v) => v.lang.toLowerCase().startsWith("en-us")) ||
        null;
      setSelectedVoice(preferred);
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakText = (text) => {
    if (!text || !speechSupported) return;

    setIsLoadingVoice(true);
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const done = () => {
      setIsLoadingVoice(false);
      utteranceRef.current = null;
    };

    utterance.onstart = done; // voice loaded — spinner off
    utterance.onend = done;
    utterance.onerror = done;

    utteranceRef.current = utterance;

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("SpeechSynthesis error:", e);
      done();
    }
  };

  // ── Collection picker ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!collectionMenuOpen) return;
    const handleClick = (e) => {
      if (collectionMenuRef.current && !collectionMenuRef.current.contains(e.target)) {
        setCollectionMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [collectionMenuOpen]);

  const openCollectionMenu = async () => {
    if (!user) { navigate("/auth"); return; }
    setCollectionMenuOpen((prev) => !prev);
    if (collectionMenuOpen) return;
    setCollectionsLoading(true);
    try {
      const [{ data: cols, error: e1 }, { data: wordCols, error: e2 }] = await Promise.all([
        supabase.from("Collections").select("id, name").eq("email", user.email).order("created_at"),
        supabase.from("CollectionWords").select("collection_id").eq("email", user.email).eq("word", searchResult.word),
      ]);
      if (e1 || e2) throw e1 || e2;
      setUserCollections(cols || []);
      setWordInCollections(new Set((wordCols || []).map((r) => r.collection_id)));
    } catch {
      showToast("Failed to load collections. Try again.");
      setCollectionMenuOpen(false);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const createAndAddCollection = async () => {
    const name = newColName.trim();
    if (!name) { setColError("Name can't be empty."); return; }
    if (userCollections.length >= 5) { setColError("You can only create up to 5 collections."); return; }
    setCreating(true);

    const { data: col, error } = await supabase
      .from("Collections")
      .insert({ name, description: newColDesc.trim() || null, email: user.email })
      .select("id, name")
      .single();

    if (error || !col) {
      showToast("Failed to create collection. Try again.");
    } else {
      const { error: insertErr } = await supabase.from("CollectionWords").insert({
        collection_id: col.id, word: searchResult.word, email: user.email,
      });
      if (insertErr) showToast("Collection created but word wasn't added. Try again.");
      setUserCollections((prev) => [...prev, col]);
      setWordInCollections((prev) => new Set([...prev, col.id]));
    }

    setNewColName("");
    setNewColDesc("");
    setColError("");
    setShowCreateModal(false);
    setCreating(false);
  };

  const cancelCreateModal = () => {
    setShowCreateModal(false);
    setNewColName("");
    setNewColDesc("");
    setColError("");
  };

  const toggleWordInCollection = async (collectionId) => {
    const word = searchResult.word;
    if (wordInCollections.has(collectionId)) {
      setWordInCollections((prev) => { const next = new Set(prev); next.delete(collectionId); return next; });
      const { error } = await supabase.from("CollectionWords").delete().eq("collection_id", collectionId).eq("word", word).eq("email", user.email);
      if (error) {
        setWordInCollections((prev) => new Set([...prev, collectionId]));
        showToast("Failed to remove from collection. Try again.");
      }
    } else {
      setWordInCollections((prev) => new Set([...prev, collectionId]));
      const { data: existing } = await supabase.from("CollectionWords").select("id").eq("collection_id", collectionId).eq("word", word).eq("email", user.email).maybeSingle();
      if (!existing) {
        const { error } = await supabase.from("CollectionWords").insert({ collection_id: collectionId, word, email: user.email });
        if (error) {
          setWordInCollections((prev) => { const next = new Set(prev); next.delete(collectionId); return next; });
          showToast("Failed to add to collection. Try again.");
        }
      }
    }
  };

  // ── Bookmark ──────────────────────────────────────────────────────────────
  const bookmarkWord = async (wordID) => {
    if (!user) { navigate("/auth"); return; }

    setBookmarked((prev) => !prev);
    setStarPopping(true);
    setTimeout(() => setStarPopping(false), 600);

    try {
      const res = await fetch(`${ip}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, wordID }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch (err) {
      setBookmarked((prev) => !prev);
      showToast("Failed to update bookmark. Try again.");
    }
  };

  // ── Share / Download ──────────────────────────────────────────────────────
  const handleShareClick = () => {
    setShowSnippet(true);
    setTimeout(() => setShowSnippet(false), 3000);
  };

  const handleDownload = async () => {
    if (!snippetRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(snippetRef.current, {
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${searchResult.word || "word-snippet"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      showToast("Download failed. Try again.");
    }
  };

  const wordToSpeak = searchResult.word || searchResult.phonetic || "";

  const { data: collocations } = useQuery({
    queryKey: ["collocations", searchResult.word],
    queryFn: async () => {
      const [beforeRes, afterRes] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rc=${encodeURIComponent(searchResult.word)}&max=6`),
        fetch(`https://api.datamuse.com/words?lc=${encodeURIComponent(searchResult.word)}&max=6`),
      ]);
      const before = await beforeRes.json();
      const after = await afterRes.json();
      return {
        before: before.map((w) => w.word).filter(Boolean),
        after: after.map((w) => w.word).filter(Boolean),
      };
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!searchResult.word,
  });

  return (
    <div className="word-result-wrapper">

      {/* ── Word Header ─────────────────────────────────────────────────── */}
      <div className="word-header">

        {/* word info group: title + speaker + phonetic/syllables/badges */}
        <div className="word-info-group">
          <div className="header-upper-row">
            <h1 className="word">{searchResult.word}</h1>
            <button
              className="speaker-btn"
              aria-label={`Pronounce ${wordToSpeak}`}
              onClick={() => speakText(wordToSpeak)}
              disabled={!wordToSpeak || isLoadingVoice}
              aria-busy={isLoadingVoice}
              title={isLoadingVoice ? "Loading voice…" : "Play pronunciation"}
            >
              {isLoadingVoice ? (
                <span className="tiny-spinner" aria-hidden="true" />
              ) : (
                <TbVolume className="speaker-icon" />
              )}
            </button>
          </div>

          <div className="entry-details-box">
            <div className="entry-details-row">
              {searchResult.phonetic && (
                <span className="phonetic">{searchResult.phonetic}</span>
              )}
              {searchResult.syllables && (
                <span className="syllables">{searchResult.syllables}</span>
              )}
            </div>
            <div className="entry-details-row">
              {searchResult.frequency && (
                <span className="lexical-badge">{searchResult.frequency}</span>
              )}
              {searchResult.complexity && (
                <span className="lexical-badge">{searchResult.complexity}</span>
              )}
              {searchResult.register && (
                <span className={`lexical-badge register-badge register-badge--${searchResult.register}`}>
                  {searchResult.register}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* action buttons group */}
        <div className="interaction-group">
          <button
            className="interaction-btn"
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark word"}
            onClick={() => bookmarkWord(searchResult.word)}
          >
            {bookmarked ? (
              <TbStarFilled className={`interaction-icon bookmark-star${starPopping ? " star-pop" : ""}`} />
            ) : (
              <TbStar className={`interaction-icon${starPopping ? " star-unpop" : ""}`} />
            )}
          </button>

          <button
            className="interaction-btn"
            aria-label="Download word card"
            onClick={handleDownload}
          >
            <TbDownload className="interaction-icon" />
          </button>

          <div className="collection-picker" ref={collectionMenuRef}>
            <button
              className="interaction-btn"
              aria-label="Add to collection"
              onClick={openCollectionMenu}
            >
              <TbFolderPlus className="interaction-icon" />
            </button>
            {collectionMenuOpen && (
              <div className="collection-dropdown">
                {collectionsLoading ? (
                  <p className="collection-dropdown-loading">Loading…</p>
                ) : (
                  <>
                    {userCollections.length === 0 && !showCreateModal && (
                      <p className="collection-dropdown-msg">No collections yet</p>
                    )}
                    {userCollections.map((col) => (
                      <button
                        key={col.id}
                        className="collection-dropdown-item"
                        onClick={() => toggleWordInCollection(col.id)}
                      >
                        <span>{col.name}</span>
                        {wordInCollections.has(col.id) && <TbCheck className="collection-check-icon" />}
                      </button>
                    ))}

                    {userCollections.length < 5 && (
                      <button
                        className="collection-dropdown-new"
                        onClick={() => { setCollectionMenuOpen(false); setShowCreateModal(true); }}
                      >
                        <TbPlus /> New collection
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="url-share-wrapper">
            <button
              className="interaction-btn"
              aria-label="Share word"
              onClick={handleShareClick}
            >
              <TbShare className="interaction-icon" />
            </button>
            {showSnippet && (
              <Url_snippet
                url={`www.dictionary.com${location.pathname}`}
                visible={showSnippet}
              />
            )}
          </div>
        </div>

        {/* Hidden snapshot target for download */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={snippetRef}>
            <Word_snippet data={searchResult} />
          </div>
        </div>

      </div>

      {/* ── Definitions ─────────────────────────────────────────────────── */}
      <div className="definitions-container">

        {hasTechDef && (
          <div className="tech-definition">
            <h4 className="tech-definition-title">
              Technical Explanation
              {typeof techDef.subject === "string" && techDef.subject && (
                <> — <span className="tech-definition-subject">{techDef.subject}</span></>
              )}
            </h4>
            <p className="tech-definition-text"><ClickableSentence text={techDef.definition} /></p>
          </div>
        )}

        {searchResult.meanings?.map((meaning, index) => (
          <div key={`${meaning.part_of_speech}-${index}`} className="definition-box">
            <span className="word-class">{meaning.part_of_speech}</span>
            <p className="definition"><ClickableSentence text={meaning.definition} /></p>

            {meaning.example && (
              <ol className="example-list">
                {Array.isArray(meaning.example) ? (
                  meaning.example.map((ex, i) => (
                    <li key={i} className="example-item">
                      <p className="ex-sentence">
                        <ClickableSentence text={ex.sentence} />
                      </p>
                      {(ex.sentence_explanation || ex.sentence_explantion) && (
                        <p className="sentence-explanation"><ClickableSentence text={ex.sentence_explanation || ex.sentence_explantion} /></p>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="example-sentence">
                    <ClickableSentence text={meaning.example} />
                  </li>
                )}
              </ol>
            )}

            <div className="word-relations">
              {meaning.synonyms?.length > 0 && (
                <div className="word-relation-group">
                  <span className="relation-label">Synonyms</span>
                  <ul className="word-list">
                    {meaning.synonyms.map((word) => (
                      <li key={word} className="word-item word-synm">
                        <Link to={`/word/${encodeURIComponent(word)}`}>{word}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {meaning.antonyms?.length > 0 && (
                <div className="word-relation-group">
                  <span className="relation-label">Antonyms</span>
                  <ul className="word-list">
                    {meaning.antonyms.map((word) => (
                      <li key={word} className="word-item word-antnm">
                        <Link to={`/word/${encodeURIComponent(word)}`}>{word}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {searchResult.memory_tip && (
          <div className="memory-tip-box">
            <span className="memory-tip-label"><TbBulb /> Memory Tip</span>
            <p className="memory-tip-text">{searchResult.memory_tip}</p>
          </div>
        )}

        {searchResult.real_world_context && (
          <div className="real-world-box">
            <span className="real-world-label"><TbHeadphones /> Where you'd hear this</span>
            <p className="real-world-text">{searchResult.real_world_context}</p>
          </div>
        )}

        {collocations && (collocations.before.length > 0 || collocations.after.length > 0) && (
          <div className="collocations-section">
            <span className="collocations-title">Common Pairings</span>
            <div className="collocations-groups">
              {collocations.before.length > 0 && (
                <div className="collocations-group">
                  <span className="collocations-group-label">before</span>
                  <div className="collocations-pills">
                    {collocations.before.map((w) => (
                      <Link key={w} to={`/word/${encodeURIComponent(w)}`} className="collocation-pill">
                        {w} <span className="collocation-target">{searchResult.word}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {collocations.after.length > 0 && (
                <div className="collocations-group">
                  <span className="collocations-group-label">after</span>
                  <div className="collocations-pills">
                    {collocations.after.map((w) => (
                      <Link key={w} to={`/word/${encodeURIComponent(w)}`} className="collocation-pill">
                        <span className="collocation-target">{searchResult.word}</span> {w}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(() => {
          const wf = searchResult.word_family;
          if (!wf) return null;
          const entries = [
            { label: "noun", word: wf.noun },
            { label: "verb", word: wf.verb },
            { label: "adjective", word: wf.adjective },
            { label: "adverb", word: wf.adverb },
          ].filter((e) => e.word);
          if (entries.length === 0) return null;
          return (
            <div className="word-family-section">
              <span className="word-family-title">Word Family</span>
              <div className="word-family-items">
                {entries.map(({ label, word }) => (
                  <Link
                    key={label}
                    to={`/word/${encodeURIComponent(word)}`}
                    className={`word-family-item${word === searchResult.word ? " word-family-item--current" : ""}`}
                  >
                    <span className="word-family-pos">{label}</span>
                    <span className="word-family-word">{word}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {searchResult.related_words?.length > 0 && (
          <div className="bottom-ribbon">
            <h5>Related Words</h5>
            <ul className="related-words-wrapper">
              {searchResult.related_words.map((word) => (
                <li className="related-word" key={word}>
                  <Link to={`/word/${encodeURIComponent(word)}`}>{word}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <RandomButton />

      {/* ── Create collection modal ──────────────────────────────────────── */}
      {showCreateModal && (
        <>
          <div className="collection-modal-backdrop" onClick={cancelCreateModal} />
          <div className="collection-modal">
            <h2 className="collection-modal-title">New Collection</h2>
            <div className="collection-modal-fields">
              <input
                type="text"
                className="collection-name-input"
                placeholder="Collection name..."
                value={newColName}
                onChange={(e) => { setNewColName(e.target.value); setColError(""); }}
                onKeyDown={(e) => e.key === "Enter" && createAndAddCollection()}
                autoFocus
                maxLength={30}
              />
              <textarea
                className="collection-desc-input"
                placeholder="Description (optional)..."
                value={newColDesc}
                onChange={(e) => setNewColDesc(e.target.value)}
                maxLength={100}
                rows={3}
              />
            </div>
            {colError && <p className="collection-error">{colError}</p>}
            <div className="collection-modal-actions">
              <button className="collection-cancel-btn" onClick={cancelCreateModal}>
                Cancel
              </button>
              <button className="collection-save-btn" onClick={createAndAddCollection} disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Word_container;