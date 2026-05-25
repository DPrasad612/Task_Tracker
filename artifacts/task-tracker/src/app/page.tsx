"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  Layout,
  Layers
} from "lucide-react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/tracker");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-text-muted font-semibold">Loading Productivity Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden select-none">
      {/* Decorative Blur Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50 -z-10 animate-pulse" style={{ animationDelay: "2s" }}></div>

      <div className="max-w-4xl w-full text-center flex flex-col items-center gap-8 py-12 md:py-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 shadow-sm animate-bounce">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Inspired by Notion + Habitica + TickTick</span>
        </div>

        {/* Hero Title */}
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-text-base leading-tight">
            Track weekly habits with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600">gorgeous pastels</span>
          </h1>
          <p className="max-w-2xl text-lg md:text-xl text-text-muted font-medium mx-auto">
            A premium full-stack task tracker that features nested subtasks, visual streaks, strict completion locks, and Github-style heatmaps.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="px-8 py-4 bg-btn-primary text-text-primary rounded-2xl shadow-lg hover:shadow-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-bg-card text-text-base border border-border-base rounded-2xl shadow-sm hover:shadow-md hover:bg-bg-muted font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Sign In
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 md:mt-24 text-left">
          <div className="p-6 bg-bg-card border border-border-base rounded-3xl shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 text-blue-500 rounded-2xl flex items-center justify-center shadow-inner">
              <Layout className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-text-base">Weekly Date Grid</h3>
            <p className="text-sm text-text-muted font-medium">
              View your week at a glance with weekday names and exact calendar dates.
            </p>
          </div>

          <div className="p-6 bg-bg-card border border-border-base rounded-3xl shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-950 text-green-500 rounded-2xl flex items-center justify-center shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-text-base">Recursive Subtasks</h3>
            <p className="text-sm text-text-muted font-medium">
              Break tasks down into infinite subtask layers that automatically roll up parent completion.
            </p>
          </div>

          <div className="p-6 bg-bg-card border border-border-base rounded-3xl shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950 text-purple-500 rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-text-base">Strict Completion Lock</h3>
            <p className="text-sm text-text-muted font-medium">
              Daily tasks lock once the day passes, building discipline and honest, un-cheatable streaks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
