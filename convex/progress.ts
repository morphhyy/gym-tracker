import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAuth } from "./auth";

// Get exercise history for charts
export const getExerciseHistory = query({
  args: {
    exerciseId: v.id("exercises"),
    days: v.optional(v.number()), // Number of days to look back
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const daysBack = args.days ?? 90;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffString = cutoffDate.toISOString().split("T")[0];

    // Get all user sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), cutoffString))
      .collect();

    // Get sets for this exercise from each session
    const history = [];
    for (const session of sessions) {
      const sets = await ctx.db
        .query("sessionSets")
        .withIndex("by_session_exercise", (q) => 
          q.eq("sessionId", session._id).eq("exerciseId", args.exerciseId)
        )
        .collect();

      if (sets.length > 0) {
        // Calculate metrics
        const topSet = sets.reduce((best, set) => 
          set.weight > best.weight ? set : best
        , sets[0]);
        
        const totalVolume = sets.reduce(
          (sum, set) => sum + set.weight * set.repsActual,
          0
        );

        // Estimated 1RM using Epley formula: weight * (1 + reps/30)
        const estimated1RM = topSet.weight * (1 + topSet.repsActual / 30);

        history.push({
          date: session.date,
          sessionId: session._id,
          topSetWeight: topSet.weight,
          topSetReps: topSet.repsActual,
          totalVolume,
          estimated1RM: Math.round(estimated1RM * 10) / 10,
          setCount: sets.length,
          sets: sets.sort((a, b) => a.setIndex - b.setIndex),
        });
      }
    }

    // Sort by date ascending
    return history.sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Get weekly summary
export const getWeeklySummary = query({
  args: {
    weeks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const weeksBack = args.weeks ?? 8;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - weeksBack * 7);
    const cutoffString = cutoffDate.toISOString().split("T")[0];

    // Get all sessions in range
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), cutoffString))
      .collect();

    // Group by week
    const weeklyData: Record<string, {
      weekStart: string;
      sessionCount: number;
      totalVolume: number;
      exerciseIds: Set<string>;
      completedSessions: number;
    }> = {};

    for (const session of sessions) {
      const date = new Date(session.date);
      const weekStart = getWeekStart(date);
      
      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = {
          weekStart,
          sessionCount: 0,
          totalVolume: 0,
          exerciseIds: new Set(),
          completedSessions: 0,
        };
      }

      weeklyData[weekStart].sessionCount++;
      if (session.completedAt) {
        weeklyData[weekStart].completedSessions++;
      }

      // Get all sets for this session
      const sets = await ctx.db
        .query("sessionSets")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();

      for (const set of sets) {
        weeklyData[weekStart].totalVolume += set.weight * set.repsActual;
        weeklyData[weekStart].exerciseIds.add(set.exerciseId);
      }
    }

    // Convert to array and sort
    return Object.values(weeklyData)
      .map((week) => ({
        ...week,
        uniqueExercises: week.exerciseIds.size,
        exerciseIds: undefined,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  },
});

// Get all exercise stats for dashboard
export const getAllExerciseStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    
    // Get recent sessions (last 30 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffString = cutoffDate.toISOString().split("T")[0];

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), cutoffString))
      .collect();

    // Aggregate by exercise
    const exerciseStats: Record<string, {
      exerciseId: string;
      lastWeight: number;
      lastDate: string;
      sessionCount: number;
      totalVolume: number;
      bestWeight: number;
    }> = {};

    for (const session of sessions) {
      const sets = await ctx.db
        .query("sessionSets")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();

      for (const set of sets) {
        const id = set.exerciseId;
        if (!exerciseStats[id]) {
          exerciseStats[id] = {
            exerciseId: id,
            lastWeight: 0,
            lastDate: "",
            sessionCount: 0,
            totalVolume: 0,
            bestWeight: 0,
          };
        }

        const stats = exerciseStats[id];
        stats.totalVolume += set.weight * set.repsActual;
        stats.bestWeight = Math.max(stats.bestWeight, set.weight);
        
        if (session.date > stats.lastDate) {
          stats.lastDate = session.date;
          stats.lastWeight = set.weight;
          stats.sessionCount++;
        }
      }
    }

    // Get exercise details
    const statsWithNames = await Promise.all(
      Object.values(exerciseStats).map(async (stats) => {
        const exerciseId = stats.exerciseId as Id<"exercises">;
        const exercise = await ctx.db.get(exerciseId);
        return {
          ...stats,
          exerciseName: exercise?.name ?? "Unknown",
          muscleGroup: exercise?.muscleGroup,
        };
      })
    );

    return statsWithNames.sort((a, b) => 
      b.lastDate.localeCompare(a.lastDate)
    );
  },
});

// Helper function to get week start (Monday)
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

// Get suggestions for an exercise
export const getExerciseSuggestions = query({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    // Get last 4 sessions for this exercise
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);

    const recentData: {
      date: string;
      sets: { repsActual: number; weight: number }[];
    }[] = [];

    for (const session of sessions) {
      const sets = await ctx.db
        .query("sessionSets")
        .withIndex("by_session_exercise", (q) => 
          q.eq("sessionId", session._id).eq("exerciseId", args.exerciseId)
        )
        .collect();

      if (sets.length > 0) {
        recentData.push({
          date: session.date,
          sets: sets.sort((a, b) => a.setIndex - b.setIndex),
        });
      }

      if (recentData.length >= 4) break;
    }

    if (recentData.length < 2) {
      return {
        suggestion: null,
        reason: "Not enough data yet. Keep logging workouts!",
      };
    }

    // Analyze recent performance
    const lastTwo = recentData.slice(0, 2);
    const [latest, previous] = lastTwo;

    const latestTopSet = latest.sets.reduce((best, set) => 
      set.weight > best.weight ? set : best
    , latest.sets[0]);

    const previousTopSet = previous.sets.reduce((best, set) => 
      set.weight > best.weight ? set : best
    , previous.sets[0]);

    // Check if weight is stable and reps are being hit
    const weightStable = Math.abs(latestTopSet.weight - previousTopSet.weight) < 5;
    const repsMet = latestTopSet.repsActual >= 8; // Assuming 8+ is target

    const exercise = await ctx.db.get(args.exerciseId);
    const exerciseName = exercise?.name ?? "This exercise";

    if (weightStable && repsMet) {
      // Ready to progress
      const increment = latestTopSet.weight >= 100 ? 5 : 2.5;
      return {
        suggestion: "increase",
        amount: increment,
        reason: `You've been consistent at ${latestTopSet.weight} lbs for ${exerciseName}. Try adding ${increment} lbs next session!`,
      };
    } else if (latestTopSet.repsActual < 5 && previousTopSet.repsActual < 5) {
      // Struggling - suggest deload
      const deloadWeight = Math.round(latestTopSet.weight * 0.9);
      return {
        suggestion: "decrease",
        amount: latestTopSet.weight - deloadWeight,
        reason: `You've been struggling with reps on ${exerciseName}. Consider dropping to ${deloadWeight} lbs and building back up.`,
      };
    } else {
      return {
        suggestion: "maintain",
        reason: `Keep working at ${latestTopSet.weight} lbs for ${exerciseName}. You're making progress!`,
      };
    }
  },
});
