import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "./auth";

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_FEEDBACK_PER_WINDOW = 3; // Max 3 feedback submissions per hour

// Admin emails that can access feedback (add your admin emails here)
const ADMIN_EMAILS = ["admin@gymforge.app"];

// Simple hash function for anonymizing identifiers
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Check and update rate limit
async function checkRateLimit(
  ctx: MutationCtx,
  identifier: string,
  action: string
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now();
  
  // Find existing rate limit record
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_identifier_action", (q) =>
      q.eq("identifier", identifier).eq("action", action)
    )
    .first();

  if (!existing) {
    // First request - create new record
    await ctx.db.insert("rateLimits", {
      identifier,
      action,
      count: 1,
      windowStart: now,
    });
    return {
      allowed: true,
      remaining: MAX_FEEDBACK_PER_WINDOW - 1,
      resetIn: RATE_LIMIT_WINDOW_MS,
    };
  }

  // Check if window has expired
  if (now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    // Reset the window
    await ctx.db.patch(existing._id, {
      count: 1,
      windowStart: now,
    });
    return {
      allowed: true,
      remaining: MAX_FEEDBACK_PER_WINDOW - 1,
      resetIn: RATE_LIMIT_WINDOW_MS,
    };
  }

  // Window is still active - check count
  if (existing.count >= MAX_FEEDBACK_PER_WINDOW) {
    const resetIn = RATE_LIMIT_WINDOW_MS - (now - existing.windowStart);
    return {
      allowed: false,
      remaining: 0,
      resetIn,
    };
  }

  // Increment count
  await ctx.db.patch(existing._id, {
    count: existing.count + 1,
  });

  return {
    allowed: true,
    remaining: MAX_FEEDBACK_PER_WINDOW - existing.count - 1,
    resetIn: RATE_LIMIT_WINDOW_MS - (now - existing.windowStart),
  };
}

// Submit anonymous feedback
export const submitFeedback = mutation({
  args: {
    message: v.string(),
    category: v.optional(v.string()),
    fingerprint: v.string(), // Required for rate limiting
  },
  handler: async (ctx, args) => {
    // Validate message
    const message = args.message.trim();
    if (!message) {
      throw new Error("Feedback message cannot be empty");
    }
    if (message.length > 2000) {
      throw new Error("Feedback message is too long (max 2000 characters)");
    }
    if (message.length < 10) {
      throw new Error("Feedback message is too short (min 10 characters)");
    }

    // Validate fingerprint
    if (!args.fingerprint || args.fingerprint.length < 10) {
      throw new Error("Invalid request. Please refresh and try again.");
    }

    // Create a hash from the fingerprint for rate limiting
    const identifier = simpleHash(args.fingerprint);

    // Check rate limit
    const rateLimit = await checkRateLimit(ctx, identifier, "feedback");
    
    if (!rateLimit.allowed) {
      const minutesRemaining = Math.ceil(rateLimit.resetIn / 60000);
      throw new Error(
        `Too many feedback submissions. Please try again in ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"}.`
      );
    }

    // Insert feedback
    const feedbackId = await ctx.db.insert("feedback", {
      message,
      category: args.category || "general",
      ipHash: identifier,
      createdAt: Date.now(),
    });

    return {
      success: true,
      feedbackId,
      remaining: rateLimit.remaining,
    };
  },
});

// Get all feedback (admin only)
export const getAllFeedback = query({
  args: {},
  handler: async (ctx) => {
    // Check if user is authenticated
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Get user record to check email
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", userId))
      .first();

    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      throw new Error("Admin access required");
    }

    const feedback = await ctx.db
      .query("feedback")
      .order("desc")
      .take(100);
    
    return feedback;
  },
});
