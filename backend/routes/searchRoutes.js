// routes/searchRoutes.js
import express from "express";
import { supabase } from "../supabase.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add-search", verifyUser, async (req, res) => {
  const { word, type = "search" } = req.body;
  const email = req.user.email;

  if (!word) {
    return res.status(400).json({ error: "Word is required" });
  }

  try {
    const { data, error } = await supabase
      .from("searches")
      .insert([{ email, word, type }])
      .select();

    if (error) throw error;

    return res.status(200).json({ message: "Search recorded", data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save search" });
  }
});

export default router;