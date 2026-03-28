import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { supabase } from "../supabase.js";

const router = express.Router();

// DELETE /account — wipe all user data and delete the auth account
router.delete("/", verifyUser, async (req, res) => {
  const { email, id: userId } = req.user;

  try {
    // Delete all user data in parallel
    await Promise.all([
      supabase.from("searches").delete().eq("email", email),
      supabase.from("Bookmarks").delete().eq("email", email),
      supabase.from("CollectionWords").delete().eq("email", email),
      supabase.from("Collections").delete().eq("email", email),
    ]);

    // Delete the auth user (requires service role key)
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Auth delete error:", error);
      return res.status(500).json({ error: "Failed to delete account." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Failed to delete account." });
  }
});

export default router;
