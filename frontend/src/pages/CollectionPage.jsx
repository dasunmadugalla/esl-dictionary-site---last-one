import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";
import { TbArrowLeft, TbTrash, TbX, TbPencil, TbCheck, TbCards } from "react-icons/tb";
import Loader from "../components/Loader.jsx";
import Lexicaldata from "../components/Lexicaldata.jsx";
import { useToast } from "../context/ToastContext.jsx";

function CollectionPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [collection, setCollection] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingIds, setRemovingIds] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [{ data: col, error: colErr }, { data: colWords, error: cwErr }] = await Promise.all([
          supabase.from("Collections").select("*").eq("id", id).eq("email", user.email).single(),
          supabase.from("CollectionWords").select("word, created_at").eq("collection_id", id).eq("email", user.email).order("created_at", { ascending: false }),
        ]);

        if (colErr || !col) { navigate("/collections"); return; }
        if (cwErr) throw cwErr;
        setCollection(col);

        if (colWords?.length > 0) {
          const wordIds = colWords.map((w) => w.word);
          const { data: wordDetails, error: wErr } = await supabase.from("Words").select("*").in("word", wordIds);
          if (wErr) throw wErr;
          const merged = colWords.map((cw) => ({
            ...(wordDetails?.find((w) => w.word === cw.word) || { word: cw.word }),
            added_at: cw.created_at,
          }));
          setWords(merged);
        }
      } catch (err) {
        setError("Failed to load collection. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, id]);

  const removeWord = async (word) => {
    const removed = words.find((w) => w.word === word);
    setRemovingIds((prev) => [...prev, word]);
    setTimeout(() => {
      setWords((prev) => prev.filter((w) => w.word !== word));
      setRemovingIds((prev) => prev.filter((i) => i !== word));
    }, 300);
    const { error } = await supabase.from("CollectionWords").delete().eq("collection_id", id).eq("word", word).eq("email", user.email);
    if (error) {
      if (removed) setWords((prev) => [...prev, removed]);
      showToast("Failed to remove word. Try again.");
    }
  };

  const startEditing = () => {
    setEditName(collection.name);
    setEditDesc(collection.description || "");
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("Collections").update({ name: editName.trim(), description: editDesc.trim() || null }).eq("id", id);
    if (!error) {
      setCollection((prev) => ({ ...prev, name: editName.trim(), description: editDesc.trim() || null }));
      setEditing(false);
    } else {
      showToast("Failed to save changes. Try again.");
    }
  };

  const deleteCollection = async () => {
    const { error: e1 } = await supabase.from("CollectionWords").delete().eq("collection_id", id).eq("email", user.email);
    const { error: e2 } = await supabase.from("Collections").delete().eq("id", id).eq("email", user.email);
    if (e1 || e2) { showToast("Failed to delete collection. Try again."); return; }
    navigate("/collections");
  };

  const sortedWords = [...words].sort((a, b) => {
    switch (sortBy) {
      case "az":     return a.word.localeCompare(b.word);
      case "za":     return b.word.localeCompare(a.word);
      case "recent": return new Date(b.added_at) - new Date(a.added_at);
      case "oldest": return new Date(a.added_at) - new Date(b.added_at);
      default:       return 0;
    }
  });

  if (loading) return <Loader />;
  if (error) return <div className="fc-empty"><p>{error}</p></div>;

  return (
    <div className="collections-main-container">
      <div className="collections-wrapper">

        <div className="collection-page-header">
          <button className="collection-back-btn" onClick={() => navigate("/collections")}>
            <TbArrowLeft />
          </button>
          <div className="collection-page-title-group">
            <h1 className="collections-title">{collection?.name}</h1>
            <span className="collections-count">{words.length} words</span>
          </div>
          {words.length > 0 && (
            <>
              <button
                className="fc-practice-btn"
                onClick={() => navigate(`/flashcards?source=collection&id=${id}`)}
              >
                <TbCards /> Practice
              </button>
            </>
          )}
          <button className="collection-edit-btn" onClick={editing ? saveEdit : startEditing}>
            {editing ? <TbCheck /> : <TbPencil />}
          </button>
          <button className="collection-delete-btn" onClick={() => setConfirmDelete(true)}>
            <TbTrash />
          </button>
        </div>

        {collection?.description && !editing && (
          <p className="collection-page-desc">{collection.description}</p>
        )}

        {editing && (
          <>
            <div className="collection-modal-backdrop" onClick={() => setEditing(false)} />
            <div className="collection-modal">
              <h2 className="collection-modal-title">Edit Collection</h2>
              <div className="collection-modal-fields">
                <input
                  className="collection-name-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  maxLength={30}
                  autoFocus
                  placeholder="Collection name..."
                />
                <textarea
                  className="collection-desc-input"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  maxLength={100}
                  rows={3}
                  placeholder="Description (optional)..."
                />
              </div>
              <div className="collection-modal-actions">
                <button className="collection-cancel-btn" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button className="collection-save-btn" onClick={saveEdit}>
                  Save
                </button>
              </div>
            </div>
          </>
        )}

        {words.length > 0 && (
          <div className="sort-controls">
            <button className={sortBy === "az"     ? "active" : ""} onClick={() => setSortBy("az")}>A → Z</button>
            <button className={sortBy === "za"     ? "active" : ""} onClick={() => setSortBy("za")}>Z → A</button>
            <button className={sortBy === "recent" ? "active" : ""} onClick={() => setSortBy("recent")}>Recent</button>
            <button className={sortBy === "oldest" ? "active" : ""} onClick={() => setSortBy("oldest")}>Oldest</button>
          </div>
        )}

        {words.length === 0 ? (
          <div className="collections-empty">
            <p>No words here yet. Find a word and add it to this collection.</p>
          </div>
        ) : (
          <div className="collections-list">
            {sortedWords.map((row) => (
              <div
                key={row.word}
                className={`collection-card${removingIds.includes(row.word) ? " removing" : ""}`}
                onClick={() => navigate(`/word/${encodeURIComponent(row.word)}`)}
              >
                <div className="collection-word-content">
                  <h2 className="collection-card-name">{row.word}</h2>
                  <div className="collection-word-meta">
                    <Lexicaldata data={row} />
                  </div>
                </div>
                <button
                  className="interaction-btn"
                  onClick={(e) => { e.stopPropagation(); removeWord(row.word); }}
                >
                  <TbX className="interaction-icon" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <>
          <div className="collection-modal-backdrop" onClick={() => setConfirmDelete(false)} />
          <div className="collection-modal">
            <h2 className="collection-modal-title">Delete Collection?</h2>
            <p className="collection-delete-warning">
              Deleting <strong>"{collection?.name}"</strong> will permanently remove
              {words.length > 0
                ? <> all <strong>{words.length} word{words.length !== 1 ? "s" : ""}</strong> inside it.</>
                : " this collection."
              }
              {" "}This can't be undone.
            </p>
            <div className="collection-modal-actions">
              <button className="collection-cancel-btn" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button className="collection-delete-confirm-btn" onClick={deleteCollection}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CollectionPage;
