"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Calendar,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";

export default function ProgressPage() {
  const weeklyStats = useQuery(api.progress.getWeeklySummary, { weeks: 12 });
  const exerciseStats = useQuery(api.progress.getAllExerciseStats);

  const isLoading = weeklyStats === undefined || exerciseStats === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-card rounded animate-pulse" />
        <div className="card h-64 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate trends
  const thisWeek = weeklyStats[weeklyStats.length - 1];
  const lastWeek = weeklyStats[weeklyStats.length - 2];
  const volumeChange =
    thisWeek && lastWeek && lastWeek.totalVolume > 0
      ? Math.round(
          ((thisWeek.totalVolume - lastWeek.totalVolume) /
            lastWeek.totalVolume) *
            100
        )
      : null;

  const chartData = weeklyStats.map((week: { weekStart: string; totalVolume: number; sessionCount: number; uniqueExercises: number }) => ({
    week: format(parseISO(week.weekStart), "MMM d"),
    volume: Math.round(week.totalVolume / 1000),
    sessions: week.sessionCount,
    exercises: week.uniqueExercises,
  }));

  // Group exercises by muscle group
  const exercisesByMuscle = exerciseStats.reduce(
    (acc: Record<string, typeof exerciseStats>, exercise: (typeof exerciseStats)[number]) => {
      const group = exercise.muscleGroup || "Other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(exercise);
      return acc;
    },
    {} as Record<string, typeof exerciseStats>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          <p className="text-sm text-primary">
            Volume: {payload[0].value}k lbs
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Progress
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your strength gains over time
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">This Week</span>
          </div>
          <p className="text-3xl font-bold">{thisWeek?.sessionCount ?? 0}</p>
          <p className="text-sm text-muted-foreground">workouts</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="w-5 h-5 text-secondary" />
            <span className="text-sm text-muted-foreground">Weekly Volume</span>
          </div>
          <p className="text-3xl font-bold">
            {thisWeek ? (thisWeek.totalVolume / 1000).toFixed(1) + "k" : "0"}
          </p>
          <p className="text-sm text-muted-foreground">lbs lifted</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            {volumeChange !== null && volumeChange >= 0 ? (
              <TrendingUp className="w-5 h-5 text-primary" />
            ) : (
              <TrendingDown className="w-5 h-5 text-danger" />
            )}
            <span className="text-sm text-muted-foreground">Volume Trend</span>
          </div>
          <p
            className={`text-3xl font-bold ${
              volumeChange !== null
                ? volumeChange >= 0
                  ? "text-primary"
                  : "text-danger"
                : ""
            }`}
          >
            {volumeChange !== null ? `${volumeChange > 0 ? "+" : ""}${volumeChange}%` : "—"}
          </p>
          <p className="text-sm text-muted-foreground">vs last week</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <LineChart className="w-5 h-5 text-accent" />
            <span className="text-sm text-muted-foreground">Exercises</span>
          </div>
          <p className="text-3xl font-bold">{exerciseStats.length}</p>
          <p className="text-sm text-muted-foreground">tracked</p>
        </div>
      </div>

      {/* Volume Chart */}
      <div className="card">
        <h2 className="font-semibold text-lg mb-4">Weekly Volume</h2>
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2a2a35"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#volumeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">
              No data yet. Start logging workouts!
            </p>
          </div>
        )}
      </div>

      {/* Exercise Progress */}
      <div>
        <h2 className="font-semibold text-lg mb-4">Exercise Progress</h2>
        {exerciseStats.length === 0 ? (
          <div className="card text-center py-12">
            <Dumbbell className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-muted-foreground">
              No exercise data yet. Start logging workouts to see your progress!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(exercisesByMuscle).map(([muscleGroup, exercises]: [string, typeof exerciseStats]) => (
              <div key={muscleGroup}>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                  {muscleGroup}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {exercises.map((exercise: { exerciseId: string; exerciseName: string; bestWeight: number; lastWeight: number; totalVolume: number }) => (
                    <Link
                      key={exercise.exerciseId}
                      href={`/progress/${exercise.exerciseId}`}
                      className="card card-hover group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate pr-2">
                          {exercise.exerciseName}
                        </h4>
                        <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {exercise.bestWeight}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          lb best
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Last: {exercise.lastWeight} lb</span>
                        <span>
                          {(exercise.totalVolume / 1000).toFixed(1)}k vol
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
