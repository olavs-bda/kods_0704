// convex/users.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsert = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        lat: args.lat,
        lng: args.lng,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      lat: args.lat,
      lng: args.lng,
      trustScore: 0,
      createdAt: Date.now(),
    });
  },
});

export const me = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      email: v.string(),
      name: v.optional(v.string()),
      lat: v.number(),
      lng: v.number(),
      trustScore: v.number(),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();
  },
});

export const profile = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      trustScore: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    return {
      _id: user._id,
      name: user.name,
      trustScore: user.trustScore,
    };
  },
});
