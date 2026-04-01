// routes/searchRoutes.js
import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.post("/add-search", async (req, res) => {
  const { email, word, type = "search" } = req.body;

  if (!email || !word) {
    return res.status(400).json({ error: "Email and word are required" });
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