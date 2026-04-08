// convex/tasks.ts
import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { SESSION_EXPIRED_ERROR } from "./constants";
import {
  feedbackValidator,
  taskFieldsValidator,
  errorResponseValidator,
} from "./validators";

// Helper: strip system fields from task document
function pickTaskFields(task: Doc<"tasks">) {
  return {
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
  };
}

// Helper: resolve ordered tasks for an organisation
async function resolveOrgTasks(
  ctx: QueryCtx | MutationCtx,
  org: Doc<"organisations">,
) {
  const tasks = [];
  for (const taskId of org.taskIds) {
    const task = await ctx.db.get(taskId);
    if (task) tasks.push(pickTaskFields(task));
  }
  return tasks;
}

// 4.1 — Get current task for a session
export const getCurrentTask = query({
  args: { sessionId: v.id("sessions") },
  returns: v.union(
    v.object({
      task: taskFieldsValidator,
      taskIndex: v.number(),
      totalTasks: v.number(),
      isCompleted: v.boolean(),
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

    const tasks = await resolveOrgTasks(ctx, org);
    const totalTasks = tasks.length;

    if (totalTasks === 0) {
      return {
        error: "Nav uzdevumu šai organizācijai.",
        errorCode: "TASK_NOT_FOUND" as const,
      };
    }

    // All tasks completed
    if (session.currentTaskIndex >= totalTasks) {
      return {
        task: tasks[totalTasks - 1],
        taskIndex: session.currentTaskIndex,
        totalTasks,
        isCompleted: true,
      };
    }

    return {
      task: tasks[session.currentTaskIndex],
      taskIndex: session.currentTaskIndex,
      totalTasks,
      isCompleted: false,
    };
  },
});

// 4.2 — Advance to next task
export const advanceTask = mutation({
  args: { sessionId: v.id("sessions") },
  returns: v.union(
    v.object({
      newTaskIndex: v.number(),
      totalTasks: v.number(),
      isCompleted: v.boolean(),
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

    const totalTasks = org.taskIds.length;
    const nextIndex = session.currentTaskIndex + 1;

    if (nextIndex > totalTasks) {
      return {
        error: "Visi uzdevumi jau ir pabeigti.",
        errorCode: "ALL_TASKS_COMPLETED" as const,
      };
    }

    await ctx.db.patch(args.sessionId, {
      currentTaskIndex: nextIndex,
      lastActiveAt: Date.now(),
    });

    return {
      newTaskIndex: nextIndex,
      totalTasks,
      isCompleted: nextIndex >= totalTasks,
    };
  },
});

// Get first task for login page preview (any org)
export const getFirstTask = query({
  args: {},
  returns: v.union(taskFieldsValidator, v.null()),
  handler: async (ctx) => {
    const task = await ctx.db.query("tasks").first();
    if (!task) return null;
    return pickTaskFields(task);
  },
});

// Get all task summaries for stepper (title + level only)
export const getTaskSummaries = query({
  args: { sessionId: v.id("sessions") },
  returns: v.union(
    v.array(
      v.object({
        _id: v.id("tasks"),
        title_lv: v.string(),
        level: v.number(),
      }),
    ),
    errorResponseValidator,
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session)
      return {
        error: "Sesija nav atrasta.",
        errorCode: "SESSION_NOT_FOUND" as const,
      };

    const org = await ctx.db.get(session.organisationId);
    if (!org)
      return {
        error: "Organizācija nav atrasta.",
        errorCode: "ORG_NOT_FOUND" as const,
      };

    const summaries = [];
    for (const taskId of org.taskIds) {
      const task = await ctx.db.get(taskId);
      if (task) {
        summaries.push({
          _id: task._id,
          title_lv: task.title_lv,
          level: task.level,
        });
      }
    }
    return summaries;
  },
});

// 4.3 — Get submission history for current session
export const getSubmissionHistory = query({
  args: { sessionId: v.id("sessions") },
  returns: v.array(
    v.object({
      _id: v.id("submissions"),
      taskId: v.id("tasks"),
      prompt: v.string(),
      createdAt: v.number(),
      feedback: v.optional(feedbackValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();

    return submissions.map((s) => ({
      _id: s._id,
      taskId: s.taskId,
      prompt: s.prompt,
      createdAt: s.createdAt,
      feedback: s.feedback,
    }));
  },
});
