import React, { useEffect, useState } from "react";
import { TbMail, TbLock, TbEyeOff, TbEye } from "react-icons/tb";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  // start in signup mode if coming from /signup
  const [mode, setMode] = useState(
    location.pathname === "/signup" ? "signup" : "login"
  );

  // shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // signup-only fields
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  const switchMode = (next) => {
    setMode(next);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
    setErrorMsg("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) { setErrorMsg(error.message || "Failed to sign in."); return; }
      navigate("/", { replace: true });
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const cleanEmail = email.trim();
    if (!cleanEmail || !password || !confirmPassword) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords don't match.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({ email: cleanEmail, password });
    setIsSubmitting(false);
    if (error) { setErrorMsg(error.message || "Failed to sign up."); return; }
    navigate("/", { replace: true });
  };

  const isLogin = mode === "login";

  return (
    <div className="auth-main">
      <div className="auth-box">
        {/* ── Tab toggle ── */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${isLogin ? "auth-tab--active" : ""}`}
            onClick={() => switchMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? "auth-tab--active" : ""}`}
            onClick={() => switchMode("signup")}
          >
            Sign up
          </button>
        </div>

        {/* ── Heading ── */}
        <span className="auth-heading">
          <h1>{isLogin ? "Welcome back" : "Create an account"}</h1>
          <p>{isLogin ? "Log in to your account" : "Enter your details to get started"}</p>
        </span>

        {/* ── Form ── */}
        <form onSubmit={isLogin ? handleLogin : handleSignup} noValidate>
          <div className="auth-input-container">
            {/* Email */}
            <div className="auth-input-box">
              <TbMail className="auth-input-icon" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                aria-label="Email"
              />
            </div>

            {/* Password */}
            <div className="auth-input-box">
              <TbLock className="auth-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                aria-label="Password"
              />
              <button
                type="button"
                className="password-visibility-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <TbEye className="auth-input-icon" /> : <TbEyeOff className="auth-input-icon" />}
              </button>
            </div>

            {/* Confirm password — signup only */}
            {!isLogin && (
              <div className="auth-input-box">
                <TbLock className="auth-input-icon" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  aria-label="Confirm Password"
                />
                <button
                  type="button"
                  className="password-visibility-btn"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <TbEye className="auth-input-icon" /> : <TbEyeOff className="auth-input-icon" />}
                </button>
              </div>
            )}
          </div>

          {errorMsg && <p className="auth-error" role="alert">{errorMsg}</p>}

          <button
            className="sign-in-btn"
            type="submit"
            disabled={isSubmitting || authLoading}
            aria-busy={isSubmitting || authLoading}
          >
            {isSubmitting
              ? isLogin ? "Logging in..." : "Creating account..."
              : isLogin ? "Log in" : "Create account"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Auth;
