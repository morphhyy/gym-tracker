"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  Calendar,
  Dumbbell,
  LineChart,
  Minus,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

// Type for chart data
interface VolumeChartDataPoint {
  week: string;
  volume: number;
  sessions: number;
  exercises: number;
}

// Type for custom tooltip props
interface VolumeTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
  label?: string;
  weightUnit?: string;
}

// Custom tooltip component - defined outside render to avoid recreation
function VolumeTooltip({ active, payload, label, weightUnit = "kg" }: VolumeTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-1">{label}</p>
        <p className="text-sm text-primary">
          Volume: {payload[0].value}k {weightUnit}
        </p>
      </div>
    );
  }
  return null;
}

// Muscle group color mapping
const muscleColors: Record<string, { badge: string; progress: string }> = {
  Legs: { badge: "bg-purple-500/15 text-purple-500 border-purple-500/30", progress: "bg-purple-500" },
  Chest: { badge: "bg-red-500/15 text-red-500 border-red-500/30", progress: "bg-red-500" },
  Back: { badge: "bg-blue-500/15 text-blue-500 border-blue-500/30", progress: "bg-blue-500" },
  Shoulders: { badge: "bg-amber-500/15 text-amber-500 border-amber-500/30", progress: "bg-amber-500" },
  Arms: { badge: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30", progress: "bg-cyan-500" },
  Core: { badge: "bg-green-500/15 text-green-500 border-green-500/30", progress: "bg-green-500" },
  Other: { badge: "bg-muted text-muted-foreground border-muted", progress: "bg-muted-foreground" },
};

// Trend calculation
function getTrend(bestWeight: number, oldestWeight: number) {
  if (oldestWeight === 0) return { type: "steady" as const, label: "New", icon: Minus };
  const ratio = bestWeight / oldestWeight;
  if (ratio > 1.05) return { type: "improving" as const, label: "Improving", icon: TrendingUp };
  if (ratio < 0.95) return { type: "focus" as const, label: "Focus needed", icon: TrendingDown };
  return { type: "steady" as const, label: "Steady", icon: Minus };
}

// Type for exercise stats from the query
type ExerciseStatItem = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string;
  lastWeight: number;
  lastDate: string;
  sessionCount: number;
  totalVolume: number;
  bestWeight: number;
  bestWeightDate: string;
  oldestWeight: number;
  recentPR: boolean;
};

export default function ProgressPage() {
  const weeklyStats = useQuery(api.progress.getWeeklySummary, { weeks: 12 });
  const exerciseStats = useQuery(api.progress.getAllExerciseStats);
  const userData = useQuery(api.users.getCurrentUser);

  const weightUnit = userData?.units || "kg";
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

  const chartData: VolumeChartDataPoint[] = weeklyStats.map((week) => ({
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
            <Dumbbell className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-muted-foreground">Weekly Volume</span>
          </div>
          <p className="text-3xl font-bold">
            {thisWeek ? (thisWeek.totalVolume / 1000).toFixed(1) + "k" : "0"}
          </p>
          <p className="text-sm text-muted-foreground">{weightUnit} lifted</p>
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
            className={`text-3xl font-bold ${volumeChange !== null
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
                <Tooltip content={<VolumeTooltip weightUnit={weightUnit} />} />
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
            {Object.entries(exercisesByMuscle).map(([muscleGroup, exercises]: [string, typeof exerciseStats]) => {
              const colors = muscleColors[muscleGroup] || muscleColors.Other;
              return (
                <div key={muscleGroup} className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colors.badge}`}>
                      {muscleGroup}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  
                  {/* Table for desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left text-sm text-muted-foreground">
                          <th className="pb-3 font-medium">Exercise</th>
                          <th className="pb-3 font-medium text-right">Best</th>
                          <th className="pb-3 font-medium text-right">Last</th>
                          <th className="pb-3 font-medium text-right">Sessions</th>
                          <th className="pb-3 font-medium text-right">Volume</th>
                          <th className="pb-3 font-medium text-center">Trend</th>
                          <th className="pb-3 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercises.map((exercise: ExerciseStatItem) => {
                          const trend = getTrend(exercise.bestWeight, exercise.oldestWeight);
                          const TrendIcon = trend.icon;
                          return (
                            <tr
                              key={exercise.exerciseId}
                              className="border-b border-border/50 last:border-0 group cursor-pointer hover:bg-card-hover transition-colors"
                              onClick={() => window.location.href = `/progress/${exercise.exerciseId}`}
                            >
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{exercise.exerciseName}</span>
                                  {exercise.recentPR && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded bg-yellow-500/15 text-yellow-500">
                                      <Trophy className="w-3 h-3" />
                                      PR
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 text-right">
                                <span className="font-bold text-primary">{exercise.bestWeight}</span>
                                <span className="text-muted-foreground ml-1">{weightUnit}</span>
                              </td>
                              <td className="py-3 text-right text-muted-foreground">
                                {exercise.lastWeight} {weightUnit}
                              </td>
                              <td className="py-3 text-right text-muted-foreground">
                                {exercise.sessionCount}
                              </td>
                              <td className="py-3 text-right text-muted-foreground">
                                {exercise.totalVolume >= 1000
                                  ? `${(exercise.totalVolume / 1000).toFixed(1)}k`
                                  : exercise.totalVolume}
                              </td>
                              <td className="py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <TrendIcon
                                    className={`w-4 h-4 ${
                                      trend.type === "improving"
                                        ? "text-green-500"
                                        : trend.type === "focus"
                                          ? "text-orange-500"
                                          : "text-muted-foreground"
                                    }`}
                                  />
                                  <span
                                    className={`text-sm ${
                                      trend.type === "improving"
                                        ? "text-green-500"
                                        : trend.type === "focus"
                                          ? "text-orange-500"
                                          : "text-muted-foreground"
                                    }`}
                                  >
                                    {trend.label}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3">
                                <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* List for mobile */}
                  <div className="sm:hidden divide-y divide-border/50">
                    {exercises.map((exercise: ExerciseStatItem) => {
                      const trend = getTrend(exercise.bestWeight, exercise.oldestWeight);
                      const TrendIcon = trend.icon;
                      return (
                        <Link
                          key={exercise.exerciseId}
                          href={`/progress/${exercise.exerciseId}`}
                          className="flex items-center justify-between py-3 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{exercise.exerciseName}</span>
                              {exercise.recentPR && (
                                <Trophy className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="font-semibold text-primary">{exercise.bestWeight} {weightUnit}</span>
                              <span>Last: {exercise.lastWeight}</span>
                              <TrendIcon
                                className={`w-3.5 h-3.5 ${
                                  trend.type === "improving"
                                    ? "text-green-500"
                                    : trend.type === "focus"
                                      ? "text-orange-500"
                                      : "text-muted-foreground"
                                }`}
                              />
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted flex-shrink-0 ml-2" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
