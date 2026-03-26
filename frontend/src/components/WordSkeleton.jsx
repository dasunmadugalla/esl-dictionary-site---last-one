import React from "react";

export default function WordSkeleton() {
  return (
    <div className="sk-wrap">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="sk-header">
        <div className="sk-upper">
          <div className="sk sk-word" />
          <div className="sk sk-speaker" />
          <div className="sk-icons">
            <div className="sk sk-icon" />
            <div className="sk sk-icon" />
            <div className="sk sk-icon" />
          </div>
        </div>

        <div className="sk-details">
          <div className="sk sk-phonetic" />
          <div className="sk sk-syllable" />
          <div className="sk sk-badge" />
          <div className="sk sk-badge" />
        </div>
      </div>

      {/* ── Technical definition ────────────────────────────── */}
      <div className="sk-tech">
        <div className="sk sk-tech-title" />
        <div className="sk sk-tech-line" style={{ width: "100%" }} />
        <div className="sk sk-tech-line" style={{ width: "88%" }} />
        <div className="sk sk-tech-line" style={{ width: "72%" }} />
      </div>

      {/* ── Definition blocks ───────────────────────────────── */}
      {[1, 2].map((i) => (
        <div className="sk-def-block" key={i}>
          <div className="sk sk-pos" />
          <div className="sk sk-def-line" style={{ width: "100%" }} />
          <div className="sk sk-def-line" style={{ width: "82%" }} />

          <div className="sk-ex">
            <div className="sk sk-ex-line" style={{ width: "94%" }} />
            <div className="sk sk-ex-line" style={{ width: "70%" }} />
            <div className="sk sk-ex-line" style={{ width: "60%" }} />
          </div>

          <div className="sk-rels">
            <div className="sk-rel-group">
              <div className="sk sk-pill" />
              <div className="sk sk-pill-sm" />
              <div className="sk sk-pill" />
            </div>
            <div className="sk-rel-group">
              <div className="sk sk-pill-sm" />
              <div className="sk sk-pill" />
            </div>
          </div>
        </div>
      ))}

      {/* ── Related words ribbon ─────────────────────────────── */}
      <div className="sk-ribbon">
        <div className="sk sk-ribbon-label" />
        {[1, 2, 3, 4].map((i) => (
          <div className="sk sk-ribbon-pill" key={i} />
        ))}
      </div>

    </div>
  );
}