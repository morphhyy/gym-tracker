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
    aiUsageCount: v.optional(v.number()), // Track AI plan generation usage
    // Streak tracking
    currentStreak: v.optional(v.number()),
    longestStreak: v.optional(v.number()),
    lastWorkoutDate: v.optional(v.string()), // ISO date string
    weeklyGoal: v.optional(v.number()), // Target workouts per week (1-7)
    // Rest timer preferences
    defaultRestSeconds: v.optional(v.number()),
    restTimerSound: v.optional(v.boolean()),
    restTimerVibrate: v.optional(v.boolean()),
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
    createdAt: v.number(),
    planVersion: v.optional(v.number()),
    // Sharing fields
    shareToken: v.optional(v.string()),
    sharedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "active"])
    .index("by_share_token", ["shareToken"]),

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
    restSeconds: v.optional(v.number()), // Rest time between sets
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

  // Achievement badges for gamification
  achievements: defineTable({
    userId: v.string(),
    type: v.string(), // e.g., "streak_7", "streak_30", "first_pr", "volume_10k"
    unlockedAt: v.number(),
    metadata: v.optional(v.any()), // Extra data (e.g., { streak: 30 })
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"]),

  // Personal records tracking
  personalRecords: defineTable({
    userId: v.string(),
    exerciseId: v.id("exercises"),
    recordType: v.union(
      v.literal("weight"),
      v.literal("volume"),
      v.literal("e1rm")
    ),
    value: v.number(),
    reps: v.optional(v.number()), // For weight PRs
    setDate: v.string(), // ISO date string
    sessionId: v.id("sessions"),
    previousValue: v.optional(v.number()), // What the old PR was
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_exercise", ["userId", "exerciseId"])
    .index("by_user_exercise_type", ["userId", "exerciseId", "recordType"]),

  // Anonymous feedback submissions
  feedback: defineTable({
    message: v.string(),
    category: v.optional(v.string()), // e.g., "feature_request", "bug", "general"
    ipHash: v.optional(v.string()), // Hashed IP for rate limiting (anonymous)
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_ip_hash", ["ipHash"]),

  // Rate limiting tracker
  rateLimits: defineTable({
    identifier: v.string(), // Hashed IP or other identifier
    action: v.string(), // e.g., "feedback"
    count: v.number(),
    windowStart: v.number(), // Timestamp of when the window started
  }).index("by_identifier_action", ["identifier", "action"]),
});
