// convex/validators.ts
// Single source of truth for shared validators used across schema, queries, and actions
import { v } from "convex/values";

export const feedbackValidator = v.object({
  strengths_lv: v.string(),
  weaknesses_lv: v.string(),
  improvedPrompt_lv: v.string(),
  explanation_lv: v.string(),
  nextStep_lv: v.string(),
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
});
