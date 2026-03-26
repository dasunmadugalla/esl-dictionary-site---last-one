// Searchbar.jsx
import React, { useContext, useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IPContext } from "../context/IPContext";
function Searchbar() {
  const [search_value, setSearch_value] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ip } = useContext(IPContext);
  const inputRef = useRef(null);

  // Normalize input
  const normalizeWord = (word) =>
    word.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");

  // Validate with Datamuse before hitting backend
  const validateWord = async (word) => {
    try {
      const res = await fetch(
        `https://api.datamuse.com/words?sp=${normalizeWord(word)}&max=5`
      );
      const data = await res.json();
      return data.some((w) => w.word.toLowerCase() === normalizeWord(word));
    } catch (err) {
      console.error("Datamuse validation failed:", err);
      return true; // fallback: assume valid if API fails
    }
  };

  const handleSearch = async (value = search_value) => {
    if (!value.trim()) return;

    // Validate before calling backend
    const isValid = await validateWord(value);
    if (!isValid) {
      // show suggestions from Datamuse
      try {
        const sugRes = await fetch(
          `https://api.datamuse.com/sug?s=${normalizeWord(value)}`
        );
        const sugData = await sugRes.json();
        setSuggestions(sugData.slice(0, 5));
        setActiveIndex(-1);
      } catch (err) {
        console.error("Datamuse suggestions failed:", err);
      }
      return;
    }

    // Navigate to word page
    navigate(`/word/${encodeURIComponent(normalizeWord(value))}`);

    // Record search in backend if logged in
    if (user?.email) {
      try {
        const res = await fetch(`${ip}:3000/search/add-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            word: normalizeWord(value),
          }),
        });
        const data = await res.json();
        console.log("Search recorded:", data);
      } catch (err) {
        console.error("Failed to record search:", err);
      }
    }

    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`https://api.datamuse.com/sug?s=${query}`);
      const data = await res.json();
      setSuggestions(data.slice(0, 5));
      setActiveIndex(-1);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        const selected = suggestions[activeIndex].word;
        setSearch_value(selected);
        handleSearch(selected);
      } else {
        handleSearch();
      }
    }
  };

  return (
    <div className="search-main-wrapper">
      <div className="input-box">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type your word here"
          value={search_value}
          onChange={(e) => {
            const value = e.target.value;
            setSearch_value(value);
            handleSuggestions(value);
          }}
          onKeyDown={handleKeyDown}
        />
        <button className="inputBtn" onClick={() => handleSearch()}>
          <FiSearch className="inputBtn-icon" />
        </button>
      </div>

      {suggestions.length > 0 && (
        <ul className="suggestions-wrapper">
          {suggestions.map((sug, index) => (
            <li
              key={sug.word}
              className={`suggestion ${
                index === activeIndex ? "active" : ""
              }`}
              onClick={() => {
                setSearch_value(sug.word);
                handleSearch(sug.word);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {sug.word}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Searchbar;