import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [location, setLocation] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`, {
      credentials: "include",
    })
      .then(async (res) => {
        setTokenValid(res.ok);
      })
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errors: { password?: string; confirm?: string } = {};

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (!confirm) {
      errors.confirm = "Please confirm your password";
    } else if (password !== confirm) {
      errors.confirm = "Passwords do not match";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { /* non-JSON */ }

      if (!res.ok) {
        setError(data.error || "Failed to reset password. Please request a new link.");
      } else {
        setSuccess(true);
        setTimeout(() => setLocation("/login"), 3000);
      }
    } catch {
      setError("Unable to connect. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-bg-base">
        <div className="text-text-muted text-sm font-medium animate-pulse">Validating reset link…</div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen p-6 bg-bg-base bg-grid-pattern">
        <div className="w-full max-w-md">
          <div className="bg-bg-card border border-border-base rounded-3xl p-8 shadow-xl flex flex-col gap-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-text-base">Link Expired or Invalid</h2>
              <p className="text-sm text-text-muted font-medium leading-relaxed">
                This reset link has already been used or has expired. Reset links are valid for <strong>1 hour</strong>.
              </p>
            </div>
            <Link
              href="/forgot-password"
              className="w-full py-3.5 bg-btn-primary text-text-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 shadow-md text-sm"
            >
              Request a New Link
              <KeyRound className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="text-xs text-indigo-500 hover:underline font-bold"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen p-6 bg-bg-base bg-grid-pattern">
        <div className="w-full max-w-md">
          <div className="bg-bg-card border border-border-base rounded-3xl p-8 shadow-xl flex flex-col gap-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-text-base">Password Updated!</h2>
              <p className="text-sm text-text-muted font-medium">
                Your password has been changed successfully. Redirecting you to sign in…
              </p>
            </div>
            <Link
              href="/login"
              className="w-full py-3.5 bg-btn-primary text-text-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 shadow-md text-sm"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-screen p-6 relative select-none bg-bg-base bg-grid-pattern">
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[var(--color-pastel-green)] dark:bg-[var(--color-pastel-green)]/10 rounded-full blur-3xl opacity-30 -z-10"></div>

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
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">New Password</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-base">Reset Password</h2>
            <p className="text-sm text-text-muted font-medium">Choose a strong password with at least 8 characters.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold text-text-muted uppercase">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  autoFocus
                  className={`w-full px-4 py-3 pr-12 bg-bg-muted border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-btn-primary transition-all duration-150 text-text-base ${fieldErrors.password ? "border-red-400 dark:border-red-700" : "border-border-base"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-500 font-semibold mt-0.5">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-xs font-bold text-text-muted uppercase">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  id="confirm"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setFieldErrors((p) => ({ ...p, confirm: undefined })); }}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 pr-12 bg-bg-muted border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-btn-primary transition-all duration-150 text-text-base ${fieldErrors.confirm ? "border-red-400 dark:border-red-700" : "border-border-base"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirm && (
                <p className="text-xs text-red-500 font-semibold mt-0.5">{fieldErrors.confirm}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3.5 bg-btn-primary text-text-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-150 shadow-md cursor-pointer"
            >
              {submitting ? "Updating Password..." : "Set New Password"}
              <KeyRound className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
