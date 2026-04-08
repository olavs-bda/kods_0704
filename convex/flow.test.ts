// convex/flow.test.ts
// 8.1 — End-to-end access → task → submit flow tests
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { api, internal } from "./_generated/api";

// Explicit module map — excludes the node-only submitPrompt action
const modules = import.meta.glob([
  "./**/*.ts",
  "!./submitPrompt.ts",
  "!./**/*.test.ts",
]);

// Seeds one organisation with two tasks and returns their IDs
async function seedOrg(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const task1Id = await ctx.db.insert("tasks", {
      slug: "flow-task-1",
      title_lv: "Pirmais uzdevums",
      instruction_lv: "Instrukcija pirmajam uzdevumam",
      context_lv: "Konteksts pirmajam uzdevumam",
      expectedOutput: "Expected output 1",
      level: 1,
    });
    const task2Id = await ctx.db.insert("tasks", {
      slug: "flow-task-2",
      title_lv: "Otrais uzdevums",
      instruction_lv: "Instrukcija otrajam uzdevumam",
      context_lv: "Konteksts otrajam uzdevumam",
      expectedOutput: "Expected output 2",
      level: 2,
    });
    const orgId = await ctx.db.insert("organisations", {
      code: "TEST-2025",
      name: "Test Org",
      taskIds: [task1Id, task2Id],
      settings: { sessionExpiryHours: 24, maxSubmissionsPerUser: 10 },
    });
    return { orgId, task1Id, task2Id };
  });
}

describe("8.1 — validateOrganisation", () => {
  test("returns org for a valid code", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    const result = await t.query(api.sessions.validateOrganisation, {
      code: "TEST-2025",
    });

    expect(result).not.toBeNull();
    expect(result?.code).toBe("TEST-2025");
    expect(result?.name).toBe("Test Org");
    expect(result?.taskIds).toHaveLength(2);
  });

  test("returns null for an unknown code", async () => {
    const t = convexTest(schema, modules);

    const result = await t.query(api.sessions.validateOrganisation, {
      code: "NO-SUCH-ORG",
    });

    expect(result).toBeNull();
  });
});

describe("8.1 — createOrResumeSession", () => {
  test("creates a new session for valid codes", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    const result = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-2025",
      participantCode: "DALIBNIEKS-01",
    });

    expect(result).not.toHaveProperty("error");
    if ("sessionId" in result) {
      expect(result.status).toBe("created");
      expect(result.sessionId).toBeTruthy();
    }
  });

  test("returns error for an invalid organisation code", async () => {
    const t = convexTest(schema, modules);

    const result = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "INVALID",
      participantCode: "DALIBNIEKS-01",
    });

    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toBe("Nepareizs organizācijas kods.");
    }
  });

  test("resumes an existing non-expired session", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-2025",
      participantCode: "DALIBNIEKS-02",
    });

    const result = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-2025",
      participantCode: "DALIBNIEKS-02",
    });

    expect(result).not.toHaveProperty("error");
    if ("sessionId" in result) {
      expect(result.status).toBe("resumed");
    }
  });

  test("two different participants get separate sessions", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    const r1 = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-2025",
      participantCode: "DALIBNIEKS-A",
    });
    const r2 = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-2025",
      participantCode: "DALIBNIEKS-B",
    });

    expect("sessionId" in r1 && "sessionId" in r2).toBe(true);
    if ("sessionId" in r1 && "sessionId" in r2) {
      expect(r1.sessionId).not.toBe(r2.sessionId);
    }
  });
});

describe("8.1 — getCurrentTask", () => {
  test("returns first task after session creation", async () => {
    const t = convexTest(schema, modules);
    const { task1Id } = await seedOrg(t);

    const session = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-2025",
      participantCode: "DALIBNIEKS-03",
    });
    expect("sessionId" in session).toBe(true);
    if (!("sessionId" in session)) return;

    const taskData = await t.query(api.tasks.getCurrentTask, {
      sessionId: session.sessionId,
    });

    expect(taskData).not.toHaveProperty("error");
    if ("task" in taskData) {
      expect(taskData.task._id).toBe(task1Id);
      expect(taskData.taskIndex).toBe(0);
      expect(taskData.totalTasks).toBe(2);
      expect(taskData.isCompleted).toBe(false);
    }
  });

  test("returns error for an unknown session id", async () => {
    const t = convexTest(schema, modules);

    // Create and immediately delete a session to get a valid-format but non-existent ID
    const deletedId = await t.run(async (ctx) => {
      const orgId = await ctx.db.insert("organisations", {
        name: "Temp",
        code: "TEMP",
        taskIds: [],
        settings: { sessionExpiryHours: 24, maxSubmissionsPerUser: 5 },
      });
      const id = await ctx.db.insert("sessions", {
        organisationId: orgId,
        participantCode: "TEMP",
        currentTaskIndex: 0,
        submissionCount: 0,
        startedAt: Date.now(),
        expiresAt: Date.now() + 60_000,
        lastActiveAt: Date.now(),
      });
      await ctx.db.delete(id);
      return id;
    });

    const taskData = await t.query(api.tasks.getCurrentTask, {
      sessionId: deletedId,
    });

    expect(taskData).toHaveProperty("error");
  });
});

