import React, { useEffect, useState } from "react";
import { TbMail, TbLock, TbEyeOff, TbEye } from "react-icons/tb";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState(
    location.pathname === "/signup" ? "signup" : "login"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);

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
    setTosAccepted(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) { setErrorMsg("Please enter both email and password."); return; }
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
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
    if (!cleanEmail || !password || !confirmPassword) { setErrorMsg("Please fill in all fields."); return; }
    if (!tosAccepted) { setErrorMsg("Please accept the Terms of Service and Privacy Policy."); return; }
    if (password.length < 8) { setErrorMsg("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(password)) { setErrorMsg("Password must contain at least one uppercase letter."); return; }
    if (!/[a-z]/.test(password)) { setErrorMsg("Password must contain at least one lowercase letter."); return; }
    if (!/[0-9]/.test(password)) { setErrorMsg("Password must contain at least one number."); return; }
    if (!/[^A-Za-z0-9]/.test(password)) { setErrorMsg("Password must contain at least one special character."); return; }
    if (password !== confirmPassword) { setErrorMsg("Passwords don't match."); return; }
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

        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${isLogin ? "auth-tab--active" : ""}`} onClick={() => switchMode("login")}>
            Log in
          </button>
          <button type="button" className={`auth-tab ${!isLogin ? "auth-tab--active" : ""}`} onClick={() => switchMode("signup")}>
            Sign up
          </button>
        </div>

        <div className="auth-heading">
          <h1>{isLogin ? "Welcome back" : "Create an account"}</h1>
          <p>{isLogin ? "Log in to continue learning" : "Start your learning journey"}</p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignup} noValidate>
          <div className="auth-input-container">

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
              <button type="button" className="password-visibility-btn" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <TbEye className="auth-input-icon" /> : <TbEyeOff className="auth-input-icon" />}
              </button>
            </div>

            {!isLogin && (
              <div className="auth-input-box">
                <TbLock className="auth-input-icon" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  aria-label="Confirm Password"
                />
                <button type="button" className="password-visibility-btn" onClick={() => setShowConfirm((v) => !v)}>
                  {showConfirm ? <TbEye className="auth-input-icon" /> : <TbEyeOff className="auth-input-icon" />}
                </button>
              </div>
            )}
          </div>

          {!isLogin && (
            <label className="auth-tos-label">
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
              />
              <span>
                I agree to the{" "}
                <a href="/policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                {" "}and{" "}
                <a href="/policy#terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
              </span>
            </label>
          )}

          {errorMsg && <p className="auth-error" role="alert">{errorMsg}</p>}

          <button className="sign-in-btn" type="submit" disabled={isSubmitting || authLoading}>
            {isSubmitting
              ? isLogin ? "Logging in…" : "Creating account…"
              : isLogin ? "Log in" : "Create account"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Auth;
