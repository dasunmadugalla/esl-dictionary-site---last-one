import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const OTP_LENGTH = 6;

function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  // If no email in state, redirect to signup
  useEffect(() => {
    if (!email) navigate("/signup", { replace: true });
  }, [email, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setErrorMsg("");

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const token = digits.join("");
    if (token.length < OTP_LENGTH) {
      setErrorMsg("Please enter the full 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || "Invalid or expired code. Try again.");
      return;
    }

    navigate("/", { replace: true });
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      setErrorMsg(error.message || "Failed to resend. Try again.");
    } else {
      setSuccessMsg("A new code has been sent to your email.");
      setResendCooldown(60);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="auth-main">
      <div className="auth-box">
        <span className="auth-heading">
          <h1>Check your email</h1>
          <p>
            We sent a 6-digit code to{" "}
            <strong style={{ color: "#111" }}>{email}</strong>
          </p>
        </span>

        <form onSubmit={handleVerify} noValidate>
          <div className="otp-input-row">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                className="otp-box"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {errorMsg && (
            <p className="auth-error" role="alert">
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <p className="auth-success" role="status">
              {successMsg}
            </p>
          )}

          <button
            className="sign-in-btn"
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify"}
          </button>
        </form>

        <p className="account-prompt">
          Didn't get a code?{" "}
          <button
            className="create-account-link resend-btn"
            onClick={handleResend}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
          </button>
        </p>

        <p className="account-prompt">
          <Link to="/signup" className="create-account-link">
            ← Back to sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyOTP;
