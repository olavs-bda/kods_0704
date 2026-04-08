// convex/validators.ts
// Single source of truth for shared validators used across schema, queries, and actions
import { v } from "convex/values";

export const feedbackValidator = v.object({
  strengths_lv: v.string(),
  weaknesses_lv: v.string(),
  improvedPrompt_lv: v.string(),
  explanation_lv: v.string(),
  nextStep_lv: v.string(),
  score: v.optional(v.number()),
});

export const tokenUsageValidator = v.object({
  promptTokens: v.number(),
  completionTokens: v.number(),
  totalTokens: v.number(),
});

// Typed error codes — frontend can branch on errorCode without parsing Latvian strings
export type ErrorCode =
  | "SESSION_EXPIRED"
  | "SESSION_NOT_FOUND"
  | "ORG_NOT_FOUND"
  | "ORG_INVALID"
  | "RATE_LIMITED"
  | "TASK_NOT_FOUND"
  | "ALL_TASKS_COMPLETED"
  | "AI_ERROR";

export const errorCodeValidator = v.union(
  v.literal("SESSION_EXPIRED"),
  v.literal("SESSION_NOT_FOUND"),
  v.literal("ORG_NOT_FOUND"),
  v.literal("ORG_INVALID"),
  v.literal("RATE_LIMITED"),
  v.literal("TASK_NOT_FOUND"),
  v.literal("ALL_TASKS_COMPLETED"),
  v.literal("AI_ERROR"),
);

export const errorResponseValidator = v.object({
  error: v.string(),
  errorCode: errorCodeValidator,
});

export const taskFieldsValidator = v.object({
  _id: v.id("tasks"),
  slug: v.string(),
  title_lv: v.string(),
  instruction_lv: v.string(),
  context_lv: v.string(),
  expectedOutput: v.string(),
  level: v.number(),
  hints_lv: v.optional(v.string()),
  example_lv: v.optional(v.string()),
  teachingNote_lv: v.optional(v.string()),
});
