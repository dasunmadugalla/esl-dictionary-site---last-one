import React, { useContext, useEffect, useRef, useState } from "react";
import { TbVolume, TbStar, TbShare, TbStarFilled, TbDownload } from "react-icons/tb";
import { useAuth } from "../context/AuthContext";
import { useLocation, Link } from "react-router-dom";
import Url_snippet from "../components/Url_snippet";
import { IPContext } from "../context/IPContext";
import Word_snippet from "../components/Word_snippet";
import * as htmlToImage from "html-to-image";
import RandomButton from "./RandomButton";
  
function Word_container({ details: searchResult = {} }) {
  const utteranceRef = useRef(null);
  const snippetRef = useRef(null);

  const [speechSupported, setSpeechSupported] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [bookmarked, setBookmarked] = useState(searchResult.bookmarked ?? false);
  const [showSnippet, setShowSnippet] = useState(false);

  const { user } = useAuth();
  const { ip } = useContext(IPContext);
  const location = useLocation();

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

  // ── Bookmark ──────────────────────────────────────────────────────────────
  const bookmarkWord = async (wordID) => {
    if (!user) {
      alert("You must be logged in to bookmark words.");
      return;
    }

    setBookmarked((prev) => !prev);

    try {
      await fetch(`${ip}:3000/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, wordID }),
      });
    } catch (err) {
      console.error("Bookmark error:", err);
      // Revert optimistic update on failure
      setBookmarked((prev) => !prev);
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
      console.error("Download failed:", err);
    }
  };

  const wordToSpeak = searchResult.word || searchResult.phonetic || "";

  return (
    <div className="srch-wrapper">

      {/* ── Word Header ─────────────────────────────────────────────────── */}
      <div className="word-header">
        <div className="header-upper-row">
          <h1 className="word">{searchResult.word}</h1>

          <button
            className="speakerBtn"
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

          <div className="interaction-group">
            <button
              className="interation-btn"
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark word"}
              onClick={() => bookmarkWord(searchResult.word)}
            >
              {bookmarked ? (
                <TbStarFilled className="interaction-icon bk-star" />
              ) : (
                <TbStar className="interaction-icon" />
              )}
            </button>

            <button
              className="interation-btn"
              aria-label="Download word card"
              onClick={handleDownload}
            >
              <TbDownload className="interaction-icon" />
            </button>

            <div className="url-snip-wrapper">
              <button
                className="interation-btn"
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
        </div>

        {/* Hidden snapshot target for download */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={snippetRef}>
            <Word_snippet data={searchResult} />
          </div>
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
              <span className="lexi-btn">{searchResult.frequency}</span>
            )}
            {searchResult.complexity && (
              <span className="lexi-btn">{searchResult.complexity}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Definitions ─────────────────────────────────────────────────── */}
      <div className="definitions-container">

        {hasTechDef && (
          <div className="tech-defi-wrapper">
            <h4 className="tech-defi-title">
              Technical Explanation
              {typeof techDef.subject === "string" && techDef.subject && (
                <> — <span className="tech-defi-subj">{techDef.subject}</span></>
              )}
            </h4>
            <p className="tech-defi">{techDef.definition}</p>
          </div>
        )}

        {searchResult.meanings?.map((meaning, index) => (
          <div key={index} className="defiition-box">
            <span className="word-class">{meaning.part_of_speech}</span>
            <p className="definition">{meaning.definition}</p>

            {meaning.example && (
              <ol className="ex-sntce-list">
                {Array.isArray(meaning.example) ? (
                  meaning.example.map((ex, i) => (
                    <li key={i} className="ex-sntce-wrapper">
                      <p className="ex-sentence">{ex.sentence}</p>
                      {ex.sentence_explantion && (
                        <p className="sentence_explain">{ex.sentence_explantion}</p>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="ex-sntce">{meaning.example}</li>
                )}
              </ol>
            )}

            <div className="word-relations">
              {meaning.synonyms?.length > 0 && (
                <div className="word-rl-box">
                  <span className="rl-txt">Synonyms</span>
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
                <div className="word-rl-box">
                  <span className="rl-txt">Antonyms</span>
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

        {searchResult.related_words?.length > 0 && (
          <div className="bottom-ribbon">
            <h5>Related Words</h5>
            <ul className="related-words-wrapper">
              {searchResult.related_words.map((word, index) => (
                <li className="related-word" key={index}>
                  <Link to={`/word/${encodeURIComponent(word)}`}>{word}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <RandomButton />
    </div>
  );
}

export default Word_container;