import React, { useState } from 'react'
import { TbCopy, TbCheck } from "react-icons/tb";

function Url_snippet({ url, visible  }) {
  const [copied, setCopied] = useState(false);

  const fallbackCopy = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        fallbackCopy(url);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className={`url-snippet-card ${visible ? "show" : ""}`}>
      <p className="url-txt">{url}</p>

      <button 
        className="url-copy-btn"
        onClick={handleCopy}
      >
        {copied ? (
          <TbCheck className='url-copy-icon success'/>
        ) : (
          <TbCopy className='url-copy-icon'/>
        )}
      </button>
    </div>
  )
}

export default Url_snippet;