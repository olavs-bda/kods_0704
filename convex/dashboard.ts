// convex/dashboard.ts
// Dashboard queries for the facilitator admin panel, gated by ADMIN_PASSWORD
import { v } from "convex/values";
import { query } from "./_generated/server";

const INVALID_PASSWORD_MSG = "Nepareiza administratora parole.";

function checkPassword(password: string): void {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    throw new Error(INVALID_PASSWORD_MSG);
  }
}

// 11.2 — Active sessions count per organisation
export const getActiveSessionCounts = query({
  args: { password: v.string() },
  returns: v.array(
    v.object({
      orgCode: v.string(),
      orgName: v.string(),
      activeSessions: v.number(),
      totalSessions: v.number(),
    }),
  ),
  handler: async (ctx, { password }) => {
    checkPassword(password);
    const orgs = await ctx.db.query("organisations").collect();
    const now = Date.now();
    const results = [];

    for (const org of orgs) {
      const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_organisationId_and_participantCode", (q) =>
          q.eq("organisationId", org._id),
        )
        .collect();

      const activeSessions = sessions.filter((s) => now < s.expiresAt).length;

      results.push({
        orgCode: org.code,
        orgName: org.name,
        activeSessions,
        totalSessions: sessions.length,
      });
    }

    return results;
  },
});

// 11.2 — Task completion stats: how many participants completed each task + avg score
export const getTaskCompletionStats = query({
  args: { password: v.string() },
  returns: v.array(
    v.object({
      taskSlug: v.string(),
      taskTitle: v.string(),
      level: v.number(),
      submissionCount: v.number(),
      avgScore: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx, { password }) => {
    checkPassword(password);
    const tasks = await ctx.db.query("tasks").collect();
    const results = [];

    for (const task of tasks) {
      const submissions = await ctx.db
        .query("submissions")
        .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
        .collect();

      const scores = submissions
        .map((s) => s.feedback?.score)
        .filter((s): s is number => typeof s === "number");

      const avgScore =
        scores.length > 0 ?
          Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
          10
        : null;

      results.push({
        taskSlug: task.slug,
        taskTitle: task.title_lv,
        level: task.level,
        submissionCount: submissions.length,
        avgScore,
      });
    }

    return results;
  },
});

// 11.2 — Recent submissions feed (last 20)
export const getRecentSubmissions = query({
  args: { password: v.string() },
  returns: v.array(
    v.object({
      participantCode: v.string(),
      taskTitle: v.string(),
      taskLevel: v.number(),
      score: v.union(v.number(), v.null()),
      createdAt: v.number(),
      prompt: v.string(),
    }),
  ),
  handler: async (ctx, { password }) => {
    checkPassword(password);
    const submissions = await ctx.db
      .query("submissions")
      .order("desc")
      .take(20);

    const results = [];

    for (const sub of submissions) {
      const session = await ctx.db.get(sub.sessionId);
      const task = await ctx.db.get(sub.taskId);

      results.push({
        participantCode: session?.participantCode ?? "—",
        taskTitle: task?.title_lv ?? "—",
        taskLevel: task?.level ?? 0,
        score: sub.feedback?.score ?? null,
        createdAt: sub.createdAt,
        prompt: sub.prompt,
      });
    }

    return results;
  },
});
