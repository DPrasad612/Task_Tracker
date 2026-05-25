import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, ArrowLeft, LogIn } from "lucide-react";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setLocation("/tracker");
    }
  }, [user, loading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || "Failed to log in");
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-screen p-6 relative select-none bg-bg-base bg-grid-pattern">
      <div className="absolute top-10 right-10 w-72 h-72 bg-[var(--color-pastel-pink)] dark:bg-[var(--color-pastel-pink)]/10 rounded-full blur-3xl opacity-40 -z-10"></div>

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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold text-text-muted uppercase">Email Address</label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="px-4 py-3 bg-bg-muted border border-border-base rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-btn-primary transition-all duration-150 text-text-base"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold text-text-muted uppercase">Password</label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="px-4 py-3 bg-bg-muted border border-border-base rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-btn-primary transition-all duration-150 text-text-base"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3.5 bg-btn-primary text-text-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-150 shadow-md cursor-pointer"
            >
              {submitting ? "Signing In..." : "Sign In"}
              <LogIn className="w-4 h-4" />
            </button>
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
