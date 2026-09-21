import { defineSchema,defineTable } from "convex/server";
import { v } from "convex/values";
import { vSessionId } from "convex-helpers/server/sessions";
import { recipe } from "./validators";
export default defineSchema({
 users:defineTable({tokenIdentifier:v.string(),sessionId:vSessionId}).index("by_tokenIdentifier",["tokenIdentifier"]),
 plans:defineTable({sessionId:vSessionId,recipes:v.array(recipe),people:v.number(),checked:v.array(v.string()),checkKeyVersion:v.optional(v.literal(1)),status:v.string(),importing:v.boolean(),importId:v.optional(v.string()),importStartedAt:v.optional(v.number()),updatedAt:v.number()}).index("by_sessionId",["sessionId"]),
 mailRequests:defineTable({sessionId:vSessionId,requestId:v.string(),status:v.union(v.literal("pending"),v.literal("sent"),v.literal("failed")),createdAt:v.number()}).index("by_sessionId_and_requestId",["sessionId","requestId"]),
});
