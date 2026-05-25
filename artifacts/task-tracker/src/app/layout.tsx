import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Task Tracker | Premium Productivity Dashboard",
  description: "A gorgeous, minimal, full-stack weekly task and subtask tracker with detailed analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-bg-base text-text-base bg-grid-pattern`}>
        <AuthProvider>
          <div className="flex flex-col md:flex-row min-h-screen w-full">
            <Navigation />
            <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
