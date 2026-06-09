import { API_URL } from "@/lib/api";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";

export interface Preference {
  id: string;
  userId: string;
  theme: string;
  workWeek: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: Preference | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateTheme: (theme: string) => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user?.preferences?.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [user]);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { /* non-JSON body */ }
      if (res.ok) {
        setUser(data.user);
        setLocation("/tracker");
        return { success: true };
      }
      return { success: false, error: data.error || "Login failed. Please check your credentials." };
    } catch {
      return { success: false, error: "Unable to connect. Please check your connection and try again." };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { /* non-JSON body */ }
      if (res.ok) {
        setUser(data.user);
        setLocation("/tracker");
        return { success: true };
      }
      return { success: false, error: data.error || "Failed to create account. Please try again." };
    } catch {
      return { success: false, error: "Unable to connect. Please check your connection and try again." };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
      setUser(null);
      document.documentElement.classList.remove("dark");
      setLocation("/");
    } catch {
      // ignore
    }
  };

  const updateTheme = async (theme: string) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      preferences: user.preferences
        ? { ...user.preferences, theme }
        : { id: "", userId: user.id, theme, workWeek: "mon-sun" },
    };
    setUser(updatedUser);
    try {
      await fetch(`${API_URL}/api/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ theme }),
      });
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateTheme, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
