// convex/tasks.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { SESSION_EXPIRED_ERROR } from "./constants";

const taskValidator = v.object({
  _id: v.id("tasks"),
  slug: v.string(),
  title_lv: v.string(),
  instruction_lv: v.string(),
  context_lv: v.string(),
  expectedOutput: v.string(),
  level: v.number(),
  hints_lv: v.optional(v.string()),
  example_lv: v.optional(v.string()),
});

// Helper: strip system fields from task document
function pickTaskFields(task: any) {
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
  };
}

// Helper: resolve ordered tasks for an organisation
async function resolveOrgTasks(
  ctx: { db: { get: (id: any) => Promise<any> } },
  org: { taskIds: string[] },
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
      task: taskValidator,
      taskIndex: v.number(),
      totalTasks: v.number(),
      isCompleted: v.boolean(),
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

    const tasks = await resolveOrgTasks(ctx, org);
    const totalTasks = tasks.length;

    if (totalTasks === 0) {
      return { error: "Nav uzdevumu šai organizācijai." };
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

    const totalTasks = org.taskIds.length;
    const nextIndex = session.currentTaskIndex + 1;

    if (nextIndex > totalTasks) {
      return { error: "Visi uzdevumi jau ir pabeigti." };
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
  returns: v.union(taskValidator, v.null()),
  handler: async (ctx) => {
    const task = await ctx.db.query("tasks").first();
    if (!task) return null;

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
    };
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
    v.object({ error: v.string() }),
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return { error: "Sesija nav atrasta." };

    const org = await ctx.db.get(session.organisationId);
    if (!org) return { error: "Organizācija nav atrasta." };

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
      feedback: v.optional(
        v.object({
          strengths_lv: v.string(),
          weaknesses_lv: v.string(),
          improvedPrompt_lv: v.string(),
          explanation_lv: v.string(),
          nextStep_lv: v.string(),
        }),
      ),
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
