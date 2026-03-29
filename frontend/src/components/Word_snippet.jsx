function Word_snippet({ data }) {
  const techDef  = data.technical_definition?.definition?.trim();
  const meaning  = data.meanings[0];
  const pos      = meaning.part_of_speech;
  const definition = techDef ? techDef : meaning.definition;

  // pull first example sentence if available
  const exArr    = meaning.example;
  const example  = Array.isArray(exArr)
    ? exArr[0]?.sentence
    : typeof exArr === "string" ? exArr : null;

  const watermark = data.word?.[0]?.toUpperCase() || "";

  return (
    <div className="ws-wrapper">
      <div className="ws-card">

        {/* Warm amber accent stripe */}
        <div className="ws-accent-stripe" aria-hidden="true" />

        {/* Giant faint watermark letter */}
        <span className="ws-watermark" aria-hidden="true">{watermark}</span>

        <div className="ws-body">

          {/* Word + POS row */}
          <div className="ws-top">
            <h2 className="ws-word">{data.word}</h2>
            {!techDef && <span className="ws-pos">{pos}</span>}
          </div>

          <div className="ws-divider" />

          {/* Definition */}
          <p className="ws-definition">{definition}</p>

          {/* Example sentence — the ESL hook */}
          {example && (
            <p className="ws-example">"{example}"</p>
          )}

          {/* Footer */}
          <div className="ws-footer">
            {data.phonetic  && <span className="ws-phonetic">{data.phonetic}</span>}
            {data.syllables && <span className="ws-syllables">{data.syllables}</span>}
            <span className="ws-footer-spacer" />
            {data.frequency  && <span className="ws-badge ws-badge--freq">{data.frequency}</span>}
            {data.complexity && <span className="ws-badge ws-badge--complex">{data.complexity}</span>}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Word_snippet;
