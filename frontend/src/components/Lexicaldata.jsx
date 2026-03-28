import React from "react";

function Lexicaldata({data}) {
  return (
    <>
      <span className="phonetic">{data.phonetic}</span>
      <span className="syllables">{data.syllables}</span>
      <span className="frequency lexical-badge">{data.frequency}</span>
      <span className="complexity lexical-badge">{data.complexity}</span>
    </>
  );
}

export default Lexicaldata;
