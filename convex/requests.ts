// convex/requests.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { getBoundsOfDistance, getDistance } from "geolib";

// Reusable auth helper — resolves current user or throws
async function getCurrentUser(ctx: QueryCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .unique();
  if (!user) {
    throw new Error("User record not found");
  }
  return user;
}

// Round coordinate to ~100m precision for privacy
function roundCoord(coord: number): number {
  return Math.round(coord * 1000) / 1000;
}

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    lat: v.number(),
    lng: v.number(),
  },
  returns: v.id("requests"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db.insert("requests", {
      title: args.title,
      description: args.description,
      requesterId: user._id,
      status: "open",
      lat: args.lat,
      lng: args.lng,
      createdAt: Date.now(),
    });
  },
});

export const feed = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusMeters: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("requests"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      requesterId: v.id("users"),
      status: v.literal("open"),
      lat: v.number(),
      lng: v.number(),
      createdAt: v.number(),
      distance: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const radius = args.radiusMeters ?? 1000;

    const openRequests = await ctx.db
      .query("requests")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .take(200);

    const bounds = getBoundsOfDistance(
      { latitude: args.lat, longitude: args.lng },
      radius,
    );
    const [sw, ne] = bounds;

    const filtered = openRequests
      .filter((r) => {
        if (r.requesterId === user._id) return false;
        return (
          r.lat >= sw.latitude &&
          r.lat <= ne.latitude &&
          r.lng >= sw.longitude &&
          r.lng <= ne.longitude
        );
      })
      .map((r) => ({
        _id: r._id,
        _creationTime: r._creationTime,
        title: r.title,
        description: r.description,
        requesterId: r.requesterId,
        status: r.status as "open",
        lat: roundCoord(r.lat),
        lng: roundCoord(r.lng),
        createdAt: r.createdAt,
        distance: getDistance(
          { latitude: args.lat, longitude: args.lng },
          { latitude: r.lat, longitude: r.lng },
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    return filtered;
  },
});

export const accept = mutation({
  args: {
    requestId: v.id("requests"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }
    if (request.status !== "open") {
      throw new Error("Request is no longer open");
    }
    if (request.requesterId === user._id) {
      throw new Error("Cannot accept your own request");
    }
    await ctx.db.patch(args.requestId, {
      helperId: user._id,
      status: "accepted",
      acceptedAt: Date.now(),
    });
    return null;
  },
});

export const complete = mutation({
  args: {
    requestId: v.id("requests"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }
    if (request.status !== "accepted") {
      throw new Error("Request is not in accepted state");
    }
    if (request.requesterId !== user._id) {
      throw new Error("Only the requester can mark a request as completed");
    }

    // Transition to completed
    await ctx.db.patch(args.requestId, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Log interaction
    await ctx.db.insert("interactions", {
      requesterId: request.requesterId,
      helperId: request.helperId!,
      requestId: args.requestId,
      outcome: "completed",
      createdAt: Date.now(),
    });

    // Increment helper trust score
    const helper = await ctx.db.get(request.helperId!);
    if (helper) {
      await ctx.db.patch(request.helperId!, {
        trustScore: helper.trustScore + 1,
      });
    }

    return null;
  },
});

export const cancel = mutation({
  args: {
    requestId: v.id("requests"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }
    if (request.status !== "open") {
      throw new Error("Can only cancel open requests");
    }
    if (request.requesterId !== user._id) {
      throw new Error("Only the requester can cancel a request");
    }
    await ctx.db.patch(args.requestId, {
      status: "cancelled",
    });
    return null;
  },
});
