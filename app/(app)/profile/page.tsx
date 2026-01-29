"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, useClerk } from "@clerk/nextjs";
import { User, Settings, LogOut, Save, Check, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const userData = useQuery(api.users.getCurrentUser);
  const upsertProfile = useMutation(api.users.upsertProfile);
  const setWeeklyGoal = useMutation(api.streaks.setWeeklyGoal);

  const [displayName, setDisplayName] = useState("");
  const [units, setUnits] = useState<"lb" | "kg">("kg");
  const [goals, setGoals] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "");
      setUnits(userData.units || "kg");
      setGoals(userData.goals || "");
    }
  }, [userData]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      await upsertProfile({
        displayName: displayName || undefined,
        units,
        goals: goals || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = userData === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-card rounded animate-pulse" />
        <div className="card h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* User Info Card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-muted rounded-2xl flex items-center justify-center">
            {clerkUser?.imageUrl ? (
              <img
                src={clerkUser.imageUrl}
                alt="Profile"
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {displayName ||
                clerkUser?.firstName ||
                clerkUser?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
                "User"}
            </h2>
            <p className="text-muted-foreground">
              {clerkUser?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="input"
            />
          </div>

          {/* Units */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Weight Units
            </label>
            <div className="flex gap-2">
              <Button
                onClick={() => setUnits("lb")}
                className={`btn flex-1 ${units === "lb" ? "btn-primary" : "btn-secondary"
                  }`}
              >
                Pounds (lb)
              </Button>
              <Button
                onClick={() => setUnits("kg")}
                className={`btn flex-1 ${units === "kg" ? "btn-primary" : "btn-secondary"
                  }`}
              >
                Kilograms (kg)
              </Button>
            </div>
          </div>

          {/* Weekly Goal */}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Weekly Workout Goal
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Auto-synced when you create or switch plans. You can also set it manually.
            </p>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setWeeklyGoal({ goal: num })}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${userData?.weeklyGoal === num
                    ? "bg-primary text-primary-foreground"
                    : "bg-card hover:bg-card-hover border border-border"
                    }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {userData?.weeklyGoal ?? 3} day{(userData?.weeklyGoal ?? 3) !== 1 ? "s" : ""} per week
            </p>
          </div>

          {/* Goals */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Fitness Goals
            </label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="What are you working towards? e.g., Build strength, lose weight, improve endurance..."
              rows={3}
              className="input resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4 border-border">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Account Stats */}
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Account Info
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Member Since</span>
            <span>
              {userData?.createdAt
                ? new Date(userData.createdAt).toLocaleDateString()
                : "—"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Email</span>
            <span>{clerkUser?.emailAddresses[0]?.emailAddress}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Account Status</span>
            <span className="badge">Active</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-danger/30">
        <h3 className="font-semibold text-danger mb-4">Sign Out</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sign out of your account on this device.
        </p>
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="btn btn-danger"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
