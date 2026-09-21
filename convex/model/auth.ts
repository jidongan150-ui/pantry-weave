import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireIdentity(ctx: Pick<QueryCtx, "auth">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("请先登录，再保存你的清单");
  return identity;
}

export async function requireOwner(ctx: QueryCtx | MutationCtx, sessionId: string) {
  const identity = await requireIdentity(ctx);
  const user = await ctx.db.query("users").withIndex("by_tokenIdentifier", q => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
  if (!user || user.sessionId !== sessionId) throw new ConvexError("无权访问这份清单");
  return user;
}
