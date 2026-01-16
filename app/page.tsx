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
} from "lucide-react";

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
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-background" />
            </div>
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

            {/* Feature 4 */}
            <div className="card group hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Suggestions</h3>
              <p className="text-muted-foreground">
                Get personalized tips on when to add weight or take a deload
                based on your actual performance data.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card group hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobile Ready</h3>
              <p className="text-muted-foreground">
                Take GymForge to the gym floor. Fully responsive design that
                works beautifully on any device.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card group hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-primary-muted rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your workout data stays yours. Secure authentication and
                encrypted storage keep your progress safe.
              </p>
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
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-background" />
            </div>
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
