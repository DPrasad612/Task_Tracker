import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, ArrowLeft, UserPlus, Eye, EyeOff } from "lucide-react";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email address is required";
  if (!EMAIL_REGEX.test(trimmed)) return "Please enter a valid email address";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  return null;
}

export default function SignupPage() {
  const { user, signup, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setLocation("/tracker");
    }
  }, [user, loading, setLocation]);

  const validateForm = (): boolean => {
    const errors: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) errors.name = "Full name is required";
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;
    const passErr = validatePassword(password);
    if (passErr) errors.password = passErr;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setSubmitting(true);
    const result = await signup(name.trim(), email.trim().toLowerCase(), password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || "Failed to create account");
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-screen p-6 relative select-none bg-bg-base bg-grid-pattern">
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-[var(--color-pastel-blue)] dark:bg-[var(--color-pastel-blue)]/10 rounded-full blur-3xl opacity-30 -z-10"></div>

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
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Get Started</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-base">Create Account</h2>
            <p className="text-sm text-text-muted font-medium">Build healthy habits and stay productive.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold flex flex-col gap-1.5">
              <span>{error}</span>
              {error.toLowerCase().includes("already exists") && (
                <span className="font-normal text-text-muted">
                  Already have an account?{" "}
                  <Link href="/login" className="text-indigo-500 hover:underline font-bold">
                    Sign in instead →
                  </Link>
                </span>
              )}
              {error.toLowerCase().includes("unable to connect") && (
                <span className="font-normal text-text-muted">
                  If this keeps happening, your account may have been created — try{" "}
                  <Link href="/login" className="text-indigo-500 hover:underline font-bold">
                    signing in
                  </Link>{" "}
                  with the same email and password.
                </span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-bold text-text-muted uppercase">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })); }}
                placeholder="Jane Smith"
                autoComplete="name"
                className={`px-4 py-3 bg-bg-muted border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-btn-primary transition-all duration-150 text-text-base ${fieldErrors.name ? "border-red-400 dark:border-red-700" : "border-border-base"}`}
              />
              {fieldErrors.name && <p className="text-xs text-red-500 font-semibold mt-0.5">{fieldErrors.name}</p>}
            </div>

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
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
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
              {submitting ? "Creating Account..." : "Create Account"}
              <UserPlus className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-text-muted font-medium border-t border-border-base pt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-500 hover:underline font-bold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
