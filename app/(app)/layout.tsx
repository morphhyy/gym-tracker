"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Dumbbell,
  Calendar,
  ClipboardList,
  LineChart,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Dumbbell },
  { href: "/plan", label: "Plan", icon: Calendar },
  { href: "/log", label: "Log Workout", icon: ClipboardList },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/profile", label: "Profile", icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoaded } = useAuth();
  const ensureUser = useMutation(api.users.ensureUser);

  // Ensure user exists in database on mount
  useEffect(() => {
    if (isLoaded) {
      ensureUser().catch(console.error);
    }
  }, [isLoaded, ensureUser]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-background" />
          </div>
          <span className="font-bold">GymForge</span>
        </Link>
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost p-2"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 bg-background/95 backdrop-blur-sm z-40 animate-fadeIn">
          <nav className="flex flex-col p-4 gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary-muted text-primary"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-border bg-card/30">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-background" />
          </div>
          <span className="text-xl font-bold tracking-tight">GymForge</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary-muted text-primary"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                },
              }}
            />
            <span className="text-sm text-muted-foreground">Account</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
