import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles synced from Clerk
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    units: v.optional(v.union(v.literal("kg"), v.literal("lb"))),
    goals: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkUserId"])
    .index("by_email", ["email"]),

  // Exercise catalog (global + per-user custom)
  exercises: defineTable({
    name: v.string(),
    muscleGroup: v.optional(v.string()),
    equipment: v.optional(v.string()),
    isGlobal: v.boolean(),
    userId: v.optional(v.string()), // null for global exercises
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_global", ["isGlobal"]),

  // Workout plans
  plans: defineTable({
    userId: v.string(),
    name: v.string(),
    active: v.boolean(),
    planVersion: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "active"]),

  // Plan days (Mon-Sun for each plan)
  planDays: defineTable({
    planId: v.id("plans"),
    weekday: v.number(), // 0=Monday, 6=Sunday
    name: v.optional(v.string()), // e.g., "Push Day"
    createdAt: v.number(),
  }).index("by_plan", ["planId"]),

  // Exercises within a plan day
  planExercises: defineTable({
    planDayId: v.id("planDays"),
    exerciseId: v.id("exercises"),
    order: v.number(),
    sets: v.array(
      v.object({
        repsTarget: v.number(),
        notes: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
  }).index("by_plan_day", ["planDayId"]),

  // Workout sessions (logged workouts)
  sessions: defineTable({
    userId: v.string(),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    planId: v.optional(v.id("plans")),
    weekday: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // Individual sets logged in a session
  sessionSets: defineTable({
    sessionId: v.id("sessions"),
    exerciseId: v.id("exercises"),
    setIndex: v.number(),
    repsActual: v.number(),
    weight: v.number(),
    rpe: v.optional(v.number()), // Rate of Perceived Exertion (1-10)
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_exercise", ["sessionId", "exerciseId"]),
});
