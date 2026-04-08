// convex/submitPromptAction.test.ts
// Integration tests for the submitPrompt action with mocked OpenAI
import { expect, test, describe, vi } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const VALID_FEEDBACK_JSON = JSON.stringify({
  strengths_lv: "Labi formulēts jautājums.",
  weaknesses_lv: "Trūkst konteksta.",
  improvedPrompt_lv: "Uzlabota uzvedne šeit.",
  explanation_lv: "Skaidrojums, kāpēc labāk.",
  nextStep_lv: "Pamēģiniet pievienot lomu.",
});

// Mock OpenAI for the entire file — kept separate from unit tests so
// the classifyOpenAIError instanceof checks are not affected.
vi.mock("openai", () => {
  const createFn = vi.fn();
  class MockOpenAI {
    chat = { completions: { create: createFn } };
  }
  // Expose the mock fn so tests can configure per-test return values
  (MockOpenAI as Record<string, unknown>).__createFn = createFn;
  // Provide stubs for error classes used by classifyOpenAIError
  (MockOpenAI as Record<string, unknown>).APIConnectionError = class extends (
    Error
  ) {};
  (MockOpenAI as Record<string, unknown>).RateLimitError = class extends (
    Error
  ) {};
  (MockOpenAI as Record<string, unknown>).AuthenticationError = class extends (
    Error
  ) {};
  (MockOpenAI as Record<string, unknown>).APIError = class extends Error {};
  return { default: MockOpenAI };
});

// Helper to access the shared mock
async function getCreateFn() {
  const mod = await import("openai");
  return (mod.default as unknown as Record<string, unknown>)
    .__createFn as ReturnType<typeof vi.fn>;
}

const modules = import.meta.glob("./**/*.ts");

// Seed helper: creates org + task + session, returns IDs
async function seedForAction(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const taskId = await ctx.db.insert("tasks", {
      slug: "action-task",
      title_lv: "Testa uzdevums",
      instruction_lv: "Uzrakstiet uzvedni",
      context_lv: "Konteksts",
      expectedOutput: "Kopsavilkums",
      level: 1,
    });
    const orgId = await ctx.db.insert("organisations", {
      code: "ACT-TEST",
      name: "Action Test Org",
      taskIds: [taskId],
      settings: { sessionExpiryHours: 24, maxSubmissionsPerUser: 10 },
    });
    const sessionId = await ctx.db.insert("sessions", {
      organisationId: orgId,
      participantCode: "P1",
      currentTaskIndex: 0,
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      submissionCount: 0,
    });
    return { orgId, taskId, sessionId };
  });
}

describe("submitPrompt action (integration)", () => {
  test("returns feedback on successful OpenAI response", async () => {
    const createFn = await getCreateFn();
    createFn.mockResolvedValueOnce({
      choices: [{ message: { content: VALID_FEEDBACK_JSON } }],
    });

    const t = convexTest(schema, modules);
    const { sessionId, taskId } = await seedForAction(t);

    const result = await t.action(api.submitPrompt.submitPrompt, {
      sessionId,
      taskId,
      prompt: "Mans prompts",
    });

    expect(result).not.toHaveProperty("error");
    if ("feedback" in result) {
      expect(result.feedback.strengths_lv).toBe("Labi formulēts jautājums.");
      expect(result.submissionId).toBeDefined();
    }

    // Verify submission was stored
    const submissions = await t.run(async (ctx) =>
      ctx.db.query("submissions").collect(),
    );
    expect(submissions).toHaveLength(1);
    expect(submissions[0].prompt).toBe("Mans prompts");

    // Verify session submission count incremented
    const session = await t.run(async (ctx) => ctx.db.get(sessionId));
    expect(session?.submissionCount).toBe(1);
  });

  test("returns error when OpenAI returns empty content", async () => {
    const createFn = await getCreateFn();
    createFn.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    const t = convexTest(schema, modules);
    const { sessionId, taskId } = await seedForAction(t);

    const result = await t.action(api.submitPrompt.submitPrompt, {
      sessionId,
      taskId,
      prompt: "Mans prompts",
    });

    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toContain("AI");
    }
  });

  test("returns error when OpenAI throws", async () => {
    const createFn = await getCreateFn();
    createFn.mockRejectedValueOnce(new Error("Network failure"));

    const t = convexTest(schema, modules);
    const { sessionId, taskId } = await seedForAction(t);

    const result = await t.action(api.submitPrompt.submitPrompt, {
      sessionId,
      taskId,
      prompt: "Mans prompts",
    });

    expect(result).toHaveProperty("error");
    // No submission should be stored on failure
    const submissions = await t.run(async (ctx) =>
      ctx.db.query("submissions").collect(),
    );
    expect(submissions).toHaveLength(0);
  });

  test("returns error when session is expired", async () => {
    const t = convexTest(schema, modules);
    const { taskId } = await seedForAction(t);

    // Create an expired session
    const expiredSessionId = await t.run(async (ctx) => {
      const org = (await ctx.db.query("organisations").first())!;
      return ctx.db.insert("sessions", {
        organisationId: org._id,
        participantCode: "EXPIRED",
        currentTaskIndex: 0,
        startedAt: Date.now() - 100_000,
        lastActiveAt: Date.now() - 100_000,
        expiresAt: Date.now() - 1,
        submissionCount: 0,
      });
    });

    const result = await t.action(api.submitPrompt.submitPrompt, {
      sessionId: expiredSessionId,
      taskId,
      prompt: "Mans prompts",
    });

    expect(result).toHaveProperty("error");
  });

  test("returns error when rate limit is exceeded", async () => {
    const t = convexTest(schema, modules);
    const { taskId } = await seedForAction(t);

    // Create a session at max submissions
    const maxedSessionId = await t.run(async (ctx) => {
      const org = (await ctx.db.query("organisations").first())!;
      return ctx.db.insert("sessions", {
        organisationId: org._id,
        participantCode: "MAXED",
        currentTaskIndex: 0,
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        submissionCount: 10,
      });
    });

    const result = await t.action(api.submitPrompt.submitPrompt, {
      sessionId: maxedSessionId,
      taskId,
      prompt: "Mans prompts",
    });

    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toContain("limits");
    }
  });
});
