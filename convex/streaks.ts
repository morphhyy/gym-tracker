import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId, requireAuth } from "./auth";
import {
  computePlannedStreak,
  getPreviousWorkoutDate,
  getTodayDateStr,
  getWorkoutWeekdaysFromActivePlan,
  isSessionCompletedOnDate
} from "./lib/plannedStreak";

// Achievement types and their criteria
const STREAK_ACHIEVEMENTS = [
  { type: "streak_3", threshold: 3, label: "3-Day Streak" },
  { type: "streak_7", threshold: 7, label: "Week Warrior" },
  { type: "streak_14", threshold: 14, label: "Two Week Titan" },
  { type: "streak_30", threshold: 30, label: "Monthly Master" },
  { type: "streak_60", threshold: 60, label: "Iron Will" },
  { type: "streak_100", threshold: 100, label: "Century Club" },
];

// Helper to get start of current week (Sunday)
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sunday, 6=Saturday
  d.setUTCDate(d.getUTCDate() - day); // Go back to Sunday
  return d.toISOString().split("T")[0];
}

// Helper to check if two dates are consecutive days
function areConsecutiveDays(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// Helper to check if date is today
function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

// Helper to check if date is yesterday
function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().split("T")[0];
}

// Get current streak data for the user
export const getStreakData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
      .first();

    if (!user) return null;

    // Get weekly progress
    const weekStart = getWeekStart(new Date());
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const weeklyCompleted = sessions.filter(
      (s) => s.completedAt && s.date >= weekStart
    ).length;

    // Get workout weekdays from active plan
    const workoutWeekdays = await getWorkoutWeekdaysFromActivePlan(ctx, userId);
    const today = getTodayDateStr();

    let currentStreak = user.currentStreak ?? 0;

    // If user has an active plan with workout days, compute plan-aware streak
    if (workoutWeekdays && workoutWeekdays.size > 0) {
      const streakResult = await computePlannedStreak(ctx, userId, today, workoutWeekdays);
      currentStreak = streakResult.streak;
    }

    return {
      currentStreak,
      longestStreak: user.longestStreak ?? 0,
      lastWorkoutDate: user.lastWorkoutDate ?? null,
      weeklyGoal: user.weeklyGoal ?? 3,
      weeklyCompleted,
    };
  },
});

// Update streak when a session is completed
export const updateStreak = mutation({
  args: {
    sessionDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const lastWorkoutDate = user.lastWorkoutDate;
    const currentStreak = user.currentStreak ?? 0;
    const longestStreak = user.longestStreak ?? 0;

    let newStreak = currentStreak;
    const newAchievements: string[] = [];

    // Don't update streak if already logged today
    if (lastWorkoutDate === args.sessionDate) {
      return { streak: currentStreak, newAchievements: [] };
    }

    // Calculate new streak
    if (!lastWorkoutDate) {
      // First workout ever
      newStreak = 1;
    } else if (areConsecutiveDays(lastWorkoutDate, args.sessionDate)) {
      // Consecutive day - increment streak
      newStreak = currentStreak + 1;
    } else if (isToday(args.sessionDate) && isYesterday(lastWorkoutDate)) {
      // Today's workout after yesterday - increment
      newStreak = currentStreak + 1;
    } else {
      // Streak broken - reset to 1
      newStreak = 1;
    }

    // Calculate new longest streak
    const newLongestStreak = Math.max(longestStreak, newStreak);

    // Check for new achievements
    for (const achievement of STREAK_ACHIEVEMENTS) {
      if (newStreak >= achievement.threshold && currentStreak < achievement.threshold) {
        // Check if achievement already earned
        const existing = await ctx.db
          .query("achievements")
          .withIndex("by_user_type", (q) =>
            q.eq("userId", userId).eq("type", achievement.type)
          )
          .first();

        if (!existing) {
          await ctx.db.insert("achievements", {
            userId,
            type: achievement.type,
            unlockedAt: Date.now(),
            metadata: { streak: newStreak },
          });
          newAchievements.push(achievement.type);
        }
      }
    }

    // Update user record
    await ctx.db.patch(user._id, {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastWorkoutDate: args.sessionDate,
    });

    return {
      streak: newStreak,
      longestStreak: newLongestStreak,
      newAchievements,
    };
  },
});

// Set weekly workout goal
export const setWeeklyGoal = mutation({
  args: {
    goal: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    if (args.goal < 1 || args.goal > 7) {
      throw new Error("Weekly goal must be between 1 and 7");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      weeklyGoal: args.goal,
    });

    return { success: true };
  },
});

// Get user achievements
export const getUserAchievements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Add labels to achievements
    return achievements.map((a) => {
      const info = STREAK_ACHIEVEMENTS.find((sa) => sa.type === a.type);
      return {
        ...a,
        label: info?.label ?? a.type,
      };
    });
  },
});

// Check if streak is at risk (hasn't worked out today and streak > 0)
// Now plan-aware: only shows "at_risk" on workout days, rest days never break streak
export const getStreakStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
      .first();

    if (!user) return null;

    const today = getTodayDateStr();

    // Get workout weekdays from active plan
    const workoutWeekdays = await getWorkoutWeekdaysFromActivePlan(ctx, userId);

    // If no active plan, fall back to simple calendar-based logic
    if (!workoutWeekdays || workoutWeekdays.size === 0) {
      const currentStreak = user.currentStreak ?? 0;
      const lastWorkoutDate = user.lastWorkoutDate;

      if (currentStreak === 0) {
        return { status: "none", streak: 0 };
      }

      if (lastWorkoutDate === today) {
        return { status: "completed", streak: currentStreak };
      }

      if (lastWorkoutDate && isYesterday(lastWorkoutDate)) {
        return { status: "at_risk", streak: currentStreak };
      }

      return { status: "broken", streak: 0 };
    }

    // Plan-aware streak status
    const streakResult = await computePlannedStreak(ctx, userId, today, workoutWeekdays);
    const { streak, completedToday, isWorkoutToday } = streakResult;

    if (streak === 0 && !isWorkoutToday) {
      // Rest day with no streak - check if the last workout day was missed
      const lastWorkoutDay = getPreviousWorkoutDate(today, workoutWeekdays);
      if (lastWorkoutDay) {
        const wasCompleted = await isSessionCompletedOnDate(ctx, userId, lastWorkoutDay);
        if (!wasCompleted) {
          return { status: "broken", streak: 0 };
        }
      }
      return { status: "none", streak: 0 };
    }

    if (isWorkoutToday) {
      if (completedToday) {
        return { status: "completed", streak };
      } else if (streak > 0) {
        // Today is a workout day, not done yet, but has an existing streak
        return { status: "at_risk", streak };
      } else {
        // No streak, workout day not completed
        return { status: "none", streak: 0 };
      }
    } else {
      // Rest day - streak is safe, just report the current streak
      if (streak > 0) {
        return { status: "completed", streak };
      }
      return { status: "none", streak: 0 };
    }
  },
});
