// convex/cleanup.ts
// Scheduled deletion of expired sessions and their submissions
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { STALE_DATA_RETENTION_DAYS, MS_PER_HOUR } from "./constants";

const RETENTION_MS = STALE_DATA_RETENTION_DAYS * 24 * MS_PER_HOUR;

export const deleteStaleData = internalMutation({
  args: {},
  returns: v.object({
    deletedSessions: v.number(),
    deletedSubmissions: v.number(),
  }),
  handler: async (ctx) => {
    const cutoff = Date.now() - RETENTION_MS;

    // Find sessions that expired before the cutoff
    const staleSessions = await ctx.db.query("sessions").collect();
    const toDelete = staleSessions.filter((s) => s.expiresAt < cutoff);

    let deletedSubmissions = 0;
    for (const session of toDelete) {
      // Delete all submissions belonging to this session
      const submissions = await ctx.db
        .query("submissions")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const sub of submissions) {
        await ctx.db.delete(sub._id);
        deletedSubmissions++;
      }
      await ctx.db.delete(session._id);
    }

    if (toDelete.length > 0) {
      console.log(
        `Cleanup: deleted ${toDelete.length} sessions, ${deletedSubmissions} submissions (cutoff: ${new Date(cutoff).toISOString()})`,
      );
    }

    return { deletedSessions: toDelete.length, deletedSubmissions };
  },
});
