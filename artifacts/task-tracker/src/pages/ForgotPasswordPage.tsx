import React, { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, KeyRound, RefreshCw } from "lucide-react";
import { API_URL } from "@/lib/api";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email address is required");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { /* non-JSON */ }

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Unable to connect. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-screen p-6 relative select-none bg-bg-base bg-grid-pattern">
      <div className="absolute top-10 left-10 w-72 h-72 bg-[var(--color-pastel-blue)] dark:bg-[var(--color-pastel-blue)]/10 rounded-full blur-3xl opacity-30 -z-10"></div>

      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-base mb-8 transition-colors duration-150 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        <div className="bg-bg-card border border-border-base rounded-3xl p-8 shadow-xl flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Password Reset</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-base">Forgot Password?</h2>
            <p className="text-sm text-text-muted font-medium">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-2xl flex flex-col gap-2">
                <p className="text-xs font-bold text-green-700 dark:text-green-400">Check your email</p>
                <p className="text-xs text-text-muted font-medium leading-relaxed">
                  If <strong>{email}</strong> is registered, you'll receive a password reset link shortly. The link expires in <strong>1 hour</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => { setSubmitted(false); setEmail(""); }}
                className="text-xs text-text-muted hover:text-text-base flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-bold text-text-muted uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className={`px-4 py-3 bg-bg-muted border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-btn-primary transition-all duration-150 text-text-base ${emailError ? "border-red-400 dark:border-red-700" : "border-border-base"}`}
                />
                {emailError && (
                  <p className="text-xs text-red-500 font-semibold mt-0.5">{emailError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full py-3.5 bg-btn-primary text-text-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-150 shadow-md cursor-pointer"
              >
                {submitting ? "Sending..." : "Send Reset Link"}
                <KeyRound className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="text-center text-xs text-text-muted font-medium border-t border-border-base pt-4">
            Remembered your password?{" "}
            <Link href="/login" className="text-indigo-500 hover:underline font-bold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
