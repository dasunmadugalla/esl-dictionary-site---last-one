import React from "react";

function Word_snippet({ data }) {
  const techDef = data.technical_definition?.definition?.trim();

  return (
    <div className="word-snippet-wrapper">
      <div className="word-card">

        <div className="word-card-top-ribbon">
          <h2 className="word-otd">{data.word}</h2>
          {!techDef && <h4 className="word-class">{data.meanings[0].part_of_speech}</h4>}
        </div>

        <p className="word-otd-definition">
          {techDef ? techDef : data.meanings[0].definition}
        </p>

        <div className="word-card-bottom-ribbon">
          <span className="phonetic">{data.phonetic}</span>
          <span className="syllables">{data.syllables}</span>
          <span className="frequency lexical-badge">{data.frequency}</span>
          <span className="complexity lexical-badge">{data.complexity}</span>
        </div>

      </div>
    </div>
  );
}

export default Word_snippet;