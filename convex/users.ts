import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

// Get current user's profile
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
      .unique();
    return user;
  },
});

// Create or update user profile
export const upsertProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    units: v.optional(v.union(v.literal("kg"), v.literal("lb"))),
    goals: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const identity = await ctx.auth.getUserIdentity();
    
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        displayName: args.displayName ?? existingUser.displayName,
        units: args.units ?? existingUser.units,
        goals: args.goals ?? existingUser.goals,
      });
      return existingUser._id;
    } else {
      return await ctx.db.insert("users", {
        clerkUserId: userId,
        email: identity?.email ?? "",
        displayName: args.displayName,
        units: args.units ?? "lb",
        goals: args.goals,
        createdAt: Date.now(),
      });
    }
  },
});

// Ensure user exists (called on sign in)
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const identity = await ctx.auth.getUserIdentity();
    
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
      .unique();

    if (!existingUser) {
      return await ctx.db.insert("users", {
        clerkUserId: userId,
        email: identity?.email ?? "",
        units: "lb",
        createdAt: Date.now(),
      });
    }
    
    return existingUser._id;
  },
});
