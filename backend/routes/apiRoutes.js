import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { supabase } from "../supabase.js";

const router = express.Router();

router.get("/public", (req, res) => {
  res.json({ message: "Public route works" });
});

router.get("/private", verifyUser, (req, res) => {
  res.json({
    message: "Private route works",
    user: req.user
  });
});


export default router;