"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Target,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

export default function ExerciseProgressPage() {
  const params = useParams();
  const exerciseId = params.exerciseId as Id<"exercises">;

  const history = useQuery(api.progress.getExerciseHistory, {
    exerciseId,
    days: 90,
  });
  const suggestions = useQuery(api.progress.getExerciseSuggestions, {
    exerciseId,
  });
  const exercises = useQuery(api.exercises.getAllExercises);
  const userData = useQuery(api.users.getCurrentUser);

  const weightUnit = userData?.units || "lb";
  const exercise = exercises?.find((e: { _id: string }) => e._id === exerciseId);

  const isLoading =
    history === undefined || suggestions === undefined || exercise === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-card rounded animate-pulse" />
        <div className="card h-64 animate-pulse" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <Link
          href="/progress"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Progress
        </Link>
        <div className="card text-center py-16">
          <p className="text-muted-foreground">Exercise not found</p>
        </div>
      </div>
    );
  }

  const chartData = history.map((h: { date: string; topSetWeight: number; totalVolume: number; estimated1RM: number; topSetReps: number }) => ({
    date: format(parseISO(h.date), "MMM d"),
    fullDate: h.date,
    topSet: h.topSetWeight,
    volume: Math.round(h.totalVolume / 100) / 10,
    e1RM: h.estimated1RM,
    reps: h.topSetReps,
  }));

  // Calculate stats
  const currentTopSet = history[history.length - 1]?.topSetWeight ?? 0;
  const previousTopSet = history[history.length - 2]?.topSetWeight ?? 0;
  const topSetChange = currentTopSet - previousTopSet;
  
  const bestWeight = Math.max(...history.map((h: { topSetWeight: number }) => h.topSetWeight), 0);
  const bestE1RM = Math.max(...history.map((h: { estimated1RM: number }) => h.estimated1RM), 0);
  const totalSessions = history.length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{data.fullDate}</p>
          <div className="space-y-1 text-sm">
            <p className="text-primary">Top Set: {data.topSet} {weightUnit} × {data.reps}</p>
            <p className="text-secondary">Volume: {data.volume}k {weightUnit}</p>
            <p className="text-accent">Est. 1RM: {data.e1RM} {weightUnit}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <Link
          href="/progress"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Progress
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {exercise.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          {exercise.muscleGroup}
          {exercise.equipment && ` • ${exercise.equipment}`}
        </p>
      </div>

      {/* Suggestion Card */}
      {suggestions.suggestion && (
        <div
          className={`card flex items-start gap-4 ${
            suggestions.suggestion === "increase"
              ? "bg-primary-muted border-primary/30"
              : suggestions.suggestion === "decrease"
                ? "bg-danger-muted border-danger/30"
                : "bg-card"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              suggestions.suggestion === "increase"
                ? "bg-primary/20"
                : suggestions.suggestion === "decrease"
                  ? "bg-danger/20"
                  : "bg-secondary/20"
            }`}
          >
            {suggestions.suggestion === "increase" ? (
              <TrendingUp className="w-6 h-6 text-primary" />
            ) : suggestions.suggestion === "decrease" ? (
              <TrendingDown className="w-6 h-6 text-danger" />
            ) : (
              <Target className="w-6 h-6 text-secondary" />
            )}
          </div>
          <div>
            <h3
              className={`font-semibold ${
                suggestions.suggestion === "increase"
                  ? "text-primary"
                  : suggestions.suggestion === "decrease"
                    ? "text-danger"
                    : "text-secondary"
              }`}
            >
              {suggestions.suggestion === "increase"
                ? "Ready to Progress!"
                : suggestions.suggestion === "decrease"
                  ? "Consider a Deload"
                  : "Keep It Up!"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {suggestions.reason}
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="card bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Current Top Set</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold">{currentTopSet}</span>
            <span className="text-sm text-muted-foreground">{weightUnit}</span>
          </div>
          {topSetChange !== 0 && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs ${
                topSetChange > 0 ? "text-primary" : "text-danger"
              }`}
            >
              {topSetChange > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {topSetChange > 0 ? "+" : ""}
              {topSetChange} {weightUnit}
            </div>
          )}
        </div>

        <div className="card bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground">Personal Best</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-amber-500">{bestWeight}</span>
            <span className="text-sm text-muted-foreground">{weightUnit}</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground">Est. 1RM</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-blue-500">{bestE1RM}</span>
            <span className="text-sm text-muted-foreground">{weightUnit}</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-card-hover flex items-center justify-center">
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold">{totalSessions}</span>
            <span className="text-sm text-muted-foreground">logged</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      {history.length > 0 ? (
        <>
          {/* Top Set Chart */}
          <div className="card">
            <h2 className="font-semibold text-lg mb-4">Top Set Weight</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="topSetGradient" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="date"
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
                    domain={["dataMin - 10", "dataMax + 10"]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="topSet"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#topSetGradient)"
                    name={`Top Set (${weightUnit})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* All Metrics Chart */}
          <div className="card">
            <h2 className="font-semibold text-lg mb-4">All Metrics</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2a2a35"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
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
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => (
                      <span className="text-sm text-muted-foreground">{value}</span>
                    )}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Line
                    type="monotone"
                    dataKey="topSet"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name={`Top Set (${weightUnit})`}
                  />
                  <Line
                    type="monotone"
                    dataKey="e1RM"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name={`Est. 1RM (${weightUnit})`}
                  />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    name={`Volume (k ${weightUnit})`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Session History */}
          <div className="card">
            <h2 className="font-semibold text-lg mb-4">Recent Sessions</h2>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b border-border">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Top Set</th>
                    <th className="pb-3 font-medium">Volume</th>
                    <th className="pb-3 font-medium">Est. 1RM</th>
                    <th className="pb-3 font-medium">Sets</th>
                  </tr>
                </thead>
                <tbody>
                  {history
                    .slice()
                    .reverse()
                    .slice(0, 10)
                    .map((session: { sessionId: string; date: string; topSetWeight: number; topSetReps: number; totalVolume: number; estimated1RM: number; setCount: number }, idx: number) => (
                      <tr
                        key={session.sessionId}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-3">
                          {format(parseISO(session.date), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 font-medium">
                          {session.topSetWeight} {weightUnit} × {session.topSetReps}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {(session.totalVolume / 1000).toFixed(1)}k
                        </td>
                        <td className="py-3 text-accent">
                          {session.estimated1RM} {weightUnit}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {session.setCount}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center py-16">
          <Dumbbell className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
          <p className="text-muted-foreground">
            Start logging workouts with this exercise to see your progress!
          </p>
        </div>
      )}
    </div>
  );
}
