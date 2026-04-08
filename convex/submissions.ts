// convex/submissions.ts
import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { SESSION_EXPIRED_ERROR } from "./constants";

export const feedbackValidator = v.object({
  strengths_lv: v.string(),
  weaknesses_lv: v.string(),
  improvedPrompt_lv: v.string(),
  explanation_lv: v.string(),
  nextStep_lv: v.string(),
});

// 5.4 — Validate session, rate limit, and return task context
export const getSubmissionContext = internalQuery({
  args: { sessionId: v.id("sessions"), taskId: v.id("tasks") },
  returns: v.union(
    v.object({
      sessionId: v.id("sessions"),
      submissionCount: v.number(),
      task: v.object({
        _id: v.id("tasks"),
        slug: v.string(),
        title_lv: v.string(),
        instruction_lv: v.string(),
        context_lv: v.string(),
        expectedOutput: v.string(),
        level: v.number(),
        hints_lv: v.optional(v.string()),
        example_lv: v.optional(v.string()),
      }),
      maxSubmissions: v.number(),
    }),
    v.object({ error: v.string() }),
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return { error: "Sesija nav atrasta." };
    }
    if (Date.now() > session.expiresAt) {
      return { error: SESSION_EXPIRED_ERROR };
    }

    const org = await ctx.db.get(session.organisationId);
    if (!org) {
      return { error: "Organizācija nav atrasta." };
    }

    if (session.submissionCount >= org.settings.maxSubmissionsPerUser) {
      return { error: "Iesniegumu limits ir sasniegts." };
    }

    // Verify task exists and belongs to this organisation
    if (!org.taskIds.includes(args.taskId)) {
      return { error: "Uzdevums nav atrasts." };
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return { error: "Uzdevums nav atrasts." };
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
  },
  returns: v.id("submissions"),
  handler: async (ctx, args) => {
    const submissionId = await ctx.db.insert("submissions", {
      sessionId: args.sessionId,
      taskId: args.taskId,
      prompt: args.prompt,
      createdAt: Date.now(),
      feedback: args.feedback,
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
