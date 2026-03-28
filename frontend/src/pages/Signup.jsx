import React, { useEffect, useState } from "react";
import { TbMail, TbLock, TbEyeOff, TbEye } from "react-icons/tb";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";

function Signup() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

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

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || "Failed to sign up.");
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <div className="auth-main">
      <div className="auth-box">
        <span className="auth-heading">
          <h1>Create an account</h1>
          <p>Enter your details to get started</p>
        </span>

        <form onSubmit={handleSignup} noValidate>
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
                autoComplete="new-password"
                required
                aria-label="Password"
              />
              <button
                type="button"
                className="password-visibility-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <TbEye className="auth-input-icon" />
                ) : (
                  <TbEyeOff className="auth-input-icon" />
                )}
              </button>
            </div>

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
                {showConfirm ? (
                  <TbEye className="auth-input-icon" />
                ) : (
                  <TbEyeOff className="auth-input-icon" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="auth-error" role="alert">
              {errorMsg}
            </p>
          )}

          <button
            className="sign-in-btn"
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Sending OTP..." : "Create account"}
          </button>
        </form>

        <p className="account-prompt">
          Already have an account?{" "}
          <Link to="/auth" className="create-account-link">
            log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
