"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Database,
  Dumbbell,
  Flame,
  LineChart,
  Medal,
  MessageSquare,
  Repeat,
  Rocket,
  Share2,
  Shield,
  Smartphone,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { DumbbellIcon } from "@/app/components/dumbbell-icon";
import { FeedbackButton } from "@/app/components/feedback-dialog";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 group">
            <DumbbellIcon />
            <span className="text-xl font-bold tracking-tight">GymForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <button className="btn btn-ghost">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn btn-primary">Get Started</button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-muted rounded-full text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            The Complete Guide
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
            How <span className="text-primary">GymForge</span> Works
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            From creating your first workout plan to tracking your progress over
            time, here&apos;s everything you need to know about your new fitness
            companion.
          </p>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="py-16 px-6 bg-card/50 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Your Journey in 4 Simple Steps
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                icon: Sparkles,
                title: "Create Your Plan",
                desc: "AI-powered or manual",
              },
              {
                step: "2",
                icon: ClipboardList,
                title: "Track Workouts",
                desc: "Log every set and rep",
              },
              {
                step: "3",
                icon: TrendingUp,
                title: "See Progress",
                desc: "Charts and analytics",
              },
              {
                step: "4",
                icon: Target,
                title: "Get Suggestions",
                desc: "Smart recommendations",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="card text-center h-full">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-background font-bold text-sm">
                    {item.step}
                  </div>
                  <div className="pt-4">
                    <item.icon className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Step 1: Create Your Plan */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-muted rounded-full text-primary text-sm font-medium mb-4">
                <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-background text-xs font-bold">
                  1
                </span>
                Create Your Plan
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Build Your Perfect Workout Schedule
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Choose between AI-powered plan generation or manual creation.
                Either way, you&apos;ll have a complete weekly workout template
                ready to go.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Brain className="w-6 h-6 text-violet-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      AI-Powered Generation
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Describe your goals, experience level, and available days.
                      Our AI creates a scientifically-designed program tailored
                      to you using GPT-4o with exercise science principles.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-muted rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Manual Creation</h3>
                    <p className="text-muted-foreground text-sm">
                      Build from scratch with our exercise library of 39+
                      pre-loaded exercises. Choose exercises by muscle group,
                      set rep targets, and organize your perfect split.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Custom Exercise Library
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Don&apos;t see your favorite exercise? Create custom
                      exercises with muscle group and equipment tags. Your
                      library grows with you.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  <span className="font-semibold">AI Plan Generator</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <span className="text-muted-foreground">
                      Example prompt:
                    </span>
                    <p className="mt-1">
                      &quot;I&apos;m an intermediate lifter looking to build
                      muscle. I can train 4 days per week with about 1 hour per
                      session. I have access to a full gym.&quot;
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Beginner Full Body",
                      "Push/Pull/Legs",
                      "Upper/Lower",
                      "Strength Focus",
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-violet-500/10 text-violet-400 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">
                    Generated Plan Preview:
                  </div>
                  <div className="space-y-2">
                    {[
                      "Monday: Push Day",
                      "Tuesday: Pull Day",
                      "Thursday: Legs",
                      "Friday: Upper Body",
                    ].map((day) => (
                      <div
                        key={day}
                        className="flex items-center gap-2 text-sm"
                      >
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

      {/* Step 2: Track Your Workouts */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-background rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                  <span className="font-semibold">Today&apos;s Workout</span>
                  <span className="text-sm text-muted-foreground">
                    Push Day
                  </span>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      name: "Bench Press",
                      suggestion: { type: "increase", weight: 180 },
                      sets: [
                        { weight: 135, reps: 10 },
                        { weight: 155, reps: 8 },
                        { weight: 175, reps: 6 },
                      ],
                    },
                    {
                      name: "Incline Dumbbell Press",
                      suggestion: { type: "maintain", weight: null },
                      sets: [
                        { weight: 50, reps: 10 },
                        { weight: 55, reps: 8 },
                      ],
                    },
                  ].map((exercise) => (
                    <div
                      key={exercise.name}
                      className="p-4 bg-muted/30 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{exercise.name}</span>
                        <div className="flex items-center gap-2">
                          {exercise.suggestion.type === "increase" && (
                            <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-full">
                              <TrendingUp className="w-3 h-3" />
                              {exercise.suggestion.weight} lb
                            </span>
                          )}
                          {exercise.suggestion.type === "maintain" && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                              Maintain
                            </span>
                          )}
                          <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                            {exercise.sets.length} sets logged
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {exercise.sets.map((set, i) => (
                          <div
                            key={i}
                            className="text-center p-2 bg-background rounded-lg border border-border"
                          >
                            <div className="text-xs text-muted-foreground">
                              Set {i + 1}
                            </div>
                            <div className="font-semibold">
                              {set.weight}
                              <span className="text-xs text-muted-foreground">
                                lb
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              × {set.reps}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-primary rounded-full" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      75% complete
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-muted rounded-full text-primary text-sm font-medium mb-4">
                <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-background text-xs font-bold">
                  2
                </span>
                Track Your Workouts
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Log Every Set, Every Rep, Every Session
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Our logging interface is designed for the gym floor. Quick data
                entry, smart pre-fills, and real-time saves so you never lose
                your progress.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-muted rounded-xl flex items-center justify-center flex-shrink-0">
                    <Repeat className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Smart Pre-fills</h3>
                    <p className="text-muted-foreground text-sm">
                      Your last weight for each exercise automatically pre-fills
                      so you can focus on lifting, not typing.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Real-time Saves</h3>
                    <p className="text-muted-foreground text-sm">
                      Each set saves instantly to the cloud. Close the app, come
                      back later - your progress is always there.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Past Date Logging</h3>
                    <p className="text-muted-foreground text-sm">
                      Forgot to log yesterday? No problem. You can log workouts
                      for any past date to keep your history complete.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Inline Overload Suggestions</h3>
                    <p className="text-muted-foreground text-sm">
                      See smart weight suggestions right next to each exercise.
                      Green badges suggest increasing weight, orange for deloading.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: See Your Progress */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-muted rounded-full text-primary text-sm font-medium mb-4">
                <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-background text-xs font-bold">
                  3
                </span>
                See Your Progress
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Beautiful Charts That Tell Your Story
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Watch your strength gains unfold with detailed analytics. Track
                volume trends, personal bests, and estimated one-rep maxes for
                every exercise.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-muted rounded-xl flex items-center justify-center flex-shrink-0">
                    <LineChart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Weekly Volume Trends</h3>
                    <p className="text-muted-foreground text-sm">
                      See your total volume week-over-week. Track whether
                      you&apos;re progressively overloading or need to push
                      harder.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Per-Exercise Tracking
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Dive deep into each exercise. View top set weight,
                      personal bests, and estimated 1RM calculated using the
                      Epley formula.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Muscle Group Overview
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Exercises organized by muscle group so you can track
                      balance across your entire physique.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <span className="font-semibold">Bench Press Progress</span>
                <span className="text-sm text-primary">+12% this month</span>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-primary">185</div>
                    <div className="text-xs text-muted-foreground">
                      Top Set (lbs)
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-secondary">225</div>
                    <div className="text-xs text-muted-foreground">
                      Est. 1RM (lbs)
                    </div>
                  </div>
                </div>
                <div className="h-32 flex items-end gap-1">
                  {[40, 45, 50, 48, 55, 60, 58, 65, 70, 75, 80, 85].map(
                    (height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t"
                        style={{ height: `${height}%` }}
                      />
                    )
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>12 weeks ago</span>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 4: Smart Suggestions */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-background rounded-2xl border border-border p-6">
                <div className="pb-4 border-b border-border mb-4">
                  <span className="font-semibold">
                    Smart Suggestions for You
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-400">
                          Ready to Progress
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Bench Press: You&apos;ve hit your rep targets for 3
                          sessions. Consider adding 5 lbs next workout.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-400">
                          Keep It Up
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Squat: You&apos;re making steady progress. Stay
                          consistent at this weight until you hit all your rep
                          targets.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Repeat className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-400">
                          Consider Deload
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Overhead Press: You&apos;ve struggled to hit reps for
                          2 sessions. Try reducing weight by 10% to rebuild.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-muted rounded-full text-primary text-sm font-medium mb-4">
                <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-background text-xs font-bold">
                  4
                </span>
                Get Smart Suggestions
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Data-Driven Progression Advice
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Our algorithm analyzes your recent performance and provides
                actionable suggestions. See them inline on your workout log or
                dive deep on the progress page.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Progressive Overload</h3>
                    <p className="text-muted-foreground text-sm">
                      When you consistently hit your rep targets, we recommend
                      increasing weight by 2.5-5 lbs to keep growing.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Deload Detection</h3>
                    <p className="text-muted-foreground text-sm">
                      If you&apos;re struggling with reps, we suggest a 10%
                      deload to help you recover and come back stronger.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-muted rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Inline Badges</h3>
                    <p className="text-muted-foreground text-sm">
                      Suggestions appear as badges right next to each exercise
                      on your log page. No need to leave your workout flow.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Consistency Tracking</h3>
                    <p className="text-muted-foreground text-sm">
                      The algorithm tracks your last 4 sessions per exercise to
                      provide accurate, personalized recommendations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              More Powerful Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              GymForge is packed with features to make your training more
              effective and enjoyable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card">
              <div className="w-12 h-12 bg-primary-muted rounded-xl flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Plan Sharing</h3>
              <p className="text-muted-foreground text-sm">
                Share your workout plan with friends via a unique link. They can
                view your program or copy it to their own account.
              </p>
            </div>

            <div className="card">
              <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mobile Optimized</h3>
              <p className="text-muted-foreground text-sm">
                Designed for the gym floor. Large touch targets, quick data
                entry, and a responsive layout that works on any device.
              </p>
            </div>

            <div className="card">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-cyan-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Sync</h3>
              <p className="text-muted-foreground text-sm">
                Powered by Convex for instant data syncing. Your workouts save
                in real-time across all your devices.
              </p>
            </div>

            <div className="card">
              <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Unit Preferences</h3>
              <p className="text-muted-foreground text-sm">
                Choose between kilograms or pounds. Your preference is saved and
                applied throughout the entire app.
              </p>
            </div>

            <div className="card">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground text-sm">
                Your data is yours. Secure authentication via Clerk and
                encrypted storage keep your workout history safe.
              </p>
            </div>

            <div className="card">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
                <Dumbbell className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">39+ Exercises</h3>
              <p className="text-muted-foreground text-sm">
                Pre-loaded with popular exercises across all muscle groups:
                Chest, Back, Shoulders, Legs, Arms, and Core.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Features */}
      <section className="py-20 px-6 bg-gradient-to-br from-orange-500/5 via-transparent to-yellow-500/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-full text-orange-400 text-sm font-medium mb-4">
              <Flame className="w-4 h-4" />
              Stay Motivated
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built-in Motivation Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stay consistent and celebrate your wins with gamification features
              designed to keep you coming back.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Streaks */}
            <div className="card">
              <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Workout Streaks</h3>
              <p className="text-muted-foreground mb-4">
                Plan-aware streaks that understand your schedule. Rest days never
                break your streak - only missed workout days do.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-orange-500">7 Day Streak</div>
                    <div className="text-xs text-muted-foreground">Week Warrior badge</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium">Rest Day Protection</div>
                    <div className="text-xs text-muted-foreground">Scheduled rest days are safe</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <div className="font-medium">Weekly Goal Progress</div>
                    <div className="text-xs text-muted-foreground">Set 1-7 workouts per week</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PR Tracking */}
            <div className="card">
              <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Personal Records</h3>
              <p className="text-muted-foreground mb-4">
                Celebrate every PR with automatic detection and celebration
                animations. Track weight PRs, volume PRs, and estimated 1RM records.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <div className="font-medium">Weight PR</div>
                    <div className="text-xs text-muted-foreground">Heaviest lift for each exercise</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <div className="font-medium">Est. 1RM PR</div>
                    <div className="text-xs text-muted-foreground">Calculated using Epley formula</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="mt-12 p-6 bg-card rounded-2xl border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Medal className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold">Achievement Badges</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Earn badges as you hit milestones. From your first PR to a 100-day
              streak, every achievement is celebrated.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "First PR", color: "bg-yellow-500/20 text-yellow-500" },
                { name: "3-Day Streak", color: "bg-orange-500/20 text-orange-500" },
                { name: "Week Warrior", color: "bg-blue-500/20 text-blue-500" },
                { name: "Two Week Titan", color: "bg-purple-500/20 text-purple-500" },
                { name: "Monthly Master", color: "bg-pink-500/20 text-pink-500" },
                { name: "Century Club", color: "bg-amber-500/20 text-amber-500" },
              ].map((badge) => (
                <span
                  key={badge.name}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${badge.color}`}
                >
                  {badge.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How AI Works */}
      <section className="py-20 px-6 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 rounded-full text-violet-400 text-sm font-medium mb-4">
              <Brain className="w-4 h-4" />
              AI Deep Dive
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How the AI Plan Generator Works
            </h2>
            <p className="text-muted-foreground text-lg">
              Under the hood, our AI uses advanced language models and exercise
              science principles.
            </p>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-background font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    You Describe Your Goals
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Tell us about your experience level (beginner, intermediate,
                    advanced), training goals (strength, hypertrophy,
                    endurance), available days per week, and time per session.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-background font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    AI Designs Your Program
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    GPT-4o analyzes your input and creates a structured workout
                    plan. It follows exercise science principles: compound
                    movements first, proper volume distribution, appropriate rep
                    ranges for your goals, and balanced muscle group training.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-background font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Validated Exercise Selection
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    The AI only uses exercises from our verified library. Each
                    exercise is mapped to your account, ensuring every movement
                    is trackable and you can log progress immediately.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-background font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Review and Approve</h3>
                  <p className="text-muted-foreground text-sm">
                    Preview the generated plan before committing. Not happy?
                    Regenerate with a different prompt. Once approved, the plan
                    becomes your active workout schedule.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-violet-500/10 rounded-2xl border border-violet-500/20">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-violet-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-violet-300 mb-2">
                  Volume Guidelines Built In
                </h4>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">
                      Strength:
                    </span>{" "}
                    3-5 sets × 3-6 reps
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      Hypertrophy:
                    </span>{" "}
                    3-4 sets × 8-12 reps
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      Endurance:
                    </span>{" "}
                    2-3 sets × 15-20 reps
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      Beginner:
                    </span>{" "}
                    2-3 sets × 10-12 reps
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Features */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-full text-cyan-400 text-sm font-medium mb-4">
              <Rocket className="w-4 h-4" />
              Coming Soon
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Upcoming Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We&apos;re constantly improving GymForge. Here&apos;s what&apos;s on
              the roadmap.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card border-dashed border-2 border-border/50 bg-transparent">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                <Timer className="w-6 h-6 text-cyan-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Rest Timer</h3>
              <p className="text-muted-foreground text-sm">
                Built-in rest timer between sets with customizable durations.
                Get notified when it&apos;s time for your next set.
              </p>
              <span className="inline-block mt-4 text-xs bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded-full">
                In Development
              </span>
            </div>

            <div className="card border-dashed border-2 border-border/50 bg-transparent">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Exercise Notes</h3>
              <p className="text-muted-foreground text-sm">
                Add notes to individual exercises or sets. Track form cues,
                pain points, or things to remember for next time.
              </p>
              <span className="inline-block mt-4 text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full">
                Planned
              </span>
            </div>

            <div className="card border-dashed border-2 border-border/50 bg-transparent">
              <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Workout History</h3>
              <p className="text-muted-foreground text-sm">
                Browse past workouts in a calendar view. Quickly review what
                you did on any given day and track patterns over time.
              </p>
              <span className="inline-block mt-4 text-xs bg-pink-500/10 text-pink-400 px-2 py-1 rounded-full">
                Planned
              </span>
            </div>

            <div className="card border-dashed border-2 border-border/50 bg-transparent">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Workout Reminders</h3>
              <p className="text-muted-foreground text-sm">
                Push notifications to remind you of upcoming workouts. Never
                miss a scheduled training day again.
              </p>
              <span className="inline-block mt-4 text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full">
                Exploring
              </span>
            </div>

            <div className="card border-dashed border-2 border-border/50 bg-transparent">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Social Features</h3>
              <p className="text-muted-foreground text-sm">
                Follow friends, share PRs, and compete on leaderboards. Turn
                fitness into a social experience.
              </p>
              <span className="inline-block mt-4 text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-full">
                Exploring
              </span>
            </div>

            <div className="card border-dashed border-2 border-border/50 bg-transparent">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <Repeat className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Superset Support</h3>
              <p className="text-muted-foreground text-sm">
                Group exercises into supersets, circuits, or drop sets. Log
                them together for a more efficient workout flow.
              </p>
              <span className="inline-block mt-4 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">
                Planned
              </span>
            </div>
          </div>

          <div className="mt-12 p-6 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-border text-center">
            <h3 className="font-semibold mb-2">Have a Feature Request?</h3>
            <p className="text-muted-foreground text-sm mb-4">
              We&apos;d love to hear your ideas. Share your feedback and help
              shape the future of GymForge.
            </p>
            <FeedbackButton />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join GymForge today and take control of your fitness. Create your
            first plan in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignUpButton mode="modal">
              <button className="btn btn-primary text-base px-8 py-3 group">
                Create Free Account
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </SignUpButton>
            <Link href="/">
              <button className="btn btn-secondary text-base px-8 py-3">
                Back to Home
              </button>
            </Link>
          </div>
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
