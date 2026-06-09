import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";
import { API_URL } from "@/lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { 
  Trophy, TrendingUp, Sparkles, CheckCircle, Clock, Flame,
  AlertCircle, BarChart2, PieChart as PieIcon, CalendarDays
} from "lucide-react";

interface AnalyticsData {
  todayProgress: number;
  completedToday: number;
  totalToday: number;
  currentStreak: number;
  weeklyData: { day: string; date: string; rate: number; completed: number }[];
  heatmapData: { date: string; count: number }[];
  mostProductiveDay: string;
  priorityStats: { low: number; medium: number; high: number };
  categoryStats: { name: string; value: number }[];
  insight: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const fetchAnalytics = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/analytics`, { credentials: "include" });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-text-muted font-semibold">Loading Productivity Insights...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold">Failed to load analytics</h3>
        <p className="text-sm text-text-muted">Please refresh the page or check your connection.</p>
      </div>
    );
  }

  const renderGithubHeatmap = () => {
    const totalDays = 112;
    const squares = [];
    const dateMap = new Map(data.heatmapData.map((d) => [d.date, d.count]));

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const count = dateMap.get(dateStr) || 0;

      let colorClass = "bg-bg-muted border border-border-base/40";
      if (count === 1) colorClass = "bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200/20";
      else if (count === 2) colorClass = "bg-emerald-200 dark:bg-emerald-900/60 border border-emerald-300/20";
      else if (count === 3) colorClass = "bg-emerald-300 dark:bg-emerald-800/80 border border-emerald-400/20";
      else if (count >= 4) colorClass = "bg-emerald-500 text-white border border-emerald-600/20";

      squares.push(
        <div
          key={dateStr}
          className={`w-3.5 h-3.5 rounded-sm transition-all duration-200 hover:scale-125 cursor-pointer relative group ${colorClass}`}
          title={`${dateStr}: ${count} task${count === 1 ? "" : "s"} completed`}
        >
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 bg-text-base text-bg-base text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap">
            {dateStr}: {count} completed
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto no-scrollbar py-2">
          {squares}
        </div>
        <div className="flex items-center justify-end gap-1.5 text-[10px] text-text-muted font-bold">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-bg-muted" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-100 dark:bg-emerald-950/40" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-300 dark:bg-emerald-800/80" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span>More</span>
        </div>
      </div>
    );
  };

  const pendingCount = Math.max(0, data.totalToday - data.completedToday);

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto min-w-0">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-base pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <h2 className="text-3xl font-black text-text-base uppercase tracking-tight">Performance Center</h2>
          </div>
          <p className="text-sm text-text-muted font-semibold">Your metrics, consistency stats, and habits analysis.</p>
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950 rounded-2xl flex items-center gap-3 max-w-md shadow-sm">
          <Trophy className="w-8 h-8 text-indigo-500 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Coach Insight</span>
            <p className="text-xs text-text-base font-semibold leading-relaxed mt-0.5">{data.insight}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-bg-card border border-border-base rounded-3xl shadow-sm flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Today's Score</span>
            <span className="text-2xl font-black text-text-base">{data.todayProgress}%</span>
            <span className="text-[10px] text-text-muted font-bold">{data.completedToday} of {data.totalToday} tasks done</span>
          </div>
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path className="text-bg-muted stroke-current" strokeWidth="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-indigo-500 stroke-current transition-all duration-500 ease-out" strokeWidth="3.5" strokeDasharray={`${data.todayProgress}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-text-base">{data.todayProgress}%</div>
          </div>
        </div>

        <div className="p-6 bg-bg-card border border-border-base rounded-3xl shadow-sm flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Streak</span>
            <span className="text-2xl font-black text-text-base flex items-center gap-1.5">
              <Flame className="w-7 h-7 text-orange-500 animate-pulse fill-orange-500" />
              {data.currentStreak} Days
            </span>
            <span className="text-[10px] text-text-muted font-bold">consecutive completed days</span>
          </div>
        </div>

        <div className="p-6 bg-bg-card border border-border-base rounded-3xl shadow-sm flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Remaining Today</span>
            <span className="text-2xl font-black text-text-base flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-500" />
              {pendingCount} Tasks
            </span>
            <span className="text-[10px] text-text-muted font-bold">tasks waiting for checkmark</span>
          </div>
        </div>

        <div className="p-6 bg-bg-card border border-border-base rounded-3xl shadow-sm flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Peak Performance</span>
            <span className="text-xl font-black text-text-base truncate max-w-[150px]">{data.mostProductiveDay}</span>
            <span className="text-[10px] text-text-muted font-bold">highest completion rates day</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-bg-card border border-border-base rounded-3xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border-base pb-3">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-md font-bold text-text-base">Weekly Completion Rate (%)</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.02)" }}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", fontSize: "12px", fontWeight: 700 }}
                />
                <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                  {data.weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.rate >= 75 ? "#10B981" : entry.rate >= 40 ? "#6366F1" : "#F59E0B"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-bg-card border border-border-base rounded-3xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border-base pb-3">
            <PieIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="text-md font-bold text-text-base">Tasks Priority Breakdown</h3>
          </div>
          <div className="flex flex-col gap-4 justify-center flex-1">
            {[
              { label: "Low Priority", count: data.priorityStats.low, color: "bg-blue-500", text: "text-blue-500" },
              { label: "Medium Priority", count: data.priorityStats.medium, color: "bg-amber-500", text: "text-amber-500" },
              { label: "High Priority", count: data.priorityStats.high, color: "bg-red-500", text: "text-red-500" },
            ].map(({ label, count, color, text }) => (
              <div key={label} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className={`${text} uppercase`}>{label}</span>
                  <span className="text-text-base">{count} Tasks</span>
                </div>
                <div className="w-full bg-bg-muted h-3 rounded-full border overflow-hidden">
                  <div className={`${color} h-full rounded-full transition-all duration-300`} style={{ width: `${data.totalToday > 0 ? (count / data.totalToday) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-bg-card border border-border-base rounded-3xl shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-border-base pb-3">
          <CalendarDays className="w-5 h-5 text-indigo-500" />
          <div className="flex flex-col">
            <h3 className="text-md font-bold text-text-base">Consistency Heatmap</h3>
            <span className="text-[10px] text-text-muted font-medium">Activity and habit completions mapped over the last 16 weeks</span>
          </div>
        </div>
        {renderGithubHeatmap()}
      </div>
    </div>
  );
}
