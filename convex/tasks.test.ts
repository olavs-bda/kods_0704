// convex/tasks.test.ts
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.*s");

// Helpers to seed data
async function seedTask(t: ReturnType<typeof convexTest>, level = 1) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("tasks", {
      slug: `task-${Math.random()}`,
      title_lv: "Test Task",
      instruction_lv: "Write a prompt",
      context_lv: "Some context",
      expectedOutput: "A summary",
      level,
    });
  });
}

async function seedOrg(
  t: ReturnType<typeof convexTest>,
  taskIds: Id<"tasks">[] = [],
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("organisations", {
      code: "TEST-ORG",
      name: "Test Org",
      taskIds,
      settings: { sessionExpiryHours: 48, maxSubmissionsPerUser: 10 },
    });
  });
}

async function seedSession(
  t: ReturnType<typeof convexTest>,
  orgId: Id<"organisations">,
  opts?: { currentTaskIndex?: number; expired?: boolean },
) {
  return await t.run(async (ctx) => {
    const now = Date.now();
    return await ctx.db.insert("sessions", {
      organisationId: orgId,
      participantCode: "p001",
      currentTaskIndex: opts?.currentTaskIndex ?? 0,
      startedAt: now,
      lastActiveAt: now,
      expiresAt: opts?.expired ? now - 1 : now + 86_400_000,
      submissionCount: 0,
    });
  });
}

describe("getFirstTask", () => {
  test("returns null when no tasks exist", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.tasks.getFirstTask, {});
    expect(result).toBeNull();
  });

  test("returns first task when tasks exist", async () => {
    const t = convexTest(schema, modules);
    await seedTask(t);

    const result = await t.query(api.tasks.getFirstTask, {});
    expect(result).not.toBeNull();
    expect(result?.title_lv).toBe("Test Task");
    expect(result?.level).toBe(1);
  });
});

describe("getCurrentTask", () => {
  test("returns current task for valid session", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t, 1);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId);

    const result = await t.query(api.tasks.getCurrentTask, { sessionId });
    expect("task" in result).toBe(true);
    if ("task" in result) {
      expect(result.task._id).toBe(taskId);
      expect(result.taskIndex).toBe(0);
      expect(result.totalTasks).toBe(1);
      expect(result.isCompleted).toBe(false);
    }
  });

  test("returns error for missing session", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrg(t);
    const sessionId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("sessions", {
        organisationId: orgId,
        participantCode: "phantom",
        currentTaskIndex: 0,
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        expiresAt: Date.now() + 86_400_000,
        submissionCount: 0,
      });
      await ctx.db.delete(id);
      return id;
    });

    const result = await t.query(api.tasks.getCurrentTask, { sessionId });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("Sesija");
    }
  });

  test("returns error for expired session", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId, { expired: true });

    const result = await t.query(api.tasks.getCurrentTask, { sessionId });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("beigusies");
    }
  });

  test("returns error when organisation not found", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrg(t);
    // Create session with a valid orgId, then delete the org
    const sessionId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("sessions", {
        organisationId: orgId,
        participantCode: "p001",
        currentTaskIndex: 0,
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        expiresAt: Date.now() + 86_400_000,
        submissionCount: 0,
      });
      await ctx.db.delete(orgId);
      return id;
    });

    const result = await t.query(api.tasks.getCurrentTask, { sessionId });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("Organizācija");
    }
  });

  test("returns error when org has no tasks", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrg(t, []); // no tasks
    const sessionId = await seedSession(t, orgId);

    const result = await t.query(api.tasks.getCurrentTask, { sessionId });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("uzdevumu");
    }
  });

  test("returns isCompleted true when all tasks done", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
    // currentTaskIndex === totalTasks means all done
    const sessionId = await seedSession(t, orgId, { currentTaskIndex: 1 });

    const result = await t.query(api.tasks.getCurrentTask, { sessionId });
    expect("task" in result).toBe(true);
    if ("task" in result) {
      expect(result.isCompleted).toBe(true);
    }
  });
});

