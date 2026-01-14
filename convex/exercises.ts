import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, getAuthUserId } from "./auth";

// Get all exercises (global + user's custom)
export const getAllExercises = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    
    // Get global exercises
    const globalExercises = await ctx.db
      .query("exercises")
      .withIndex("by_global", (q) => q.eq("isGlobal", true))
      .collect();

    // Get user's custom exercises if authenticated
    let userExercises: typeof globalExercises = [];
    if (userId) {
      userExercises = await ctx.db
        .query("exercises")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    }

    return [...globalExercises, ...userExercises].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  },
});

// Create a custom exercise
export const createExercise = mutation({
  args: {
    name: v.string(),
    muscleGroup: v.optional(v.string()),
    equipment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    return await ctx.db.insert("exercises", {
      name: args.name,
      muscleGroup: args.muscleGroup,
      equipment: args.equipment,
      isGlobal: false,
      userId: userId,
      createdAt: Date.now(),
    });
  },
});

// Seed global exercises (run once during setup)
export const seedExercises = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("exercises")
      .withIndex("by_global", (q) => q.eq("isGlobal", true))
      .first();
    
    if (existing) {
      return { message: "Exercises already seeded" };
    }

    const exercises = [
      // Chest
      { name: "Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
      { name: "Incline Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
      { name: "Dumbbell Bench Press", muscleGroup: "Chest", equipment: "Dumbbell" },
      { name: "Incline Dumbbell Press", muscleGroup: "Chest", equipment: "Dumbbell" },
      { name: "Chest Fly", muscleGroup: "Chest", equipment: "Dumbbell" },
      { name: "Cable Crossover", muscleGroup: "Chest", equipment: "Cable" },
      { name: "Push-Up", muscleGroup: "Chest", equipment: "Bodyweight" },
      
      // Back
      { name: "Deadlift", muscleGroup: "Back", equipment: "Barbell" },
      { name: "Barbell Row", muscleGroup: "Back", equipment: "Barbell" },
      { name: "Dumbbell Row", muscleGroup: "Back", equipment: "Dumbbell" },
      { name: "Pull-Up", muscleGroup: "Back", equipment: "Bodyweight" },
      { name: "Lat Pulldown", muscleGroup: "Back", equipment: "Cable" },
      { name: "Seated Cable Row", muscleGroup: "Back", equipment: "Cable" },
      { name: "T-Bar Row", muscleGroup: "Back", equipment: "Barbell" },
      
      // Shoulders
      { name: "Overhead Press", muscleGroup: "Shoulders", equipment: "Barbell" },
      { name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders", equipment: "Dumbbell" },
      { name: "Lateral Raise", muscleGroup: "Shoulders", equipment: "Dumbbell" },
      { name: "Front Raise", muscleGroup: "Shoulders", equipment: "Dumbbell" },
      { name: "Rear Delt Fly", muscleGroup: "Shoulders", equipment: "Dumbbell" },
      { name: "Face Pull", muscleGroup: "Shoulders", equipment: "Cable" },
      
      // Legs
      { name: "Squat", muscleGroup: "Legs", equipment: "Barbell" },
      { name: "Front Squat", muscleGroup: "Legs", equipment: "Barbell" },
      { name: "Leg Press", muscleGroup: "Legs", equipment: "Machine" },
      { name: "Romanian Deadlift", muscleGroup: "Legs", equipment: "Barbell" },
      { name: "Leg Curl", muscleGroup: "Legs", equipment: "Machine" },
      { name: "Leg Extension", muscleGroup: "Legs", equipment: "Machine" },
      { name: "Calf Raise", muscleGroup: "Legs", equipment: "Machine" },
      { name: "Bulgarian Split Squat", muscleGroup: "Legs", equipment: "Dumbbell" },
      { name: "Lunges", muscleGroup: "Legs", equipment: "Dumbbell" },
      
      // Arms
      { name: "Barbell Curl", muscleGroup: "Arms", equipment: "Barbell" },
      { name: "Dumbbell Curl", muscleGroup: "Arms", equipment: "Dumbbell" },
      { name: "Hammer Curl", muscleGroup: "Arms", equipment: "Dumbbell" },
      { name: "Tricep Pushdown", muscleGroup: "Arms", equipment: "Cable" },
      { name: "Skull Crusher", muscleGroup: "Arms", equipment: "Barbell" },
      { name: "Tricep Dip", muscleGroup: "Arms", equipment: "Bodyweight" },
      { name: "Close-Grip Bench Press", muscleGroup: "Arms", equipment: "Barbell" },
      
      // Core
      { name: "Plank", muscleGroup: "Core", equipment: "Bodyweight" },
      { name: "Hanging Leg Raise", muscleGroup: "Core", equipment: "Bodyweight" },
      { name: "Cable Crunch", muscleGroup: "Core", equipment: "Cable" },
      { name: "Ab Wheel Rollout", muscleGroup: "Core", equipment: "Ab Wheel" },
    ];

    for (const exercise of exercises) {
      await ctx.db.insert("exercises", {
        ...exercise,
        isGlobal: true,
        createdAt: Date.now(),
      });
    }

    return { message: `Seeded ${exercises.length} exercises` };
  },
});
