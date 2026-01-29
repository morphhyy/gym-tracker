"use client";

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  Dumbbell,
  LineChart,
  Calendar,
  Target,
  ArrowRight,
  Zap,
  Flame,
  Trophy,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { DumbbellIcon } from "@/app/components/dumbbell-icon";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
              <DumbbellIcon />
            <span className="text-xl font-bold tracking-tight">GymForge</span>
          </div>
          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <button className="btn btn-ghost">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn btn-primary">Get Started</button>
            </SignUpButton>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-muted rounded-full text-primary text-sm font-medium mb-6 animate-fadeIn">
              <Zap className="w-4 h-4" />
              Track. Progress. Achieve.
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6 animate-fadeIn stagger-1">
              Forge Your
              <span className="text-primary"> Strongest </span>
              Self
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fadeIn stagger-2">
              Build custom workout plans, track every rep and weight, and watch
              your progress unfold with beautiful charts. Your personal gym
              companion that grows with you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn stagger-3">
              <SignUpButton mode="modal">
                <button className="btn btn-primary text-base px-8 py-3 group">
                  Start Training Free
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </SignUpButton>
              <Link href="/how-it-works">
                <button className="btn btn-secondary text-base px-8 py-3">
                  See How It Works
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 px-6 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Level Up
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Designed by lifters, for lifters. Simple tools that help you focus
              on what matters most.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="card group hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-primary-muted rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Weekly Planning</h3>
              <p className="text-muted-foreground">
                Build your perfect week with customizable workout templates.
                Push/Pull/Legs, Upper/Lower, or create your own split.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card group hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-primary-muted rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Set-by-Set Tracking
              </h3>
              <p className="text-muted-foreground">
                Log every set with weight and reps. Pre-filled from your last
                workout so you can focus on lifting.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card group hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-primary-muted rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <LineChart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visual Progress</h3>
              <p className="text-muted-foreground">
                See your strength gains with charts for top sets, volume, and
                estimated 1RM. Spot trends and celebrate wins.
              </p>
            </div>

            {/* Feature 4 - Smart Suggestions */}
            <div className="card group hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Inline Suggestions</h3>
              <p className="text-muted-foreground">
                See weight suggestions right next to each exercise. Green for
                increase, orange for deload—based on your performance.
              </p>
            </div>

            {/* Feature 5 - Streaks */}
            <div className="card group hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Streaks</h3>
              <p className="text-muted-foreground">
                Plan-aware streaks that understand your schedule. Rest days
                never break your streak—only missed workout days do.
              </p>
            </div>

            {/* Feature 6 - Achievements */}
            <div className="card group hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Achievements</h3>
              <p className="text-muted-foreground">
                Unlock badges as you hit milestones. From your first PR to a
                100-day streak, every achievement is celebrated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Feature Highlight */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 rounded-full text-violet-400 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                AI-Powered
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Generate Your Perfect Plan in Seconds
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Describe your goals, experience level, and available days. Our
                AI creates a scientifically-designed program tailored just for
                you.
              </p>
              <div className="space-y-4">
                {[
                  "Personalized to your experience level",
                  "Follows exercise science principles",
                  "Balanced muscle group training",
                  "Appropriate rep ranges for your goals",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <span className="font-semibold">AI Plan Generator</span>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">Example prompt:</span>
                  <p className="mt-1">
                    &quot;I&apos;m intermediate, want to build muscle, can train
                    4 days per week.&quot;
                  </p>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-3">
                    Generated Plan:
                  </div>
                  <div className="space-y-2">
                    {[
                      "Monday: Push Day - 6 exercises",
                      "Tuesday: Pull Day - 6 exercises",
                      "Thursday: Legs - 5 exercises",
                      "Friday: Upper Body - 6 exercises",
                    ].map((day) => (
                      <div key={day} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>{day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-16 px-6 bg-card/50 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                39+
              </div>
              <div className="text-sm text-muted-foreground">
                Pre-loaded Exercises
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                100%
              </div>
              <div className="text-sm text-muted-foreground">Free to Use</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                Real-time
              </div>
              <div className="text-sm text-muted-foreground">Cloud Sync</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                Mobile
              </div>
              <div className="text-sm text-muted-foreground">
                Optimized Design
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Start Building?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join GymForge today and take control of your fitness journey. No
            credit card required.
          </p>
          <SignUpButton mode="modal">
            <button className="btn btn-primary text-base px-8 py-3">
              Create Free Account
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
           <DumbbellIcon />
            <span className="font-semibold">GymForge</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} GymForge. Built for lifters.
          </p>
        </div>
      </footer>
    </div>
  );
}
