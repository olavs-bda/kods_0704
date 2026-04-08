// convex/expiry.test.ts
// 8.2 — Session expiry edge case tests
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "./schema";
import * as sessions from "./sessions";
import * as tasks from "./tasks";
import * as submissions from "./submissions";

const modules = import.meta.glob(
  ["./**/*.ts", "!./submitPrompt.ts", "!./**/*.test.ts"],
);

// Seeds one org with one task; returns orgId and task1Id
async function seedOrg(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const taskId = await ctx.db.insert("tasks", {
      slug: "expiry-task-1",
      title_lv: "Termiņa uzdevums",
      instruction_lv: "Termiņa instrukcija",
      context_lv: "Termiņa konteksts",
      expectedOutput: "Expected output",
      level: 1,
    });
    const orgId = await ctx.db.insert("organisations", {
      code: "EXP-ORG",
      name: "Expiry Test Org",
      taskIds: [taskId],
      settings: { sessionExpiryHours: 48, maxSubmissionsPerUser: 10 },
    });
    return { orgId, taskId };
  });
}

// Creates an already-expired session directly in the DB; returns sessionId
async function insertExpiredSession(
  t: ReturnType<typeof convexTest>,
  orgId: string,
  participantCode: string,
) {
  return t.run(async (ctx) => {
    const pastTime = Date.now() - 60_000; // expired 60 seconds ago
    return ctx.db.insert("sessions", {
      organisationId: orgId as any,
      participantCode,
      currentTaskIndex: 0,
      startedAt: pastTime - 3600_000,
      lastActiveAt: pastTime,
      expiresAt: pastTime,
      submissionCount: 0,
    });
  });
}

describe("8.2 — createOrResumeSession: expired session", () => {
  test("returns error when resuming an expired session", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrg(t);
    await insertExpiredSession(t, orgId, "EXPIRED-USER");

    const result = await t.mutation(sessions.createOrResumeSession, {
      organisationCode: "EXP-ORG",
      participantCode: "EXPIRED-USER",
    });

    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toBe(
        "Sesija ir beigusies. Lūdzu, sazinieties ar organizatoru.",
      );
    }
  });

  test("creates a new session when a fresh participant logs in", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    const result = await t.mutation(sessions.createOrResumeSession, {
      organisationCode: "EXP-ORG",
      participantCode: "FRESH-USER",
    });

    expect(result).not.toHaveProperty("error");
    if ("sessionId" in result) {
      expect(result.status).toBe("created");
    }
  });
});

describe("8.2 — touchSession: expired session", () => {
  test("returns 'expired' for an expired session", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrg(t);
    const sessionId = await insertExpiredSession(t, orgId, "TOUCH-EXPIRED");

    const result = await t.mutation(sessions.touchSession, {
      sessionId: sessionId as any,
    });

    expect(result).toBe("expired");
  });

  test("returns 'ok' for a valid non-expired session", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    const session = await t.mutation(sessions.createOrResumeSession, {
      organisationCode: "EXP-ORG",
      participantCode: "TOUCH-VALID",
    });
    expect("sessionId" in session).toBe(true);
    if (!("sessionId" in session)) return;

    const result = await t.mutation(sessions.touchSession, {
      sessionId: session.sessionId,
    });

    expect(result).toBe("ok");
  });
});

describe("8.2 — getSession: expired field", () => {
  test("reports expired=true for an expired session", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrg(t);
    const sessionId = await insertExpiredSession(t, orgId, "GET-EXPIRED");

    const result = await t.query(sessions.getSession, {
      sessionId: sessionId as any,
    });

    expect(result).not.toBeNull();
    expect(result?.expired).toBe(true);
  });

  test("reports expired=false for a valid session", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    const session = await t.mutation(sessions.createOrResumeSession, {
      organisationCode: "EXP-ORG",
      participantCode: "GET-VALID",
    });
    expect("sessionId" in session).toBe(true);
    if (!("sessionId" in session)) return;

    const result = await t.query(sessions.getSession, {
      sessionId: session.sessionId,
    });

    expect(result).not.toBeNull();
    expect(result?.expired).toBe(false);
  });
});

describe("8.2 — getCurrentTask: expired session", () => {
  test("returns error when session is expired", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrg(t);
    const sessionId = await insertExpiredSession(
      t,
      orgId,
      "TASK-EXPIRED-USER",
    );

    const result = await t.query(tasks.getCurrentTask, {
      sessionId: sessionId as any,
    });

    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toBe("Sesija ir beigusies.");
    }
  });

  test("mid-task expiry: session that expires after task retrieval returns error on next call", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    // Create a session that is valid now
    const session = await t.mutation(sessions.createOrResumeSession, {
      organisationCode: "EXP-ORG",
      participantCode: "MID-TASK-USER",
    });
    expect("sessionId" in session).toBe(true);
    if (!("sessionId" in session)) return;

    // Simulate expiry by patching expiresAt to the past
    await t.run(async (ctx) => {
      await ctx.db.patch(session.sessionId, {
        expiresAt: Date.now() - 1,
      });
    });

    // Subsequent call should now report expiry
    const result = await t.query(tasks.getCurrentTask, {
      sessionId: session.sessionId,
    });

    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toBe("Sesija ir beigusies.");
    }
  });
});

describe("8.2 — advanceTask: expired session", () => {
  test("returns error when trying to advance an expired session", async () => {
    const t = convexTest(schema, modules);
    const { orgId } = await seedOrg(t);
    const sessionId = await insertExpiredSession(t, orgId, "ADVANCE-EXPIRED");

    const result = await t.mutation(tasks.advanceTask, {
      sessionId: sessionId as any,
    });

    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toBe("Sesija ir beigusies.");
    }
  });
});

describe("8.2 — getSubmissionContext: expired session", () => {
  test("returns error when session is expired", async () => {
    const t = convexTest(schema, modules);
    const { orgId, taskId } = await seedOrg(t);
    const sessionId = await insertExpiredSession(
      t,
      orgId,
      "SUBMIT-EXPIRED-USER",
    );

    const result = await t.query(submissions.getSubmissionContext, {
      sessionId: sessionId as any,
      taskId: taskId as any,
    });

    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toBe("Sesija ir beigusies.");
    }
  });
});
