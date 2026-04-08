// convex/submissions.test.ts
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.*s");

async function seedTask(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("tasks", {
      slug: "test-task",
      title_lv: "Test Task",
      instruction_lv: "Write a prompt",
      context_lv: "Context here",
      expectedOutput: "A result",
      level: 1,
    });
  });
}

async function seedOrg(
  t: ReturnType<typeof convexTest>,
  taskIds: Id<"tasks">[] = [],
  maxSubmissions = 10,
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("organisations", {
      code: "TEST-ORG",
      name: "Test Org",
      taskIds,
      settings: { sessionExpiryHours: 48, maxSubmissionsPerUser: maxSubmissions },
    });
  });
}

async function seedSession(
  t: ReturnType<typeof convexTest>,
  orgId: Id<"organisations">,
  opts?: { expired?: boolean; submissionCount?: number },
) {
  return await t.run(async (ctx) => {
    const now = Date.now();
    return await ctx.db.insert("sessions", {
      organisationId: orgId,
      participantCode: "p001",
      currentTaskIndex: 0,
      startedAt: now,
      lastActiveAt: now,
      expiresAt: opts?.expired ? now - 1 : now + 86_400_000,
      submissionCount: opts?.submissionCount ?? 0,
    });
  });
}

const sampleFeedback = {
  strengths_lv: "Stiprā puse",
  weaknesses_lv: "Vājā puse",
  improvedPrompt_lv: "Labāka uzvedne",
  explanation_lv: "Skaidrojums",
  nextStep_lv: "Nākamais solis",
};

describe("getSubmissionContext (internal)", () => {
  test("returns context for valid session and task", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId);

    const result = await t.query(
      internal.submissions.getSubmissionContext,
      { sessionId, taskId },
    );
    expect("task" in result).toBe(true);
    if ("task" in result) {
      expect(result.task._id).toBe(taskId);
      expect(result.submissionCount).toBe(0);
      expect(result.maxSubmissions).toBe(10);
    }
  });

  test("returns error for missing session", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
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

    const result = await t.query(
      internal.submissions.getSubmissionContext,
      { sessionId, taskId },
    );
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

    const result = await t.query(
      internal.submissions.getSubmissionContext,
      { sessionId, taskId },
    );
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("beigusies");
    }
  });

  test("returns error when org not found", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
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

    const result = await t.query(
      internal.submissions.getSubmissionContext,
      { sessionId, taskId },
    );
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("Organizācija");
    }
  });

  test("returns error when submission limit reached", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId], 3);
    const sessionId = await seedSession(t, orgId, { submissionCount: 3 });

    const result = await t.query(
      internal.submissions.getSubmissionContext,
      { sessionId, taskId },
    );
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("limits");
    }
  });

  test("returns error when task not in organisation", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    // Org has no tasks
    const orgId = await seedOrg(t, []);
    const sessionId = await seedSession(t, orgId);

    const result = await t.query(
      internal.submissions.getSubmissionContext,
      { sessionId, taskId },
    );
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("Uzdevums");
    }
  });
});

describe("storeSubmission (internal)", () => {
  test("stores submission and increments session count", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId);

    const submissionId = await t.mutation(
      internal.submissions.storeSubmission,
      {
        sessionId,
        taskId,
        prompt: "Test prompt",
        feedback: sampleFeedback,
      },
    );
    expect(typeof submissionId).toBe("string");

    // Verify session count incremented
    const session = await t.run(async (ctx) => ctx.db.get(sessionId));
    expect(session?.submissionCount).toBe(1);

    // Verify submission stored correctly
    const submission = await t.run(async (ctx) => ctx.db.get(submissionId));
    expect(submission?.prompt).toBe("Test prompt");
    expect(submission?.feedback).toEqual(sampleFeedback);
  });

  test("stores submission even when session is deleted (no increment)", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId);

    // Delete session before storing
    await t.run(async (ctx) => ctx.db.delete(sessionId));

    // Should still insert submission (no error) — just no count increment
    const submissionId = await t.mutation(
      internal.submissions.storeSubmission,
      {
        sessionId,
        taskId,
        prompt: "Orphaned prompt",
        feedback: sampleFeedback,
      },
    );
    expect(typeof submissionId).toBe("string");
  });
});

describe("getTaskSubmissions (public)", () => {
  test("returns empty array when no submissions exist", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId);

    const result = await t.query(api.submissions.getTaskSubmissions, {
      sessionId,
      taskId,
    });
    expect(result).toEqual([]);
  });

  test("returns submissions for the specific task only", async () => {
    const t = convexTest(schema, modules);
    const taskId1 = await seedTask(t);
    const taskId2 = await t.run(async (ctx) =>
      ctx.db.insert("tasks", {
        slug: "other-task",
        title_lv: "Other Task",
        instruction_lv: "Other",
        context_lv: "Other",
        expectedOutput: "Other",
        level: 2,
      }),
    );
    const orgId = await seedOrg(t, [taskId1, taskId2]);
    const sessionId = await seedSession(t, orgId);

    await t.run(async (ctx) => {
      await ctx.db.insert("submissions", {
        sessionId,
        taskId: taskId1,
        prompt: "Prompt for task 1",
        createdAt: Date.now(),
        feedback: sampleFeedback,
      });
      await ctx.db.insert("submissions", {
        sessionId,
        taskId: taskId2,
        prompt: "Prompt for task 2",
        createdAt: Date.now(),
      });
    });

    const result = await t.query(api.submissions.getTaskSubmissions, {
      sessionId,
      taskId: taskId1,
    });
    expect(result).toHaveLength(1);
    expect(result[0].prompt).toBe("Prompt for task 1");
    expect(result[0].feedback).toEqual(sampleFeedback);
  });

  test("returns submissions without feedback when feedback is absent", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId]);
    const sessionId = await seedSession(t, orgId);

    await t.run(async (ctx) => {
      await ctx.db.insert("submissions", {
        sessionId,
        taskId,
        prompt: "No feedback yet",
        createdAt: Date.now(),
      });
    });

    const result = await t.query(api.submissions.getTaskSubmissions, {
      sessionId,
      taskId,
    });
    expect(result).toHaveLength(1);
    expect(result[0].feedback).toBeUndefined();
  });
});
