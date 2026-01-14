import { QueryCtx, MutationCtx } from "./_generated/server";

// Helper to get the authenticated user's Clerk ID
export async function getAuthUserId(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return identity.subject;
}

// Helper that throws if user is not authenticated
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<string> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized: You must be logged in to perform this action");
  }
  return userId;
}
