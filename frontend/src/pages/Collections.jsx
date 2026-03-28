import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { TbPlus, TbFolder, TbChevronRight, TbTrash } from "react-icons/tb";
import Loader from "../components/Loader.jsx";

function Collections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [wordCounts, setWordCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, wordCount }

  const fetchCollections = async () => {
    if (!user) return;

    const [{ data: cols }, { data: words }] = await Promise.all([
      supabase
        .from("Collections")
        .select("*")
        .eq("email", user.email)
        .order("created_at", { ascending: false }),
      supabase
        .from("CollectionWords")
        .select("collection_id")
        .eq("email", user.email),
    ]);

    setCollections(cols || []);

    const counts = {};
    words?.forEach((r) => {
      counts[r.collection_id] = (counts[r.collection_id] || 0) + 1;
    });
    setWordCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    fetchCollections();
  }, [user]);

  const handleCreate = async () => {
    if (!newName.trim()) { setError("Name can't be empty."); return; }
    if (collections.length >= 5) { setError("You can only create up to 5 collections."); return; }

    const { error: dbError } = await supabase.from("Collections").insert({
      name: newName.trim(),
      description: newDesc.trim() || null,
      email: user.email,
    });

    if (dbError) { setError("Failed to create. Try again."); return; }

    setNewName("");
    setNewDesc("");
    setCreating(false);
    setError("");
    fetchCollections();
  };

  const cancelCreate = () => {
    setCreating(false);
    setNewName("");
    setNewDesc("");
    setError("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("CollectionWords").delete().eq("collection_id", deleteTarget.id).eq("email", user.email);
    await supabase.from("Collections").delete().eq("id", deleteTarget.id).eq("email", user.email);
    setDeleteTarget(null);
    fetchCollections();
  };

  if (loading) return <Loader />;

  const atLimit = collections.length >= 5;

  return (
    <div className="collections-main-container">
      <div className="collections-wrapper">
        <div className="collections-header">
          <div className="collections-title-row">
            <h1 className="collections-title">Collections</h1>
            <span className="collections-count">{collections.length}/5</span>
          </div>
          {!atLimit && (
            <button
              className="create-collection-btn"
              onClick={() => setCreating((p) => !p)}
            >
              <TbPlus className="create-collection-icon" />
              New Collection
            </button>
          )}
        </div>

        {creating && (
          <>
            <div className="collection-modal-backdrop" onClick={cancelCreate} />
            <div className="collection-modal">
              <h2 className="collection-modal-title">New Collection</h2>
              <div className="collection-modal-fields">
                <input
                  type="text"
                  className="collection-name-input"
                  placeholder="Collection name..."
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                  maxLength={30}
                />
                <textarea
                  className="collection-desc-input"
                  placeholder="Description (optional)..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  maxLength={100}
                  rows={3}
                />
              </div>
              {error && <p className="collection-error">{error}</p>}
              <div className="collection-modal-actions">
                <button className="collection-cancel-btn" onClick={cancelCreate}>
                  Cancel
                </button>
                <button className="collection-save-btn" onClick={handleCreate}>
                  Create
                </button>
              </div>
            </div>
          </>
        )}

        {collections.length === 0 ? (
          <div className="collections-empty">
            <TbFolder className="collections-empty-icon" />
            <p>No collections yet. Create your first one!</p>
          </div>
        ) : (
          <div className="collections-list">
            {collections.map((col) => (
              <div
                key={col.id}
                className="collection-card"
                onClick={() => navigate(`/collections/${col.id}`)}
              >
                <div className="collection-folder-wrap">
                  <TbFolder className="collection-card-folder-icon" />
                  {(wordCounts[col.id] || 0) > 0 && (
                    <span className="collection-folder-badge">
                      {wordCounts[col.id]}
                    </span>
                  )}
                </div>
                <div className="collection-card-info">
                  <h2 className="collection-card-name">{col.name}</h2>
                  {col.description && (
                    <p className="collection-card-desc">{col.description}</p>
                  )}
                  <span className="collection-card-count">
                    {wordCounts[col.id] || 0} words
                  </span>
                </div>
                <button
                  className="collection-card-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ id: col.id, name: col.name, wordCount: wordCounts[col.id] || 0 });
                  }}
                >
                  <TbTrash />
                </button>
                <TbChevronRight className="collection-card-arrow" />
              </div>
            ))}
          </div>
        )}

        {atLimit && (
          <p className="collections-limit-msg">
            You've reached the 5 collection limit.
          </p>
        )}
      </div>

      {deleteTarget && (
        <>
          <div className="collection-modal-backdrop" onClick={() => setDeleteTarget(null)} />
          <div className="collection-modal">
            <h2 className="collection-modal-title">Delete Collection?</h2>
            <p className="collection-delete-warning">
              Deleting <strong>"{deleteTarget.name}"</strong> will permanently remove
              {deleteTarget.wordCount > 0
                ? <> all <strong>{deleteTarget.wordCount} word{deleteTarget.wordCount !== 1 ? "s" : ""}</strong> inside it.</>
                : " this collection."
              }
              {" "}This can't be undone.
            </p>
            <div className="collection-modal-actions">
              <button className="collection-cancel-btn" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="collection-delete-confirm-btn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Collections;
