import sparkle from "../assets/sparkle.png";
import { useNavigate } from "react-router-dom";
import { IPContext } from "../context/IPContext";
import { useContext } from "react";
import { useToast } from "../context/ToastContext.jsx";

function RandomButton() {
  const navigate = useNavigate();
  const { ip } = useContext(IPContext);
  const { showToast } = useToast();
  const endpoint = `${ip}/random-word`;

  const handleRandom = async () => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Server error");
      const { word } = await response.json();
      navigate(`/word/${word}`);
    } catch (err) {
      showToast("Couldn't load a random word. Try again.");
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
