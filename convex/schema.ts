// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    trustScore: v.number(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  requests: defineTable({
    title: v.string(),
    description: v.string(),
    requesterId: v.id("users"),
    helperId: v.optional(v.id("users")),
    status: v.union(
      v.literal("open"),
      v.literal("accepted"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    lat: v.number(),
    lng: v.number(),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_requesterId", ["requesterId"])
    .index("by_status_and_requesterId", ["status", "requesterId"]),

  interactions: defineTable({
    requesterId: v.id("users"),
    helperId: v.id("users"),
    requestId: v.id("requests"),
    outcome: v.union(v.literal("completed"), v.literal("failed")),
    createdAt: v.number(),
  })
    .index("by_requesterId", ["requesterId"])
    .index("by_helperId", ["helperId"])
    .index("by_requesterId_and_helperId", ["requesterId", "helperId"]),

  messages: defineTable({
    requestId: v.id("requests"),
    senderId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_requestId", ["requestId"]),
});
