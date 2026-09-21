import { mutation } from "./_generated/server";
import { vSessionId, type SessionId } from "convex-helpers/server/sessions";
import { RateLimiter, DAY } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { requireIdentity } from "./model/auth";

const limits = new RateLimiter(components.rateLimiter, { newAccounts: { kind: "fixed window", rate: 200, period: DAY } });
export const ensure = mutation({
  args: {}, returns: vSessionId,
  handler: async ctx => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db.query("users").withIndex("by_tokenIdentifier", q => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (existing) return existing.sessionId;
    await limits.limit(ctx, "newAccounts", { throws: true });
    const sessionId = crypto.randomUUID() as SessionId;
    await ctx.db.insert("users", { tokenIdentifier: identity.tokenIdentifier, sessionId });
    return sessionId;
  },
});
