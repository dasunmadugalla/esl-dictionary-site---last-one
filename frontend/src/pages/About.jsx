import { useNavigate } from "react-router-dom";
import "../styles/about.css";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="about-page">

      <div className="about-header">
        <p className="about-eyebrow">About</p>
        <h1 className="about-title">
          Built for the 1.5 billion people learning English as a second language.
        </h1>
      </div>

      <div className="about-intro">
        <p>
          You find a word you don't know. You look it up. The definition is harder
          to understand than the word itself. That frustration is the reason this exists.
        </p>
        <p>
          Every major dictionary is built for native speakers — written by academics,
          optimized for comprehensiveness, not clarity. This was built to be different.
          Clear definitions. Real examples. A tool that actually speaks your language.
        </p>
      </div>

      <div className="about-principles">
        <div className="about-principle">
          <span className="about-principle-num">01</span>
          <div>
            <p className="about-principle-title">Learning first</p>
            <p className="about-principle-body">Every decision starts with one question — does this help someone learn better?</p>
          </div>
        </div>
        <div className="about-principle">
          <span className="about-principle-num">02</span>
          <div>
            <p className="about-principle-title">Built together</p>
            <p className="about-principle-body">The best features came from real feedback from real learners. Always will.</p>
          </div>
        </div>
        <div className="about-principle">
          <span className="about-principle-num">03</span>
          <div>
            <p className="about-principle-title">No fluff</p>
            <p className="about-principle-body">Clear definitions. Real examples. Honest difficulty levels. Nothing more.</p>
          </div>
        </div>
        <div className="about-principle">
          <span className="about-principle-num">04</span>
          <div>
            <p className="about-principle-title">Always growing</p>
            <p className="about-principle-body">This site is never finished. Neither is learning.</p>
          </div>
        </div>
      </div>

      <div className="about-footer-row">
        <p className="about-footer-text">Found something missing? Have an idea? Every submission gets read and acted on.</p>
        <button className="about-cta-btn" onClick={() => navigate("/feedback")}>
          Share feedback &rarr;
        </button>
      </div>

    </div>
  );
}
