// convex/seed.test.ts
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "./schema";
import { internal } from "./_generated/api";

const modules = import.meta.glob("./**/*.*s");

describe("seedData", () => {
  test("inserts organisations and tasks on first run", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.seed.seedData, {});

    // Verify both organisations were created
    const orgs = await t.run(async (ctx) => ctx.db.query("organisations").collect());
    expect(orgs.length).toBe(2);

    const codes = orgs.map((o) => o.code).sort();
    expect(codes).toEqual(["BDA-2026", "SAEIMA100426"]);

    // Verify tasks were created
    const tasks = await t.run(async (ctx) => ctx.db.query("tasks").collect());
    expect(tasks.length).toBe(6);

    // Verify task ids match
    const bda = orgs.find((o) => o.code === "BDA-2026")!;
    expect(bda.taskIds.length).toBe(6);
    expect(bda.settings.sessionExpiryHours).toBe(48);
    expect(bda.settings.maxSubmissionsPerUser).toBe(50);
  });

  test("skips seeding when data already exists", async () => {
    const t = convexTest(schema, modules);

    // Seed twice
    await t.mutation(internal.seed.seedData, {});
    await t.mutation(internal.seed.seedData, {});

    // Should still only have 2 organisations and 6 tasks
    const orgs = await t.run(async (ctx) => ctx.db.query("organisations").collect());
    expect(orgs.length).toBe(2);

    const tasks = await t.run(async (ctx) => ctx.db.query("tasks").collect());
    expect(tasks.length).toBe(6);
  });

  test("all tasks have expected slugs and levels", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.seedData, {});

    const tasks = await t.run(async (ctx) => ctx.db.query("tasks").collect());
    const slugs = tasks.map((t) => t.slug).sort();
    expect(slugs).toEqual(
      ["task-1-1", "task-1-2", "task-2-1", "task-2-2", "task-3-1", "task-3-2"],
    );

    const levels = tasks.map((t) => t.level).sort();
    expect(levels).toEqual([1, 1, 2, 2, 3, 3]);
  });
});
