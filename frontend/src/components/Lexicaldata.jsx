import React from "react";

function Lexicaldata({data}) {
  return (
    <>
      <span className="phonetic">{data.phonetic}</span>
      <span className="syllables">{data.syllables}</span>
      <span className="frequency lexi-btn">{data.frequency}</span>
      <span className="complexity lexi-btn">{data.complexity}</span>
    </>
  );
}

export default Lexicaldata;
