import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";
import { Id } from "./_generated/dataModel";

// Get user's active plan with all days and exercises
export const getActivePlan = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", userId).eq("active", true)
      )
      .first();

    if (!plan) return null;

    // Get all plan days
    const planDays = await ctx.db
      .query("planDays")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .collect();

    // Get all exercises for each day
    const daysWithExercises = await Promise.all(
      planDays.map(async (day) => {
        const planExercises = await ctx.db
          .query("planExercises")
          .withIndex("by_plan_day", (q) => q.eq("planDayId", day._id))
          .collect();

        // Get exercise details
        const exercisesWithDetails = await Promise.all(
          planExercises.map(async (pe) => {
            const exercise = await ctx.db.get(pe.exerciseId);
            return {
              ...pe,
              exercise,
            };
          })
        );

        return {
          ...day,
          exercises: exercisesWithDetails.sort((a, b) => a.order - b.order),
        };
      })
    );

    return {
      ...plan,
      days: daysWithExercises.sort((a, b) => a.weekday - b.weekday),
    };
  },
});

// Get all user's plans
export const getAllPlans = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    
    return await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get plan by ID
export const getPlanById = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== userId) return null;

    const planDays = await ctx.db
      .query("planDays")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .collect();

    const daysWithExercises = await Promise.all(
      planDays.map(async (day) => {
        const planExercises = await ctx.db
          .query("planExercises")
          .withIndex("by_plan_day", (q) => q.eq("planDayId", day._id))
          .collect();

        const exercisesWithDetails = await Promise.all(
          planExercises.map(async (pe) => {
            const exercise = await ctx.db.get(pe.exerciseId);
            return { ...pe, exercise };
          })
        );

        return {
          ...day,
          exercises: exercisesWithDetails.sort((a, b) => a.order - b.order),
        };
      })
    );

    return {
      ...plan,
      days: daysWithExercises.sort((a, b) => a.weekday - b.weekday),
    };
  },
});

// Get today's workout template
export const getTodayTemplate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    // Get weekday (0=Monday, 6=Sunday)
    const dateObj = new Date(args.date);
    const jsWeekday = dateObj.getUTCDay(); // 0=Sunday, 6=Saturday
    const weekday = jsWeekday === 0 ? 6 : jsWeekday - 1; // Convert to 0=Monday

    const plan = await ctx.db
      .query("plans")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", userId).eq("active", true)
      )
      .first();

    if (!plan) return null;

    const planDay = await ctx.db
      .query("planDays")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .filter((q) => q.eq(q.field("weekday"), weekday))
      .first();

    if (!planDay) return { plan, day: null, exercises: [] };

    const planExercises = await ctx.db
      .query("planExercises")
      .withIndex("by_plan_day", (q) => q.eq("planDayId", planDay._id))
      .collect();

    const exercisesWithDetails = await Promise.all(
      planExercises.map(async (pe) => {
        const exercise = await ctx.db.get(pe.exerciseId);
        return { ...pe, exercise };
      })
    );

    return {
      plan,
      day: planDay,
      exercises: exercisesWithDetails.sort((a, b) => a.order - b.order),
    };
  },
});

// Create a new plan
export const createPlan = mutation({
  args: {
    name: v.string(),
    days: v.array(
      v.object({
        weekday: v.number(),
        name: v.optional(v.string()),
        exercises: v.array(
          v.object({
            exerciseId: v.id("exercises"),
            order: v.number(),
            sets: v.array(
              v.object({
                repsTarget: v.number(),
                notes: v.optional(v.string()),
              })
            ),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Deactivate all existing plans
    const existingPlans = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const maxVersion = existingPlans.reduce(
      (max, p) => Math.max(max, p.planVersion),
      0
    );

    for (const plan of existingPlans) {
      if (plan.active) {
        await ctx.db.patch(plan._id, { active: false });
      }
    }

    // Create new plan
    const planId = await ctx.db.insert("plans", {
      userId,
      name: args.name,
      active: true,
      planVersion: maxVersion + 1,
      createdAt: Date.now(),
    });

    // Create plan days and exercises
    for (const day of args.days) {
      const planDayId = await ctx.db.insert("planDays", {
        planId,
        weekday: day.weekday,
        name: day.name,
        createdAt: Date.now(),
      });

      for (const exercise of day.exercises) {
        await ctx.db.insert("planExercises", {
          planDayId,
          exerciseId: exercise.exerciseId,
          order: exercise.order,
          sets: exercise.sets,
          createdAt: Date.now(),
        });
      }
    }

    return planId;
  },
});

// Set a plan as active
export const setActivePlan = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== userId) {
      throw new Error("Plan not found");
    }

    // Deactivate all other plans
    const allPlans = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const p of allPlans) {
      if (p.active && p._id !== args.planId) {
        await ctx.db.patch(p._id, { active: false });
      }
    }

    // Activate the target plan
    await ctx.db.patch(args.planId, { active: true });

    return args.planId;
  },
});

// Delete a plan
export const deletePlan = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== userId) {
      throw new Error("Plan not found");
    }

    // Delete all plan days and exercises
    const planDays = await ctx.db
      .query("planDays")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    for (const day of planDays) {
      const planExercises = await ctx.db
        .query("planExercises")
        .withIndex("by_plan_day", (q) => q.eq("planDayId", day._id))
        .collect();

      for (const exercise of planExercises) {
        await ctx.db.delete(exercise._id);
      }

      await ctx.db.delete(day._id);
    }

    await ctx.db.delete(args.planId);

    return { success: true };
  },
});
