"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  ListTodo, 
  Sun, 
  Moon, 
  LogOut, 
  User as UserIcon,
  Sparkles
} from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout, updateTheme } = useAuth();

  if (!user) return null;

  const currentTheme = user.preferences?.theme || "light";

  const toggleTheme = () => {
    updateTheme(currentTheme === "light" ? "dark" : "light");
  };

  const navItems = [
    {
      name: "Tracker",
      href: "/tracker",
      icon: ListTodo,
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
  ];

  return (
    <>
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-bg-card border-r border-border-base h-screen sticky top-0 p-6 justify-between select-none">
        <div className="flex flex-col gap-8">
          {/* Logo / Header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-btn-primary rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-bg-base" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-base">Task Tracker</h1>
              <p className="text-xs text-text-muted font-medium">Productivity Hub</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${
                    isActive
                      ? "bg-btn-primary text-text-primary shadow-sm"
                      : "text-text-muted hover:bg-bg-muted hover:text-text-base"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer controls */}
        <div className="flex flex-col gap-4 border-t border-border-base pt-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <UserIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate text-text-base">{user.name}</span>
              <span className="text-xs text-text-muted truncate">{user.email}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-border-base text-text-muted hover:bg-bg-muted hover:text-text-base transition-colors duration-200"
              title="Toggle theme"
            >
              {currentTheme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-red-200 dark:border-red-950 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border-base px-6 py-2.5 flex justify-around items-center z-50 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-btn-primary font-bold scale-105"
                  : "text-text-muted"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-wide">{item.name}</span>
            </Link>
          );
        })}

        {/* Theme Toggle (Mobile) */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 py-1 px-4 text-text-muted"
        >
          {currentTheme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
          <span className="text-[10px] tracking-wide">Theme</span>
        </button>

        {/* Logout (Mobile) */}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 py-1 px-4 text-red-500"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">Logout</span>
        </button>
      </nav>
    </>
  );
}