describe("8.1 — advanceTask", () => {
  test("advances session to the next task", async () => {
    const t = convexTest(schema, modules);
    const { task2Id } = await seedOrg(t);

    const session = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-2025",
      participantCode: "DALIBNIEKS-04",
    });
    expect("sessionId" in session).toBe(true);
    if (!("sessionId" in session)) return;

    const advance = await t.mutation(api.tasks.advanceTask, {
      sessionId: session.sessionId,
    });

    expect(advance).not.toHaveProperty("error");
    if ("newTaskIndex" in advance) {
      expect(advance.newTaskIndex).toBe(1);
      expect(advance.isCompleted).toBe(false);
    }

    // Confirm current task is now the second one
    const taskData = await t.query(api.tasks.getCurrentTask, {
      sessionId: session.sessionId,
    });
    if ("task" in taskData) {
      expect(taskData.task._id).toBe(task2Id);
      expect(taskData.taskIndex).toBe(1);
    }
  });

  test("marks session as completed after all tasks are advanced through", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    const session = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-2025",
      participantCode: "DALIBNIEKS-05",
    });
    expect("sessionId" in session).toBe(true);
    if (!("sessionId" in session)) return;

    await t.mutation(api.tasks.advanceTask, { sessionId: session.sessionId });
    const last = await t.mutation(api.tasks.advanceTask, {
      sessionId: session.sessionId,
    });

    if ("newTaskIndex" in last) {
      expect(last.isCompleted).toBe(true);
    }

    const taskData = await t.query(api.tasks.getCurrentTask, {
      sessionId: session.sessionId,
    });
    if ("task" in taskData) {
      expect(taskData.isCompleted).toBe(true);
    }
  });
});

describe("8.1 — submission storage (storeSubmission + getTaskSubmissions)", () => {
  const mockFeedback = {
    strengths_lv: "Laba struktūra.",
    weaknesses_lv: "Trūkst konteksta.",
    improvedPrompt_lv: "Uzlabots prompts.",
    explanation_lv: "Skaidrojums.",
    nextStep_lv: "Nākamais solis.",
  };

  test("stores a submission and increments session submissionCount", async () => {
    const t = convexTest(schema, modules);
    const { task1Id } = await seedOrg(t);

    const session = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-2025",
      participantCode: "DALIBNIEKS-06",
    });
    expect("sessionId" in session).toBe(true);
    if (!("sessionId" in session)) return;

    const submissionId = await t.mutation(
      internal.submissions.storeSubmission,
      {
        sessionId: session.sessionId,
        taskId: task1Id,
        prompt: "Mans tests prompts.",
        feedback: mockFeedback,
      },
    );

    expect(submissionId).toBeTruthy();

    // Verify submissionCount was incremented
    const sessionState = await t.query(api.sessions.getSession, {
      sessionId: session.sessionId,
    });
    expect(sessionState?.submissionCount).toBe(1);
  });

  test("getTaskSubmissions returns submissions for the current task", async () => {
    const t = convexTest(schema, modules);
    const { task1Id } = await seedOrg(t);

    const session = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-2025",
      participantCode: "DALIBNIEKS-07",
    });
    expect("sessionId" in session).toBe(true);
    if (!("sessionId" in session)) return;

    await t.mutation(internal.submissions.storeSubmission, {
      sessionId: session.sessionId,
      taskId: task1Id,
      prompt: "Pirmais mēģinājums.",
      feedback: mockFeedback,
    });
    await t.mutation(internal.submissions.storeSubmission, {
      sessionId: session.sessionId,
      taskId: task1Id,
      prompt: "Otrais mēģinājums.",
      feedback: mockFeedback,
    });

    const result = await t.query(api.submissions.getTaskSubmissions, {
      sessionId: session.sessionId,
      taskId: task1Id,
    });

    expect(result).toHaveLength(2);
    expect(result[0].prompt).toBe("Otrais mēģinājums.");
    expect(result[1].prompt).toBe("Pirmais mēģinājums.");
  });

  test("getSubmissionContext blocks submission when limit is reached", async () => {
    const t = convexTest(schema, modules);
    const { task1Id } = await seedOrg(t);

    // Exhaust the limit (10 submissions) by direct DB manipulation
    const session = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-2025",
      participantCode: "DALIBNIEKS-08",
    });
    expect("sessionId" in session).toBe(true);
    if (!("sessionId" in session)) return;

    await t.run(async (ctx) => {
      await ctx.db.patch(session.sessionId, { submissionCount: 10 });
    });

    const context = await t.query(internal.submissions.getSubmissionContext, {
      sessionId: session.sessionId,
      taskId: task1Id,
    });

    expect(context).toHaveProperty("error");
    if ("error" in context) {
      expect(context.error).toBe("Iesniegumu limits ir sasniegts.");
    }
  });
});
