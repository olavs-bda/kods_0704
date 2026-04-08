// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organisations: defineTable({
    code: v.string(),
    name: v.string(),
    taskIds: v.array(v.id("tasks")),
    settings: v.object({
      sessionExpiryHours: v.number(),
      maxSubmissionsPerUser: v.number(),
    }),
  }).index("by_code", ["code"]),

  sessions: defineTable({
    organisationId: v.id("organisations"),
    participantCode: v.string(),
    currentTaskIndex: v.number(),
    startedAt: v.number(),
    lastActiveAt: v.number(),
    expiresAt: v.number(),
    submissionCount: v.number(),
  }).index("by_organisationId_and_participantCode", [
    "organisationId",
    "participantCode",
  ]),

  tasks: defineTable({
    slug: v.string(),
    title_lv: v.string(),
    instruction_lv: v.string(),
    context_lv: v.string(),
    expectedOutput: v.string(),
    level: v.number(),
    hints_lv: v.optional(v.string()),
    example_lv: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  submissions: defineTable({
    sessionId: v.id("sessions"),
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
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_sessionId_and_taskId", ["sessionId", "taskId"]),
});
