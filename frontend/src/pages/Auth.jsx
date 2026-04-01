import { useEffect, useRef, useState } from "react";
import { TbMail, TbLock, TbEyeOff, TbEye, TbBrandGoogle } from "react-icons/tb";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState(
    location.pathname === "/signup" ? "signup" : "login"
  );

  // form fields
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [rememberMe,      setRememberMe]      = useState(false);
  const [tosAccepted,     setTosAccepted]     = useState(false);

  // OTP state
  const [otpStep,    setOtpStep]    = useState(false);   // show OTP screen
  const [otp,        setOtp]        = useState(Array(OTP_LENGTH).fill(""));
  const [cooldown,   setCooldown]   = useState(0);
  const otpRefs = useRef([]);

  // shared
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg,     setErrorMsg]     = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  // countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const switchMode = (next) => {
    setMode(next);
    setEmail(""); setPassword(""); setConfirmPassword("");
    setShowPassword(false); setShowConfirm(false);
    setErrorMsg(""); setSuccessMsg("");
    setTosAccepted(false); setOtpStep(false);
    setOtp(Array(OTP_LENGTH).fill(""));
  };

  /* ── Login ──────────────────────────────────────────────── */
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

  /* ── Signup → send OTP ──────────────────────────────────── */
  const handleSignup = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const cleanEmail = email.trim();
    if (!cleanEmail || !password || !confirmPassword) { setErrorMsg("Please fill in all fields."); return; }
    if (!tosAccepted)                    { setErrorMsg("Please accept the Terms of Service and Privacy Policy."); return; }
    if (password.length < 8)             { setErrorMsg("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(password))         { setErrorMsg("Password must contain at least one uppercase letter."); return; }
    if (!/[a-z]/.test(password))         { setErrorMsg("Password must contain at least one lowercase letter."); return; }
    if (!/[0-9]/.test(password))         { setErrorMsg("Password must contain at least one number."); return; }
    if (!/[^A-Za-z0-9]/.test(password))  { setErrorMsg("Password must contain at least one special character."); return; }
    if (password !== confirmPassword)    { setErrorMsg("Passwords don't match."); return; }

    setErrorMsg("");
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({ email: cleanEmail, password });
    setIsSubmitting(false);

    if (error) { setErrorMsg(error.message || "Failed to sign up."); return; }

    // success → switch to OTP screen
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpStep(true);
    setCooldown(RESEND_COOLDOWN);
    setSuccessMsg(`We sent a 6-digit code to ${cleanEmail}`);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  /* ── OTP input handling ─────────────────────────────────── */
  const handleOtpChange = (index, value) => {
    // allow paste of full code
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      const next = Array(OTP_LENGTH).fill("");
      digits.forEach((d, i) => { next[i] = d; });
      setOtp(next);
      const focusIdx = Math.min(digits.length, OTP_LENGTH - 1);
      setTimeout(() => otpRefs.current[focusIdx]?.focus(), 0);
      return;
    }
    const digit = value.replace(/\D/g, "");
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  /* ── Verify OTP ─────────────────────────────────────────── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const code = otp.join("");
    if (code.length < OTP_LENGTH) { setErrorMsg("Please enter the full 6-digit code."); return; }
    setErrorMsg("");
    setIsSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "signup",
    });
    setIsSubmitting(false);
    if (error) { setErrorMsg(error.message || "Invalid or expired code. Try again."); return; }
    navigate("/", { replace: true });
  };

  /* ── Resend OTP ─────────────────────────────────────────── */
  const handleResend = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setErrorMsg(""); setSuccessMsg("");
    setIsSubmitting(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    setIsSubmitting(false);
    if (error) { setErrorMsg(error.message || "Failed to resend. Try again."); return; }
    setOtp(Array(OTP_LENGTH).fill(""));
    setCooldown(RESEND_COOLDOWN);
    setSuccessMsg("A new code has been sent.");
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const isLogin = mode === "login";

  return (
    <div className="auth-layout">

      {/* ── LEFT: form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-inner">

          <Link to="/" className="auth-logo">Lexify</Link>

          {/* ════ OTP SCREEN ════ */}
          {otpStep ? (
            <>
              <div className="auth-heading">
                <h1>Check your email</h1>
                <p>{successMsg || `Enter the 6-digit code sent to ${email.trim()}`}</p>
              </div>

              <form onSubmit={handleVerifyOtp} noValidate>
                <div className="otp-input-row">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      className="otp-box"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onFocus={e => e.target.select()}
                    />
                  ))}
                </div>

                {errorMsg && <p className="auth-error">{errorMsg}</p>}

                <button
                  className="auth-submit-btn"
                  type="submit"
                  disabled={isSubmitting || otp.join("").length < OTP_LENGTH}
                >
                  {isSubmitting ? "Verifying…" : "Verify email"}
                </button>
              </form>

              <p className="auth-switch">
                Didn't receive it?{" "}
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isSubmitting}
                  style={{ color: cooldown > 0 ? "#aaa" : "#0057ff" }}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </p>

              <p className="auth-switch">
                <button type="button" className="auth-switch-btn" onClick={() => setOtpStep(false)}>
                  ← Back to sign up
                </button>
              </p>
            </>
          ) : (
          /* ════ LOGIN / SIGNUP SCREEN ════ */
          <>
            <div className="auth-heading">
              <h1>{isLogin ? "Log in to your Account" : "Create your Account"}</h1>
              <p>{isLogin ? "Welcome back! Select method to log in:" : "Join us today. Select method to sign up:"}</p>
            </div>

            <div className="auth-socials">
              <button type="button" className="auth-social-btn">
                <TbBrandGoogle className="auth-social-icon" />
                Google
              </button>
              <button type="button" className="auth-social-btn">
                <svg className="auth-social-icon" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>

            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">or continue with email</span>
              <span className="auth-divider-line" />
            </div>

            <form onSubmit={isLogin ? handleLogin : handleSignup} noValidate>

              <div className="auth-field">
                <div className="auth-input-box">
                  <TbMail className="auth-input-icon" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-input-box">
                  <TbLock className="auth-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <TbEye className="auth-input-icon" /> : <TbEyeOff className="auth-input-icon" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="auth-field">
                  <div className="auth-input-box">
                    <TbLock className="auth-input-icon" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(v => !v)}>
                      {showConfirm ? <TbEye className="auth-input-icon" /> : <TbEyeOff className="auth-input-icon" />}
                    </button>
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="auth-meta-row">
                  <label className="auth-remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="auth-forgot-btn">Forgot Password?</button>
                </div>
              )}

              {!isLogin && (
                <label className="auth-tos-label">
                  <input
                    type="checkbox"
                    checked={tosAccepted}
                    onChange={e => setTosAccepted(e.target.checked)}
                  />
                  <span>
                    I agree to the{" "}
                    <a href="/policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                    {" "}and{" "}
                    <a href="/policy#terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                  </span>
                </label>
              )}

              {errorMsg && <p className="auth-error">{errorMsg}</p>}

              <button className="auth-submit-btn" type="submit" disabled={isSubmitting || authLoading}>
                {isSubmitting
                  ? (isLogin ? "Logging in…" : "Creating account…")
                  : (isLogin ? "Log in" : "Create account")}
              </button>

            </form>

            <p className="auth-switch">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => switchMode(isLogin ? "signup" : "login")}
              >
                {isLogin ? "Create an account" : "Log in"}
              </button>
            </p>
          </>
          )}

        </div>
      </div>

      {/* ── RIGHT: image panel ── */}
      <div className="auth-image-panel" />

    </div>
  );
}

export default Auth;
