import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, ArrowLeft, LogIn, Eye, EyeOff } from "lucide-react";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setLocation("/tracker");
    }
  }, [user, loading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Email address is required";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }
    if (!password) {
      errors.password = "Password is required";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim().toLowerCase(), password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || "Invalid email or password");
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-screen p-6 relative select-none bg-bg-base bg-grid-pattern">
      <div className="absolute top-10 right-10 w-72 h-72 bg-[var(--color-pastel-pink)] dark:bg-[var(--color-pastel-pink)]/10 rounded-full blur-3xl opacity-30 -z-10"></div>

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-base mb-8 transition-colors duration-150 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-bg-card border border-border-base rounded-3xl p-8 shadow-xl flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Welcome Back</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-base">Sign In</h2>
            <p className="text-sm text-text-muted font-medium">Continue your weekly progress tracker.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold text-text-muted uppercase">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
                placeholder="you@example.com"
                autoComplete="email"
                className={`px-4 py-3 bg-bg-muted border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-btn-primary transition-all duration-150 text-text-base ${fieldErrors.email ? "border-red-400 dark:border-red-700" : "border-border-base"}`}
              />
              {fieldErrors.email && <p className="text-xs text-red-500 font-semibold mt-0.5">{fieldErrors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold text-text-muted uppercase">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
              {fieldErrors.password && <p className="text-xs text-red-500 font-semibold mt-0.5">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3.5 bg-btn-primary text-text-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-150 shadow-md cursor-pointer"
            >
              {submitting ? "Signing In..." : "Sign In"}
              <LogIn className="w-4 h-4" />
            </button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-xs text-text-muted hover:text-indigo-500 font-semibold transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          <div className="text-center text-xs text-text-muted font-medium border-t border-border-base pt-6">
            Don't have an account?{" "}
            <Link href="/signup" className="text-indigo-500 hover:underline font-bold">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
