// convex/sessions.test.ts
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.*s");

// Helper: insert an organisation and return its id via a run() call
async function seedOrg(
  t: ReturnType<typeof convexTest>,
  opts?: { expiryHours?: number; maxSubmissions?: number },
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("organisations", {
      code: "TEST-ORG",
      name: "Test Organisation",
      taskIds: [],
      settings: {
        sessionExpiryHours: opts?.expiryHours ?? 48,
        maxSubmissionsPerUser: opts?.maxSubmissions ?? 10,
      },
    });
  });
}

describe("validateOrganisation", () => {
  test("returns organisation for valid code", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    const result = await t.query(api.sessions.validateOrganisation, {
      code: "TEST-ORG",
    });
    expect(result).not.toBeNull();
    expect(result?.code).toBe("TEST-ORG");
    expect(result?.name).toBe("Test Organisation");
  });

  test("returns null for unknown code", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.sessions.validateOrganisation, {
      code: "DOES-NOT-EXIST",
    });
    expect(result).toBeNull();
  });
});

describe("createOrResumeSession", () => {
  test("creates a new session for valid credentials", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    const result = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-ORG",
      participantCode: "p001",
    });
    expect("sessionId" in result).toBe(true);
    if ("sessionId" in result) {
      expect(result.status).toBe("created");
      expect(typeof result.sessionId).toBe("string");
    }
  });

  test("resumes an existing active session", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    const first = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-ORG",
      participantCode: "p001",
    });
    expect("sessionId" in first).toBe(true);

    const second = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-ORG",
      participantCode: "p001",
    });
    expect("sessionId" in second).toBe(true);
    if ("sessionId" in first && "sessionId" in second) {
      expect(second.status).toBe("resumed");
      expect(second.sessionId).toBe(first.sessionId);
    }
  });

  test("returns error for unknown organisation code", async () => {
    const t = convexTest(schema, modules);
    const result = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "WRONG",
      participantCode: "p001",
    });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("organizācijas");
    }
  });

  test("returns error when existing session has expired", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrg(t);

    // Insert an already-expired session directly
    await t.run(async (ctx) => {
      await ctx.db.insert("sessions", {
        organisationId: orgId,
        participantCode: "p-expired",
        currentTaskIndex: 0,
        startedAt: Date.now() - 100_000,
        lastActiveAt: Date.now() - 100_000,
        expiresAt: Date.now() - 1, // expired
        submissionCount: 0,
      });
    });

    const result = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-ORG",
      participantCode: "p-expired",
    });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("beigusies");
    }
  });
});

describe("touchSession", () => {
  test("returns 'ok' for active session and updates lastActiveAt", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    const created = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-ORG",
      participantCode: "p001",
    });
    expect("sessionId" in created).toBe(true);
    if (!("sessionId" in created)) return;

    const result = await t.mutation(api.sessions.touchSession, {
      sessionId: created.sessionId,
    });
    expect(result).toBe("ok");
  });

  test("returns 'expired' for expired session", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrg(t);

    const sessionId = await t.run(async (ctx) => {
      return await ctx.db.insert("sessions", {
        organisationId: orgId,
        participantCode: "p-expired",
        currentTaskIndex: 0,
        startedAt: Date.now() - 100_000,
        lastActiveAt: Date.now() - 100_000,
        expiresAt: Date.now() - 1,
        submissionCount: 0,
      });
    });

    const result = await t.mutation(api.sessions.touchSession, { sessionId });
    expect(result).toBe("expired");
  });

  test("returns 'expired' for missing session id", async () => {
    const t = convexTest(schema, modules);
    // Use a freshly-created org to get a valid-looking id, then delete it
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

    const result = await t.mutation(api.sessions.touchSession, { sessionId });
    expect(result).toBe("expired");
  });
});

describe("getSession", () => {
  test("returns session data with expired flag false", async () => {
    const t = convexTest(schema, modules);
    await seedOrg(t);

    const created = await t.mutation(api.sessions.createOrResumeSession, {
      organisationCode: "TEST-ORG",
      participantCode: "p001",
    });
    expect("sessionId" in created).toBe(true);
    if (!("sessionId" in created)) return;

    const session = await t.query(api.sessions.getSession, {
      sessionId: created.sessionId,
    });
    expect(session).not.toBeNull();
    expect(session?.participantCode).toBe("p001");
    expect(session?.expired).toBe(false);
    expect(session?.currentTaskIndex).toBe(0);
  });

  test("returns session with expired flag true for expired session", async () => {
    const t = convexTest(schema, modules);
    const orgId = await seedOrg(t);

    const sessionId = await t.run(async (ctx) => {
      return await ctx.db.insert("sessions", {
        organisationId: orgId,
        participantCode: "p-exp",
        currentTaskIndex: 0,
        startedAt: Date.now() - 100_000,
        lastActiveAt: Date.now() - 100_000,
        expiresAt: Date.now() - 1,
        submissionCount: 0,
      });
    });

    const session = await t.query(api.sessions.getSession, { sessionId });
    expect(session).not.toBeNull();
    expect(session?.expired).toBe(true);
  });

  test("returns null for missing session", async () => {
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

    const result = await t.query(api.sessions.getSession, { sessionId });
    expect(result).toBeNull();
  });
});
