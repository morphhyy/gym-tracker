import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

// Get or create today's session
export const getOrCreateSession = mutation({
  args: {
    date: v.string(),
    planId: v.optional(v.id("plans")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    // Check for existing session
    const existingSession = await ctx.db
      .query("sessions")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", userId).eq("date", args.date)
      )
      .first();

    if (existingSession) {
      return existingSession._id;
    }

    // Calculate weekday
    const dateObj = new Date(args.date);
    const jsWeekday = dateObj.getUTCDay();
    const weekday = jsWeekday === 0 ? 6 : jsWeekday - 1;

    // Create new session
    return await ctx.db.insert("sessions", {
      userId,
      date: args.date,
      planId: args.planId,
      weekday,
      createdAt: Date.now(),
    });
  },
});

// Get session by date
export const getSessionByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", userId).eq("date", args.date)
      )
      .first();

    if (!session) return null;

    // Get all sets for this session
    const sets = await ctx.db
      .query("sessionSets")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    // Get exercise details for each set
    const setsWithExercise = await Promise.all(
      sets.map(async (set) => {
        const exercise = await ctx.db.get(set.exerciseId);
        return { ...set, exercise };
      })
    );

    return {
      ...session,
      sets: setsWithExercise,
    };
  },
});

// Log a set
export const logSet = mutation({
  args: {
    sessionId: v.id("sessions"),
    exerciseId: v.id("exercises"),
    setIndex: v.number(),
    repsActual: v.number(),
    weight: v.number(),
    rpe: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    // Verify session belongs to user
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    // Check for existing set at this index
    const existingSet = await ctx.db
      .query("sessionSets")
      .withIndex("by_session_exercise", (q) => 
        q.eq("sessionId", args.sessionId).eq("exerciseId", args.exerciseId)
      )
      .filter((q) => q.eq(q.field("setIndex"), args.setIndex))
      .first();

    if (existingSet) {
      // Update existing set
      await ctx.db.patch(existingSet._id, {
        repsActual: args.repsActual,
        weight: args.weight,
        rpe: args.rpe,
      });
      return existingSet._id;
    } else {
      // Create new set
      return await ctx.db.insert("sessionSets", {
        sessionId: args.sessionId,
        exerciseId: args.exerciseId,
        setIndex: args.setIndex,
        repsActual: args.repsActual,
        weight: args.weight,
        rpe: args.rpe,
        createdAt: Date.now(),
      });
    }
  },
});

// Complete a session
export const completeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(args.sessionId, {
      completedAt: Date.now(),
      notes: args.notes,
    });

    return { success: true };
  },
});

// Get recent sessions
export const getRecentSessions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const limit = args.limit ?? 10;
    
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return sessions;
  },
});

// Get session sets for an exercise (for pre-filling)
export const getLastWeightForExercise = query({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    // Get recent sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);

    for (const session of sessions) {
      const sets = await ctx.db
        .query("sessionSets")
        .withIndex("by_session_exercise", (q) => 
          q.eq("sessionId", session._id).eq("exerciseId", args.exerciseId)
        )
        .first();

      if (sets) {
        return sets.weight;
      }
    }

    return null;
  },
});
