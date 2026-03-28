import express from "express";

const router = express.Router();

// GET /image/:word — proxy Pixabay so the API key stays server-side
router.get("/:word", async (req, res) => {
  const { word } = req.params;
  const key = process.env.VITE_PIXABAY_KEY;

  try {
    const url =
      `https://pixabay.com/api/?key=${key}` +
      `&q=${encodeURIComponent(word)}` +
      `&image_type=photo` +
      `&orientation=horizontal` +
      `&safesearch=true` +
      `&per_page=5` +
      `&min_width=300`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.hits?.length) return res.json({ imageUrl: null });

    res.json({ imageUrl: data.hits[0].webformatURL });
  } catch (err) {
    res.json({ imageUrl: null });
  }
});

export default router;
