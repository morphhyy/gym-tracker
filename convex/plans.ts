import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, getAuthUserId } from "./auth";
import { Id } from "./_generated/dataModel";
import { nanoid } from "nanoid";

// Get user's active plan with all days and exercises
export const getActivePlan = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

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
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

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
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

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
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Get weekday (0=Sunday, 6=Saturday - matches JS Date.getDay())
    const dateObj = new Date(args.date);
    const weekday = dateObj.getUTCDay();

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
    isAIGenerated: v.optional(v.boolean()),
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

    // If AI-generated plan, increment usage count (secure server-side increment)
    if (args.isAIGenerated) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
        .unique();

      if (user) {
        const currentUsage = user.aiUsageCount ?? 0;
        await ctx.db.patch(user._id, {
          aiUsageCount: currentUsage + 1,
        });
      }
    }

    // Deactivate all existing plans
    const existingPlans = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

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

    // Auto-sync weeklyGoal to match the number of workout days
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
      .first();

    if (user && args.days.length > 0) {
      await ctx.db.patch(user._id, { weeklyGoal: args.days.length });
    }

    return planId;
  },
});

// Update an existing plan
export const updatePlan = mutation({
  args: {
    planId: v.id("plans"),
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

    // Verify plan exists and belongs to user
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== userId) {
      throw new Error("Plan not found");
    }

    // Update plan name
    await ctx.db.patch(args.planId, { name: args.name });

    // Delete existing plan days and exercises
    const existingDays = await ctx.db
      .query("planDays")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    for (const day of existingDays) {
      const existingExercises = await ctx.db
        .query("planExercises")
        .withIndex("by_plan_day", (q) => q.eq("planDayId", day._id))
        .collect();

      for (const exercise of existingExercises) {
        await ctx.db.delete(exercise._id);
      }

      await ctx.db.delete(day._id);
    }

    // Create new plan days and exercises
    for (const day of args.days) {
      const planDayId = await ctx.db.insert("planDays", {
        planId: args.planId,
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

    return args.planId;
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

    // Auto-sync weeklyGoal to match the number of workout days
    const planDays = await ctx.db
      .query("planDays")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
      .first();

    if (user && planDays.length > 0) {
      await ctx.db.patch(user._id, { weeklyGoal: planDays.length });
    }

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

// Generate a share token for a plan
export const generateShareToken = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== userId) {
      throw new Error("Plan not found or access denied");
    }

    // If already has a share token, return it
    if (plan.shareToken) {
      return { shareToken: plan.shareToken };
    }

    // Generate new token
    const shareToken = nanoid(12);

    await ctx.db.patch(args.planId, {
      shareToken,
      sharedAt: Date.now(),
    });

    return { shareToken };
  },
});

// Revoke a share token for a plan
export const revokeShareToken = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== userId) {
      throw new Error("Plan not found or access denied");
    }

    await ctx.db.patch(args.planId, {
      shareToken: undefined,
      sharedAt: undefined,
    });

    return { success: true };
  },
});

// Get shared plan by token - NO AUTH REQUIRED
export const getSharedPlan = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    // Find plan by share token
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!plan) {
      return null;
    }

    // Get plan days
    const planDays = await ctx.db
      .query("planDays")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .collect();

    // Get exercises for each day
    const daysWithExercises = await Promise.all(
      planDays.map(async (day) => {
        const planExercises = await ctx.db
          .query("planExercises")
          .withIndex("by_plan_day", (q) => q.eq("planDayId", day._id))
          .collect();

        const exercisesWithDetails = await Promise.all(
          planExercises.map(async (pe) => {
            const exercise = await ctx.db.get(pe.exerciseId);
            return {
              ...pe,
              exercise: exercise
                ? {
                    name: exercise.name,
                    muscleGroup: exercise.muscleGroup,
                    equipment: exercise.equipment,
                  }
                : null,
            };
          })
        );

        return {
          weekday: day.weekday,
          name: day.name,
          exercises: exercisesWithDetails.sort((a, b) => a.order - b.order),
        };
      })
    );

    // Return sanitized plan data (exclude sensitive fields like userId)
    return {
      name: plan.name,
      createdAt: plan.createdAt,
      days: daysWithExercises.sort((a, b) => a.weekday - b.weekday),
    };
  },
});

// Copy a shared plan to user's account
export const copySharedPlan = mutation({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Find the shared plan
    const sourcePlan = await ctx.db
      .query("plans")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!sourcePlan) {
      throw new Error("Shared plan not found");
    }

    // Get source plan days
    const sourceDays = await ctx.db
      .query("planDays")
      .withIndex("by_plan", (q) => q.eq("planId", sourcePlan._id))
      .collect();

    // Deactivate all existing plans
    const existingPlans = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const plan of existingPlans) {
      if (plan.active) {
        await ctx.db.patch(plan._id, { active: false });
      }
    }

    // Create new plan
    const newPlanId = await ctx.db.insert("plans", {
      userId,
      name: `${sourcePlan.name} (Copy)`,
      active: true,
      createdAt: Date.now(),
    });

    // Copy days and exercises
    for (const day of sourceDays) {
      const sourceExercises = await ctx.db
        .query("planExercises")
        .withIndex("by_plan_day", (q) => q.eq("planDayId", day._id))
        .collect();

      const newDayId = await ctx.db.insert("planDays", {
        planId: newPlanId,
        weekday: day.weekday,
        name: day.name,
        createdAt: Date.now(),
      });

      for (const exercise of sourceExercises) {
        // Check if exercise exists and is accessible (global exercises)
        const exerciseData = await ctx.db.get(exercise.exerciseId);

        // Only copy if exercise is global (user-specific exercises won't transfer)
        if (exerciseData && exerciseData.isGlobal) {
          await ctx.db.insert("planExercises", {
            planDayId: newDayId,
            exerciseId: exercise.exerciseId,
            order: exercise.order,
            sets: exercise.sets,
            createdAt: Date.now(),
          });
        }
      }
    }

    // Auto-sync weeklyGoal to match the number of workout days
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
      .first();

    if (user && sourceDays.length > 0) {
      await ctx.db.patch(user._id, { weeklyGoal: sourceDays.length });
    }

    return { planId: newPlanId };
  },
});
