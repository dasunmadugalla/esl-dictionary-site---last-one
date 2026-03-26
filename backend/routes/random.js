// backend/routes/randomWordRoutes.js
import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Step 1: Get total count
    const { count, error: countError } = await supabase
      .from("Words")
      .select("*", { head: true, count: "exact" });

    if (countError) return res.status(500).send(countError);

    const randomIndex = Math.floor(Math.random() * count);

    // Step 2: Fetch that row using range
    const { data, error } = await supabase
      .from("Words")
      .select("word")
      .range(randomIndex, randomIndex);

    if (error) return res.status(500).send(error);

    // Step 3: Send the word
    res.send(data[0]); // { word: "randomWordHere" }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

export default router;