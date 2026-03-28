import { supabase } from "../supabase.js";

export const verifyUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = data.user;

  next();
};

// Optional auth — attaches req.user if token present, continues as guest if not
export const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  const { data, error } = await supabase.auth.getUser(token);
  req.user = error ? null : data.user;
  next();
};