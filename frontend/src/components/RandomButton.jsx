import sparkle from "../assets/sparkle.png";
import { useNavigate } from "react-router-dom";
import { IPContext } from "../context/IPContext";
import { useContext } from "react";

function RandomButton() {
  const navigate = useNavigate();
  const { ip } = useContext(IPContext);
  const endpoint = `${ip}:3000/random-word`; // include http://

  const handleRandom = async () => {
    try {
      const response = await fetch(endpoint);
      const { word } = await response.json(); // directly destructure
      navigate(`/word/${word}`);
    } catch (err) {
      console.error("Failed to fetch random word:", err);
    }
  };

  return (
    <button className="btn btn-black random-word-btn" onClick={handleRandom}>
      <img src={sparkle} className="sparkle-img" />
      Learn a Random Word
    </button>
  );
}

export default RandomButton;