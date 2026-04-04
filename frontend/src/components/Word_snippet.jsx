function Word_snippet({ data }) {
  const techDef   = data.technical_definition?.definition?.trim();
  const meaning   = data.meanings[0];
  const pos       = meaning.part_of_speech;
  const definition = techDef ? techDef : meaning.definition;

  const exArr  = meaning.example;
  const example = Array.isArray(exArr)
    ? exArr[0]?.sentence
    : typeof exArr === "string" ? exArr : null;

  return (
    <div className="ws-wrapper">
      <div className="ws-card">

        {/* ── Decorative circles (top-right, like the reference cards) ── */}
        <div className="ws-deco" aria-hidden="true">
          <div className="ws-circle ws-circle--1" />
          <div className="ws-circle ws-circle--2" />
          <div className="ws-circle ws-circle--3" />
        </div>

        {/* ── Header row ── */}
        <div className="ws-header">
          <span className="ws-brand">Grasperr</span>
          {!techDef && <span className="ws-pos">{pos}</span>}
        </div>

        {/* ── Word ── */}
        <div className="ws-body">
          <h2 className="ws-word">{data.word}</h2>

          {/* Phonetic + syllables under the word */}
          <div className="ws-sub">
            {data.phonetic  && <span className="ws-phonetic">{data.phonetic}</span>}
            {data.syllables && <span className="ws-syllables">{data.syllables}</span>}
          </div>

          <div className="ws-divider" />

          <p className="ws-definition">{definition}</p>

          {example && (
            <p className="ws-example">"{example}"</p>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="ws-footer">
          <div className="ws-footer-badges">
            {data.frequency && <span className="ws-badge ws-badge--freq">{data.frequency}</span>}
          </div>
          <span className="ws-footer-site">grasperr.com</span>
        </div>

      </div>
    </div>
  );
}

export default Word_snippet;
