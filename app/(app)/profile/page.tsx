"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, useClerk } from "@clerk/nextjs";
import { User, Settings, LogOut, Save, Check } from "lucide-react";

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const userData = useQuery(api.users.getCurrentUser);
  const upsertProfile = useMutation(api.users.upsertProfile);

  const [displayName, setDisplayName] = useState("");
  const [units, setUnits] = useState<"lb" | "kg">("lb");
  const [goals, setGoals] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "");
      setUnits(userData.units || "lb");
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
              <button
                onClick={() => setUnits("lb")}
                className={`btn flex-1 ${
                  units === "lb" ? "btn-primary" : "btn-secondary"
                }`}
              >
                Pounds (lb)
              </button>
              <button
                onClick={() => setUnits("kg")}
                className={`btn flex-1 ${
                  units === "kg" ? "btn-primary" : "btn-secondary"
                }`}
              >
                Kilograms (kg)
              </button>
            </div>
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

        <div className="flex justify-end mt-6 pt-6 border-t border-border">
          <button
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
          </button>
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
