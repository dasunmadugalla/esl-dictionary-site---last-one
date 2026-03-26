// src/pages/Auth.jsx
import React, { useEffect, useState } from "react";
import { TbMail, TbLock, TbEyeOff, TbEye } from "react-icons/tb";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext.jsx";

function Auth() {
  const navigate = useNavigate();

  // auth state from global context
  const { user, loading: authLoading } = useAuth();

  // local form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setVisibility] = useState(false);

  // submission / ui state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // If user is already logged in (and auth finished loading), redirect to home
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        setErrorMsg(error.message || "Failed to sign in.");
        setIsSubmitting(false);
        return;
      }

      // signInWithPassword succeeded. AuthContext's onAuthStateChange will update `user`.
      // Optionally wait a moment for context to update, then navigate.
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-main">
      <div className="auth-box">
        <span className="txt-box">
          <h1>Log in to your account</h1>
          <p>Welcome back! Select method to login</p>
        </span>

        <form onSubmit={handleLogin} noValidate>
          <div className="auth-input-container">
            <div className="auth-input-box email-box">
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

            <div className="auth-input-box password-box">
              <TbLock className="auth-input-icon" />
              <input
                type={isVisible ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                aria-label="Password"
              />

              <button
                type="button"
                className="pass-visibility-Btn"
                onClick={() => setVisibility((v) => !v)}
                aria-label={isVisible ? "Hide password" : "Show password"}
              >
                {isVisible ? (
                  <TbEye className="auth-input-icon" />
                ) : (
                  <TbEyeOff className="auth-input-icon" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && <p className="auth-error" role="alert">{errorMsg}</p>}

          <button
            className="signBtn"
            type="submit"
            disabled={isSubmitting || authLoading}
            aria-busy={isSubmitting || authLoading}
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="acc-txt">
          Don't have an account?{" "}
          <Link to="/signup" className="crAcc-txt">
            create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Auth;