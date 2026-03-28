    import React from "react";
    import { TbStarFilled } from "react-icons/tb";
    function WordOTD() {
    return (
        <div className="word-otd-page">
        <div className="word-card">
            <div className="word-card-top-ribbon">
            <h2 className="word-otd">jesus christ</h2>
            <button className="bookmark-btn interaction-btn word-otd-bookmark-btn">
                {" "}
                <TbStarFilled className="interaction-icon bookmark-star word-otd-bookmark-icon" />{" "}
            </button>
            </div>
            <p className="word-otd-definition">
            The city never really slept, it just slowed down enough for people to
            pretend it did. Streetlights hummed quietly above empty roads, and
            somewhere in the distance, a dog barked like it had something
            important to say but no one to listen. In a small room on the third

            </p>
            <div className="word-card-bottom-ribbon">
            <span className="phonetic">phonetic</span>
            <span className="syllables">phonetic</span>
            <span className="frequency lexical-badge">phonetic</span>
            <span className="complexity lexical-badge">phonetic</span>
            </div>
            <button className="word-otd-checkout-btn">Checkout the word</button>
        </div>
        </div>
    );
    }

    export default WordOTD;
