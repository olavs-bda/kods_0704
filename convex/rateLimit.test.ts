// convex/rateLimit.test.ts
// 8.3 — Rate limiting validation: boundary and enforcement tests
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "./schema";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const modules = import.meta.glob([
  "./**/*.ts",
  "!./submitPrompt.ts",
  "!./**/*.test.ts",
]);

async function seedTask(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    return ctx.db.insert("tasks", {
      slug: "rate-task-1",
      title_lv: "Limita uzdevums",
      instruction_lv: "Instrukcija",
      context_lv: "Konteksts",
      expectedOutput: "Expected output",
      level: 1,
    });
  });
}

async function seedOrg(
  t: ReturnType<typeof convexTest>,
  taskIds: Id<"tasks">[],
  maxSubmissions: number,
) {
  return t.run(async (ctx) => {
    return ctx.db.insert("organisations", {
      code: "RATE-ORG",
      name: "Rate Limit Org",
      taskIds,
      settings: {
        sessionExpiryHours: 48,
        maxSubmissionsPerUser: maxSubmissions,
      },
    });
  });
}

async function seedSession(
  t: ReturnType<typeof convexTest>,
  orgId: Id<"organisations">,
  submissionCount: number,
) {
  return t.run(async (ctx) => {
    return ctx.db.insert("sessions", {
      organisationId: orgId,
      participantCode: "rate-p001",
      currentTaskIndex: 0,
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
      expiresAt: Date.now() + 86_400_000,
      submissionCount,
    });
  });
}

const sampleFeedback = {
  strengths_lv: "Labi",
  weaknesses_lv: "Vāji",
  improvedPrompt_lv: "Labāks",
  explanation_lv: "Kāpēc",
  nextStep_lv: "Tālāk",
};

describe("8.3 — Rate limit boundary tests", () => {
  test("allows submission when count is one below limit", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId], 5);
    const sessionId = await seedSession(t, orgId, 4); // 4 of 5 used

    const result = await t.query(internal.submissions.getSubmissionContext, {
      sessionId,
      taskId,
    });

    expect("task" in result).toBe(true);
    if ("task" in result) {
      expect(result.submissionCount).toBe(4);
      expect(result.maxSubmissions).toBe(5);
    }
  });

  test("blocks submission when count equals limit", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId], 5);
    const sessionId = await seedSession(t, orgId, 5); // 5 of 5 used

    const result = await t.query(internal.submissions.getSubmissionContext, {
      sessionId,
      taskId,
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Iesniegumu limits ir sasniegts.");
    }
  });

  test("blocks submission when count exceeds limit", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId], 3);
    const sessionId = await seedSession(t, orgId, 7); // 7 of 3 (overflow)

    const result = await t.query(internal.submissions.getSubmissionContext, {
      sessionId,
      taskId,
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Iesniegumu limits ir sasniegts.");
    }
  });

  test("blocks when limit is 1 and one submission already made", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId], 1);
    const sessionId = await seedSession(t, orgId, 1);

    const result = await t.query(internal.submissions.getSubmissionContext, {
      sessionId,
      taskId,
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Iesniegumu limits ir sasniegts.");
    }
  });

  test("allows first submission when limit is 1", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId], 1);
    const sessionId = await seedSession(t, orgId, 0);

    const result = await t.query(internal.submissions.getSubmissionContext, {
      sessionId,
      taskId,
    });

    expect("task" in result).toBe(true);
  });
});

describe("8.3 — Rate limit enforcement through storeSubmission", () => {
  test("storeSubmission increments count; subsequent getSubmissionContext blocks at limit", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId], 2);
    const sessionId = await seedSession(t, orgId, 0);

    // First submission — should work
    const ctx1 = await t.query(internal.submissions.getSubmissionContext, {
      sessionId,
      taskId,
    });
    expect("task" in ctx1).toBe(true);

    await t.mutation(internal.submissions.storeSubmission, {
      sessionId,
      taskId,
      prompt: "Pirmais",
      feedback: sampleFeedback,
    });

    // Second submission — should still work (1 of 2)
    const ctx2 = await t.query(internal.submissions.getSubmissionContext, {
      sessionId,
      taskId,
    });
    expect("task" in ctx2).toBe(true);

    await t.mutation(internal.submissions.storeSubmission, {
      sessionId,
      taskId,
      prompt: "Otrais",
      feedback: sampleFeedback,
    });

    // Third submission — should be blocked (2 of 2 used)
    const ctx3 = await t.query(internal.submissions.getSubmissionContext, {
      sessionId,
      taskId,
    });
    expect("error" in ctx3).toBe(true);
    if ("error" in ctx3) {
      expect(ctx3.error).toBe("Iesniegumu limits ir sasniegts.");
    }
  });

  test("error message is clear Latvian text", async () => {
    const t = convexTest(schema, modules);
    const taskId = await seedTask(t);
    const orgId = await seedOrg(t, [taskId], 1);
    const sessionId = await seedSession(t, orgId, 1);

    const result = await t.query(internal.submissions.getSubmissionContext, {
      sessionId,
      taskId,
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      // Verify it's user-friendly Latvian, not a technical message
      expect(result.error).toMatch(/^[A-ZĀ-Ž]/); // starts with uppercase
      expect(result.error).toMatch(/\.$/); // ends with period
      expect(result.error).not.toContain("Error");
      expect(result.error).not.toContain("error");
    }
  });
});
