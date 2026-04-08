// convex/submissions.ts
import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { SESSION_EXPIRED_ERROR } from "./constants";
import {
  feedbackValidator,
  taskFieldsValidator,
  tokenUsageValidator,
  errorResponseValidator,
} from "./validators";

// 5.4 — Validate session, rate limit, and return task context
export const getSubmissionContext = internalQuery({
  args: { sessionId: v.id("sessions"), taskId: v.id("tasks") },
  returns: v.union(
    v.object({
      sessionId: v.id("sessions"),
      submissionCount: v.number(),
      task: taskFieldsValidator,
      maxSubmissions: v.number(),
    }),
    errorResponseValidator,
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        error: "Sesija nav atrasta.",
        errorCode: "SESSION_NOT_FOUND" as const,
      };
    }
    if (Date.now() > session.expiresAt) {
      return {
        error: SESSION_EXPIRED_ERROR,
        errorCode: "SESSION_EXPIRED" as const,
      };
    }

    const org = await ctx.db.get(session.organisationId);
    if (!org) {
      return {
        error: "Organizācija nav atrasta.",
        errorCode: "ORG_NOT_FOUND" as const,
      };
    }

    if (session.submissionCount >= org.settings.maxSubmissionsPerUser) {
      return {
        error: "Iesniegumu limits ir sasniegts.",
        errorCode: "RATE_LIMITED" as const,
      };
    }

    // Verify task exists and belongs to this organisation
    if (!org.taskIds.includes(args.taskId)) {
      return {
        error: "Uzdevums nav atrasts.",
        errorCode: "TASK_NOT_FOUND" as const,
      };
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return {
        error: "Uzdevums nav atrasts.",
        errorCode: "TASK_NOT_FOUND" as const,
      };
    }

    return {
      sessionId: session._id,
      submissionCount: session.submissionCount,
      task: {
        _id: task._id,
        slug: task.slug,
        title_lv: task.title_lv,
        instruction_lv: task.instruction_lv,
        context_lv: task.context_lv,
        expectedOutput: task.expectedOutput,
        level: task.level,
        hints_lv: task.hints_lv,
        example_lv: task.example_lv,
        teachingNote_lv: task.teachingNote_lv,
      },
      maxSubmissions: org.settings.maxSubmissionsPerUser,
    };
  },
});

// 5.5 — Store submission with feedback and increment submission count
export const storeSubmission = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    taskId: v.id("tasks"),
    prompt: v.string(),
    feedback: feedbackValidator,
    tokenUsage: v.optional(tokenUsageValidator),
  },
  returns: v.id("submissions"),
  handler: async (ctx, args) => {
    const submissionId = await ctx.db.insert("submissions", {
      sessionId: args.sessionId,
      taskId: args.taskId,
      prompt: args.prompt,
      createdAt: Date.now(),
      feedback: args.feedback,
      tokenUsage: args.tokenUsage,
    });

    const session = await ctx.db.get(args.sessionId);
    if (session) {
      await ctx.db.patch(args.sessionId, {
        submissionCount: session.submissionCount + 1,
        lastActiveAt: Date.now(),
      });
    }

    return submissionId;
  },
});

// 5.6 — Get submissions for a specific task (supports resubmit/edit flow)
export const getTaskSubmissions = query({
  args: { sessionId: v.id("sessions"), taskId: v.id("tasks") },
  returns: v.array(
    v.object({
      _id: v.id("submissions"),
      prompt: v.string(),
      createdAt: v.number(),
      feedback: v.optional(feedbackValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_sessionId_and_taskId", (q) =>
        q.eq("sessionId", args.sessionId).eq("taskId", args.taskId),
      )
      .order("desc")
      .collect();

    return submissions.map((s) => ({
      _id: s._id,
      prompt: s.prompt,
      createdAt: s.createdAt,
      feedback: s.feedback,
    }));
  },
});

// 9.5 — Get previous prompts for comparative feedback (most recent first, capped at 2)
export const getPreviousPrompts = internalQuery({
  args: { sessionId: v.id("sessions"), taskId: v.id("tasks") },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_sessionId_and_taskId", (q) =>
        q.eq("sessionId", args.sessionId).eq("taskId", args.taskId),
      )
      .order("desc")
      .take(2);

    // Return in chronological order (oldest first)
    return submissions.map((s) => s.prompt).reverse();
  },
});

// 10.3 — Check for cached feedback on exact (taskId, prompt) match
export const getCachedFeedback = internalQuery({
  args: { taskId: v.id("tasks"), prompt: v.string() },
  returns: v.union(feedbackValidator, v.null()),
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();

    for (const sub of submissions) {
      if (sub.prompt === args.prompt && sub.feedback) {
        return sub.feedback;
      }
    }
    return null;
  },
});
