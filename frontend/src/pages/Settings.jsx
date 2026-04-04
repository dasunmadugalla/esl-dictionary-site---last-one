import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { TbSun, TbMoon, TbDownload, TbTrash, TbLock, TbCheck, TbChevronRight, TbMessageCircle } from "react-icons/tb";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { IPContext } from "../context/IPContext";
import "../styles/settings.css";

function Section({ title, children }) {
  return (
    <div className="settings-section">
      <h2 className="settings-section-title">{title}</h2>
      <div className="settings-section-body">{children}</div>
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-label">
        <span className="settings-row-name">{label}</span>
        {hint && <span className="settings-row-hint">{hint}</span>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { ip } = useContext(IPContext);
  const navigate = useNavigate();

  // ── Change password ──────────────────────────────────────────
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 6) { setPwMsg({ type: "error", text: "Password must be at least 6 characters." }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: "error", text: "Passwords don't match." }); return; }
    setPwLoading(true);
    setPwMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwLoading(false);
    if (error) { setPwMsg({ type: "error", text: error.message }); return; }
    setPwMsg({ type: "success", text: "Password updated." });
    setNewPw(""); setConfirmPw(""); setPwOpen(false);
  };

  // ── Delete account ───────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteMsg("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${ip}/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { setDeleteMsg("Failed to delete account. Try again."); setDeleteLoading(false); return; }
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch {
      setDeleteMsg("Something went wrong.");
      setDeleteLoading(false);
    }
  };

  // ── Clear search history ─────────────────────────────────────
  const [clearHistoryLoading, setClearHistoryLoading] = useState(false);
  const [clearHistoryDone, setClearHistoryDone] = useState(false);

  const clearHistory = async () => {
    setClearHistoryLoading(true);
    await supabase.from("searches").delete().eq("email", user.email);
    setClearHistoryLoading(false);
    setClearHistoryDone(true);
    setTimeout(() => setClearHistoryDone(false), 2500);
  };

  // ── Export bookmarks ─────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState(false);

  const exportBookmarks = async () => {
    setExportLoading(true);
    const { data: bookmarkRows } = await supabase
      .from("Bookmarks").select("wordIDs").eq("email", user.email);
    const words = (bookmarkRows || []).map((r) => r.wordIDs);
    if (words.length === 0) { setExportLoading(false); return; }

    const { data: wordRows } = await supabase
      .from("Words").select("word, frequency").in("word", words);

    const rows = ["Word,Frequency", ...(wordRows || []).map((w) =>
      `${w.word},${w.frequency || ""}`
    )];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "bookmarks.csv"; a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
  };

  return (
    <div className="settings-main">
      <div className="settings-wrapper">
        <div className="settings-hero">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your account and preferences</p>
        </div>

        {/* ── Appearance ── */}
        <Section title="Appearance">
          <Row label="Theme" hint="Switch between light and dark mode">
            <button className="settings-theme-toggle" onClick={toggle}>
              <span className={`settings-theme-option ${theme === "light" ? "active" : ""}`}>
                <TbSun /> Light
              </span>
              <span className={`settings-theme-option ${theme === "dark" ? "active" : ""}`}>
                <TbMoon /> Dark
              </span>
            </button>
          </Row>
        </Section>

        {/* ── Data & Privacy ── */}
        <Section title="Data & Privacy">
          <Row label="Search history" hint="Clear all your recently searched words">
            <button
              className="settings-btn"
              onClick={clearHistory}
              disabled={clearHistoryLoading || clearHistoryDone}
            >
              {clearHistoryDone ? <><TbCheck /> Cleared</> : clearHistoryLoading ? "Clearing…" : <><TbTrash /> Clear history</>}
            </button>
          </Row>

          <div className="settings-divider" />

          <Row label="Export bookmarks" hint="Download your bookmarks as a CSV file">
            <button className="settings-btn" onClick={exportBookmarks} disabled={exportLoading}>
              <TbDownload /> {exportLoading ? "Exporting…" : "Export CSV"}
            </button>
          </Row>
        </Section>

        {/* ── Feedback ── */}
        <Section title="Feedback">
          <Row label="Share feedback" hint="Suggestions, bug reports, ideas — we read everything">
            <button className="settings-btn settings-row-link" onClick={() => navigate("/feedback")}>
              <TbMessageCircle /> Give feedback <TbChevronRight className="settings-chevron" />
            </button>
          </Row>
        </Section>

        {/* ── Account ── */}
        <Section title="Account">
          <Row label="Change password" hint="Update your login password">
            <button className="settings-btn" onClick={() => { setPwOpen((v) => !v); setPwMsg(null); }}>
              <TbLock /> {pwOpen ? "Cancel" : "Change"}
            </button>
          </Row>

          {pwOpen && (
            <form className="settings-pw-form" onSubmit={handleChangePassword}>
              <input
                className="settings-input"
                type="password"
                placeholder="New password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
              <input
                className="settings-input"
                type="password"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
              {pwMsg && <p className={`settings-msg settings-msg--${pwMsg.type}`}>{pwMsg.text}</p>}
              <button className="settings-btn settings-btn--primary" type="submit" disabled={pwLoading}>
                {pwLoading ? "Saving…" : "Update password"}
              </button>
            </form>
          )}

          <div className="settings-divider" />

          <Row label="Delete account" hint="Permanently delete your account and all data">
            {!deleteConfirm ? (
              <button className="settings-btn settings-btn--danger" onClick={() => setDeleteConfirm(true)}>
                <TbTrash /> Delete
              </button>
            ) : (
              <div className="settings-delete-confirm">
                <p className="settings-delete-warning">This cannot be undone. All your bookmarks, collections and history will be lost.</p>
                {deleteMsg && <p className="settings-msg settings-msg--error">{deleteMsg}</p>}
                <div className="settings-delete-actions">
                  <button className="settings-btn" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                  <button className="settings-btn settings-btn--danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
                    {deleteLoading ? "Deleting…" : "Yes, delete my account"}
                  </button>
                </div>
              </div>
            )}
          </Row>
        </Section>
      </div>
    </div>
  );
}
