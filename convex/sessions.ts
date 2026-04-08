// convex/sessions.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// 3.1 — Validate organisation code
export const validateOrganisation = query({
  args: { code: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("organisations"),
      code: v.string(),
      name: v.string(),
      taskIds: v.array(v.id("tasks")),
      settings: v.object({
        sessionExpiryHours: v.number(),
        maxSubmissionsPerUser: v.number(),
      }),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organisations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!org) return null;
    return {
      _id: org._id,
      code: org.code,
      name: org.name,
      taskIds: org.taskIds,
      settings: org.settings,
    };
  },
});

// 3.2 — Create or resume session
export const createOrResumeSession = mutation({
  args: {
    organisationCode: v.string(),
    participantCode: v.string(),
  },
  returns: v.union(
    v.object({
      sessionId: v.id("sessions"),
      status: v.union(v.literal("created"), v.literal("resumed")),
    }),
    v.object({
      error: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    // Look up organisation
    const org = await ctx.db
      .query("organisations")
      .withIndex("by_code", (q) => q.eq("code", args.organisationCode))
      .first();

    if (!org) {
      return { error: "Nepareizs organizācijas kods." };
    }

    // Check for existing session
    const existingSession = await ctx.db
      .query("sessions")
      .withIndex("by_organisationId_and_participantCode", (q) =>
        q
          .eq("organisationId", org._id)
          .eq("participantCode", args.participantCode),
      )
      .first();

    const now = Date.now();

    if (existingSession) {
      // 3.3 — Check expiry
      if (now > existingSession.expiresAt) {
        return {
          error: "Sesija ir beigusies. Lūdzu, sazinieties ar organizatoru.",
        };
      }

      // 3.4 — Update last activity
      await ctx.db.patch(existingSession._id, { lastActiveAt: now });
      return { sessionId: existingSession._id, status: "resumed" as const };
    }

    // Create new session
    const expiresAt = now + org.settings.sessionExpiryHours * 60 * 60 * 1000;
    const sessionId = await ctx.db.insert("sessions", {
      organisationId: org._id,
      participantCode: args.participantCode,
      currentTaskIndex: 0,
      startedAt: now,
      lastActiveAt: now,
      expiresAt,
      submissionCount: 0,
    });

    return { sessionId, status: "created" as const };
  },
});

// 3.4 — Update session activity (standalone, for periodic touch)
export const touchSession = mutation({
  args: { sessionId: v.id("sessions") },
  returns: v.union(v.literal("ok"), v.literal("expired")),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return "expired";
    }

    const now = Date.now();
    if (now > session.expiresAt) {
      return "expired";
    }

    await ctx.db.patch(args.sessionId, { lastActiveAt: now });
    return "ok";
  },
});

// Query to get full session state (used by frontend)
export const getSession = query({
  args: { sessionId: v.id("sessions") },
  returns: v.union(
    v.object({
      _id: v.id("sessions"),
      organisationId: v.id("organisations"),
      participantCode: v.string(),
      currentTaskIndex: v.number(),
      startedAt: v.number(),
      lastActiveAt: v.number(),
      expiresAt: v.number(),
      submissionCount: v.number(),
      expired: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return null;
    }
    return {
      _id: session._id,
      organisationId: session.organisationId,
      participantCode: session.participantCode,
      currentTaskIndex: session.currentTaskIndex,
      startedAt: session.startedAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      submissionCount: session.submissionCount,
      expired: Date.now() > session.expiresAt,
    };
  },
});