describe("advanceTask", () => {
  test("advances task index for valid session", async () => {
    const t = convexTest(schema, modules);
    const taskId1 = await seedTask(t);
    const taskId2 = await seedTask(t, 2);
    const orgId = await seedOrg(t, [taskId1, taskId2]);
    const sessionId = await seedSession(t, orgId, { currentTaskIndex: 0 });

    const result = await t.mutation(api.tasks.advanceTask, { sessionId });
    expect("newTaskIndex" in result).toBe(true);
    if ("newTaskIndex" in result) {
      expect(result.newTaskIndex).toBe(1);
      expect(result.totalTasks).toBe(2);
      expect(result.isCompleted).toBe(false);
    }
  });

  test("marks completed when advancing past last task", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId, { currentTaskIndex: 0 });

    const result = await t.mutation(api.tasks.advanceTask, { sessionId });
    expect("newTaskIndex" in result).toBe(true);
    if ("newTaskIndex" in result) {
      expect(result.newTaskIndex).toBe(1);
      expect(result.isCompleted).toBe(true);
    }
  });

  test("returns error when already past all tasks", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId, { currentTaskIndex: 1 });

    const result = await t.mutation(api.tasks.advanceTask, { sessionId });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("pabeigti");
    }
  });

  test("returns error for missing session", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrg(t);
    const sessionId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("sessions", {
        organisationId: orgId,
        participantCode: "phantom",
        currentTaskIndex: 0,
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        expiresAt: Date.now() + 86_400_000,
        submissionCount: 0,
      });
      await ctx.db.delete(id);
      return id;
    });

    const result = await t.mutation(api.tasks.advanceTask, { sessionId });
    expect("error" in result).toBe(true);
  });

  test("returns error for expired session", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId, { expired: true });

    const result = await t.mutation(api.tasks.advanceTask, { sessionId });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("beigusies");
    }
  });

  test("returns error when organisation not found", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrg(t);
    const sessionId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("sessions", {
        organisationId: orgId,
        participantCode: "p001",
        currentTaskIndex: 0,
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        expiresAt: Date.now() + 86_400_000,
        submissionCount: 0,
      });
      await ctx.db.delete(orgId);
      return id;
    });

    const result = await t.mutation(api.tasks.advanceTask, { sessionId });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("Organizācija");
    }
  });
});

describe("getTaskSummaries", () => {
  test("returns task summaries for valid session", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t, 2);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId);

    const result = await t.query(api.tasks.getTaskSummaries, { sessionId });
    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(2);
      expect(result[0].title_lv).toBe("Test Task");
    }
  });

  test("returns error for missing session", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrg(t);
    const sessionId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("sessions", {
        organisationId: orgId,
        participantCode: "phantom",
        currentTaskIndex: 0,
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        expiresAt: Date.now() + 86_400_000,
        submissionCount: 0,
      });
      await ctx.db.delete(id);
      return id;
    });

    const result = await t.query(api.tasks.getTaskSummaries, { sessionId });
    expect("error" in result).toBe(true);
  });

  test("returns error when organisation not found", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrg(t);
    const sessionId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("sessions", {
        organisationId: orgId,
        participantCode: "p001",
        currentTaskIndex: 0,
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        expiresAt: Date.now() + 86_400_000,
        submissionCount: 0,
      });
      await ctx.db.delete(orgId);
      return id;
    });

    const result = await t.query(api.tasks.getTaskSummaries, { sessionId });
    expect("error" in result).toBe(true);
  });
});

describe("getSubmissionHistory", () => {
  test("returns empty array when no submissions", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrg(t);
    const sessionId = await seedSession(t, orgId);

    const result = await t.query(api.tasks.getSubmissionHistory, { sessionId });
    expect(result).toEqual([]);
  });

  test("returns submissions in descending order", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId);

    await t.run(async (ctx) => {
      await ctx.db.insert("submissions", {
        sessionId,
        taskId,
        prompt: "First prompt",
        createdAt: 1000,
      });
      await ctx.db.insert("submissions", {
        sessionId,
        taskId,
        prompt: "Second prompt",
        createdAt: 2000,
      });
    });

    const result = await t.query(api.tasks.getSubmissionHistory, { sessionId });
    expect(result).toHaveLength(2);
    // Ordered desc by creationTime — second inserted comes first
    expect(result[0].prompt).toBe("Second prompt");
    expect(result[1].prompt).toBe("First prompt");
  });

  test("includes feedback when present", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId);

    const feedback = {
      strengths_lv: "Labi",
      weaknesses_lv: "Vājums",
      improvedPrompt_lv: "Labāks",
      explanation_lv: "Iemesls",
      nextStep_lv: "Nākamais",
    };
    await t.run(async (ctx) => {
      await ctx.db.insert("submissions", {
        sessionId,
        taskId,
        prompt: "My prompt",
        createdAt: Date.now(),
        feedback,
      });
    });

    const result = await t.query(api.tasks.getSubmissionHistory, { sessionId });
    expect(result).toHaveLength(1);
    expect(result[0].feedback).toEqual(feedback);
  });
});
