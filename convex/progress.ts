import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { getAuthUserId } from "./auth";

// Get exercise history for charts
export const getExerciseHistory = query({
  args: {
    exerciseId: v.id("exercises"),
    days: v.optional(v.number()), // Number of days to look back
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

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
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

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
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get ALL user sessions (not just last 30 days) for accurate stats
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Calculate date thresholds
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoString = sevenDaysAgo.toISOString().split("T")[0];

    // Aggregate by exercise
    const exerciseStats: Record<string, {
      exerciseId: string;
      lastWeight: number;
      lastDate: string;
      sessionDates: Set<string>; // Track unique session dates
      totalVolume: number;
      bestWeight: number;
      bestWeightDate: string; // When PR was set
      oldestWeight: number; // First recorded weight
      oldestDate: string; // First session date
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
            sessionDates: new Set(),
            totalVolume: 0,
            bestWeight: 0,
            bestWeightDate: "",
            oldestWeight: set.weight,
            oldestDate: session.date,
          };
        }

        const stats = exerciseStats[id];
        stats.totalVolume += set.weight * set.repsActual;
        stats.sessionDates.add(session.date);

        // Track best weight and when it was set
        if (set.weight > stats.bestWeight) {
          stats.bestWeight = set.weight;
          stats.bestWeightDate = session.date;
        }

        // Track most recent session
        if (session.date > stats.lastDate) {
          stats.lastDate = session.date;
          stats.lastWeight = set.weight;
        }

        // Track oldest session for trend calculation
        if (session.date < stats.oldestDate) {
          stats.oldestDate = session.date;
          stats.oldestWeight = set.weight;
        }
      }
    }

    // Get exercise details
    const statsWithNames = await Promise.all(
      Object.values(exerciseStats).map(async (stats) => {
        const exerciseId = stats.exerciseId as Id<"exercises">;
        const exercise = await ctx.db.get(exerciseId);

        // Calculate if PR was recent (within 7 days)
        const recentPR = stats.bestWeightDate >= sevenDaysAgoString;

        return {
          exerciseId: stats.exerciseId,
          exerciseName: exercise?.name ?? "Unknown",
          muscleGroup: exercise?.muscleGroup,
          lastWeight: stats.lastWeight,
          lastDate: stats.lastDate,
          sessionCount: stats.sessionDates.size, // Proper count of unique sessions
          totalVolume: stats.totalVolume,
          bestWeight: stats.bestWeight,
          bestWeightDate: stats.bestWeightDate,
          oldestWeight: stats.oldestWeight,
          recentPR,
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
    const userId = await getAuthUserId(ctx);
    if (!userId) return { suggestion: null, recentData: [] };

    // Get user's preferred unit
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
      .first();
    const weightUnit = user?.units ?? "kg";

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
        reason: `You've been consistent at ${latestTopSet.weight} ${weightUnit} for ${exerciseName}. Try adding ${increment} ${weightUnit} next session!`,
      };
    } else if (latestTopSet.repsActual < 5 && previousTopSet.repsActual < 5) {
      // Struggling - suggest deload
      const deloadWeight = Math.round(latestTopSet.weight * 0.9);
      return {
        suggestion: "decrease",
        amount: latestTopSet.weight - deloadWeight,
        reason: `You've been struggling with reps on ${exerciseName}. Consider dropping to ${deloadWeight} ${weightUnit} and building back up.`,
      };
    } else {
      return {
        suggestion: "maintain",
        reason: `Keep working at ${latestTopSet.weight} ${weightUnit} for ${exerciseName}. You're making progress!`,
      };
    }
  },
});

// Get suggestions for multiple exercises (batch query for log page)
export const getBatchExerciseSuggestions = query({
  args: { exerciseIds: v.array(v.id("exercises")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return {};

    // Get recent sessions (enough to cover all exercises)
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(30);

    const suggestions: Record<string, {
      suggestion: "increase" | "maintain" | "decrease" | null;
      suggestedWeight?: number;
      lastWeight?: number;
    }> = {};

    for (const exerciseId of args.exerciseIds) {
      // Get recent data for this exercise
      const recentData: {
        date: string;
        sets: { repsActual: number; weight: number }[];
      }[] = [];

      for (const session of sessions) {
        const sets = await ctx.db
          .query("sessionSets")
          .withIndex("by_session_exercise", (q) =>
            q.eq("sessionId", session._id).eq("exerciseId", exerciseId)
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

      // Need at least 2 sessions to make a suggestion
      if (recentData.length < 2) {
        suggestions[exerciseId] = { suggestion: null };
        continue;
      }

      // Analyze recent performance
      const [latest, previous] = recentData.slice(0, 2);

      const latestTopSet = latest.sets.reduce((best, set) =>
        set.weight > best.weight ? set : best
        , latest.sets[0]);

      const previousTopSet = previous.sets.reduce((best, set) =>
        set.weight > best.weight ? set : best
        , previous.sets[0]);

      const weightStable = Math.abs(latestTopSet.weight - previousTopSet.weight) < 5;
      const repsMet = latestTopSet.repsActual >= 8;

      if (weightStable && repsMet) {
        // Ready to progress
        const increment = latestTopSet.weight >= 100 ? 5 : 2.5;
        suggestions[exerciseId] = {
          suggestion: "increase",
          suggestedWeight: latestTopSet.weight + increment,
          lastWeight: latestTopSet.weight,
        };
      } else if (latestTopSet.repsActual < 5 && previousTopSet.repsActual < 5) {
        // Struggling - suggest deload
        const deloadWeight = Math.round(latestTopSet.weight * 0.9);
        suggestions[exerciseId] = {
          suggestion: "decrease",
          suggestedWeight: deloadWeight,
          lastWeight: latestTopSet.weight,
        };
      } else {
        suggestions[exerciseId] = {
          suggestion: "maintain",
          lastWeight: latestTopSet.weight,
        };
      }
    }

    return suggestions;
  },
});
