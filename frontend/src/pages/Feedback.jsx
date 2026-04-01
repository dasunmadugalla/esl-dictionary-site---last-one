import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  TbArrowLeft, TbSend, TbBulb, TbTool, TbBug, TbMessageCircle, TbCheck,
  TbWorld, TbUsers,
} from "react-icons/tb";
import "../styles/feedback.css";

const FEEDBACK_TYPES = [
  { id: "suggestion",  label: "Suggestion",  icon: <TbBulb />,          hint: "Tell us your idea…" },
  { id: "improvement", label: "Improvement", icon: <TbTool />,          hint: "What would you like improved?" },
  { id: "bug",         label: "Bug / Error", icon: <TbBug />,           hint: "Describe what happened and how to reproduce it…" },
  { id: "other",       label: "Other",       icon: <TbMessageCircle />, hint: "Write your message…" },
];

export default function Feedback() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [fbType,    setFbType]    = useState("suggestion");
  const [fbText,    setFbText]    = useState("");
  const [fbLoading, setFbLoading] = useState(false);
  const [sent,      setSent]      = useState(false);
  const [fbError,   setFbError]   = useState(null);

  const selectedType = FEEDBACK_TYPES.find((t) => t.id === fbType);

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!fbText.trim()) return;
    setFbLoading(true);
    setFbError(null);
    const { error } = await supabase.from("Feedback").insert({
      email:   user?.email || null,
      type:    fbType,
      message: fbText.trim(),
    });
    setFbLoading(false);
    if (error) { setFbError("Something went wrong. Please try again."); return; }
    setSent(true);
  };

  return (
    <div className="fbp-page">
      <div className="fbp-wrapper">

        {/* Back */}
        <button className="fbp-back" onClick={() => navigate(-1)}>
          <TbArrowLeft /> Back
        </button>

        {sent ? (
          /* ── Success state ── */
          <div className="fbp-success">
            <div className="fbp-success-icon"><TbCheck /></div>
            <h2 className="fbp-success-title">Thank you!</h2>
            <p className="fbp-success-sub">
              Your feedback has been received. We read every single submission
              and use them to make this platform better for everyone.
            </p>
            <div className="fbp-success-actions">
              <button className="fbp-btn fbp-btn--outline" onClick={() => { setSent(false); setFbText(""); setFbType("suggestion"); }}>
                Send another
              </button>
              <button className="fbp-btn fbp-btn--primary" onClick={() => navigate(-1)}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="fbp-header">
              <h1 className="fbp-title">Share Your Feedback</h1>
              <p className="fbp-subtitle">Help us build a better learning experience</p>
            </div>

            {/* ── Community pitch ── */}
            <div className="fbp-community">
              <div className="fbp-community-left">
                <span className="fbp-globe"><TbWorld /></span>
              </div>
              <div className="fbp-community-right">
                <p className="fbp-community-title">This site grows because of learners like you</p>
                <p className="fbp-community-body">
                  We're building a community-powered learning space — not a product made in a vacuum.
                  Every suggestion you share directly shapes what gets built next.
                  Every bug you report makes the experience better for thousands of other learners.
                  <strong> Your voice matters here.</strong>
                </p>
                <div className="fbp-why-list">
                  <span className="fbp-why-item"><TbBulb /> Your ideas become real features</span>
                  <span className="fbp-why-item"><TbBug /> Your bug reports help every learner after you</span>
                  <span className="fbp-why-item"><TbUsers /> Community to community — we build this together</span>
                </div>
              </div>
            </div>

            {/* ── Form ── */}
            <form className="fbp-form" onSubmit={submitFeedback}>

              {/* Type selector */}
              <div className="fbp-field">
                <label className="fbp-label">What kind of feedback?</label>
                <div className="fbp-type-grid">
                  {FEEDBACK_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`fbp-type-btn${fbType === t.id ? " fbp-type-btn--active" : ""}`}
                      onClick={() => setFbType(t.id)}
                    >
                      <span className="fbp-type-icon">{t.icon}</span>
                      <span className="fbp-type-label">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="fbp-field">
                <label className="fbp-label">
                  Your message
                  <span className="fbp-char-count">{fbText.length} / 1000</span>
                </label>
                <textarea
                  className="fbp-textarea"
                  placeholder={selectedType?.hint}
                  value={fbText}
                  onChange={(e) => setFbText(e.target.value)}
                  maxLength={1000}
                  rows={5}
                />
              </div>

              {fbError && <p className="fbp-error">{fbError}</p>}

              <button
                className="fbp-btn fbp-btn--primary fbp-submit"
                type="submit"
                disabled={fbLoading || !fbText.trim()}
              >
                {fbLoading ? "Sending…" : <><TbSend /> Send feedback</>}
              </button>

              <p className="fbp-note">
                {user ? `Sending as ${user.email}` : "You're sending anonymously — log in to get a reply."}
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
