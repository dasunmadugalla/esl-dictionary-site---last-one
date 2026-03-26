import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, wordID } = req.body;

  if (!email || !wordID) {
    return res.status(400).json({ error: "email and wordID are required" });
  }

  try {
    // 1) Check if a bookmark row already exists for this user+word
    const { data: existing, error: fetchErr } = await supabase
      .from("Bookmarks")
      .select("id")
      .eq("email", email)
      .eq("wordIDs", wordID)
      .maybeSingle();

    if (fetchErr) {
      console.error("Error checking existing bookmark:", fetchErr);
      return res.status(500).json({ error: "Failed to check bookmarks" });
    }

    if (existing) {
      // 2) If exists -> remove it (unbookmark)
      const { error: delErr } = await supabase
        .from("Bookmarks")
        .delete()
        .eq("id", existing.id);

      if (delErr) {
        console.error("Error deleting bookmark:", delErr);
        return res.status(500).json({ error: "Failed to remove bookmark" });
      }

      return res.json({ bookmarked: false });
    } else {
      // 3) If not exists -> insert it (bookmark)
      const { data: insertData, error: insertErr } = await supabase
        .from("Bookmarks")
        .insert([{ email, wordIDs: wordID }]);

      if (insertErr) {
        console.error("Error inserting bookmark:", insertErr);
        return res.status(500).json({ error: "Failed to add bookmark" });
      }

      return res.json({ bookmarked: true, data: insertData });
    }
  } catch (err) {
    console.error("Bookmark route error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;