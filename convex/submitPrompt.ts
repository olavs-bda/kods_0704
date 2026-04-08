// convex/submitPrompt.ts
"use node";

import { v } from "convex/values";
import type { Infer } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import OpenAI from "openai";
import { feedbackValidator, taskFieldsValidator } from "./validators";
import {
  AI_MODEL,
  AI_TEMPERATURE,
  AI_TIMEOUT_MS,
  AI_MAX_RETRIES,
} from "./constants";

type Feedback = Infer<typeof feedbackValidator>;
type TaskFields = Infer<typeof taskFieldsValidator>;

// 5.1–5.3 — Submit prompt: validate → call OpenAI → parse response → store
export const submitPrompt = action({
  args: {
    sessionId: v.id("sessions"),
    taskId: v.id("tasks"),
    prompt: v.string(),
  },
  returns: v.union(
    v.object({
      submissionId: v.id("submissions"),
      feedback: feedbackValidator,
    }),
    v.object({ error: v.string() }),
  ),
  handler: async (
    ctx,
    args,
  ): Promise<
    { submissionId: Id<"submissions">; feedback: Feedback } | { error: string }
  > => {
    // Validate context and check rate limit
    const context:
      | {
          sessionId: Id<"sessions">;
          submissionCount: number;
          task: TaskFields;
          maxSubmissions: number;
        }
      | { error: string } = await ctx.runQuery(
      internal.submissions.getSubmissionContext,
      {
        sessionId: args.sessionId,
        taskId: args.taskId,
      },
    );

    if ("error" in context) {
      return { error: context.error };
    }

    const { task } = context;

    // Build prompts and call OpenAI
    const systemPrompt = buildSystemPrompt(task.level);
    const userPrompt = buildUserPrompt(args.prompt, task);

    const openai = new OpenAI({
      timeout: AI_TIMEOUT_MS,
      maxRetries: AI_MAX_RETRIES,
    });
    let feedback: Feedback;
    try {
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        temperature: AI_TEMPERATURE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error("OpenAI returned empty content");
        return { error: "AI neatbildēja. Lūdzu, mēģiniet vēlreiz." };
      }

      const parsed = parseFeedback(content);
      if (!parsed) {
        console.error("OpenAI returned malformed feedback:", content);
        return { error: "AI atbilde nav derīga. Lūdzu, mēģiniet vēlreiz." };
      }
      feedback = parsed;
    } catch (err: unknown) {
      console.error("OpenAI call failed:", err);
      return { error: classifyOpenAIError(err) };
    }

    // Store submission and increment count
    const submissionId: Id<"submissions"> = await ctx.runMutation(
      internal.submissions.storeSubmission,
      {
        sessionId: args.sessionId,
        taskId: args.taskId,
        prompt: args.prompt,
        feedback,
      },
    );

    return { submissionId, feedback };
  },
});

// 5.2 — System prompt template
export function buildSystemPrompt(level: number): string {
  const levelDescriptions: Record<number, string> = {
    1: "Basic level — the participant is a beginner. Provide encouraging, detailed feedback. Focus on fundamental prompt structure: clarity, specificity, and completeness.",
    2: "Intermediate level — the participant has some experience. Provide balanced feedback. Focus on context-setting, output format specification, and constraint definition.",
    3: "Advanced level — the participant should demonstrate sophisticated techniques. Provide rigorous feedback. Focus on role assignment, multi-step reasoning, edge case handling, and output optimization.",
  };

  return `You are an expert prompt engineering coach for Latvian public sector employees.
Your role is to evaluate user-written prompts and provide structured feedback entirely in Latvian.

Difficulty level: ${levelDescriptions[level] ?? levelDescriptions[1]}

IMPORTANT RULES:
- ALL feedback text MUST be written in Latvian.
- Be constructive and specific — reference parts of the user's prompt directly.
- The improved prompt you suggest must also be in Latvian.
- Keep each feedback field concise (2–4 sentences).

You MUST respond with a valid JSON object with exactly these fields:
{
  "strengths_lv": "What the prompt does well (in Latvian)",
  "weaknesses_lv": "What could be improved (in Latvian)",
  "improvedPrompt_lv": "A better version of the prompt (in Latvian)",
  "explanation_lv": "Why the improved version is better (in Latvian)",
  "nextStep_lv": "One concrete next step for the participant to practice (in Latvian)"
}`;
}

// 5.2 — User prompt template
export function buildUserPrompt(userPrompt: string, task: TaskFields): string {
  return `Evaluate the following prompt written by a workshop participant.

TASK INFORMATION:
- Task title: ${task.title_lv}
- Task instruction: ${task.instruction_lv}
- Task context: ${task.context_lv}
- Expected output type: ${task.expectedOutput}
- Difficulty level: ${task.level}

PARTICIPANT'S PROMPT:
"""
${userPrompt}
"""

Provide your evaluation as a JSON object with the required fields. All text must be in Latvian.`;
}

// 5.3 — Parse and validate AI response
export function parseFeedback(content: string): Feedback | null {
  try {
    const parsed = JSON.parse(content);
    const requiredFields = [
      "strengths_lv",
      "weaknesses_lv",
      "improvedPrompt_lv",
      "explanation_lv",
      "nextStep_lv",
    ] as const;

    for (const field of requiredFields) {
      if (typeof parsed[field] !== "string" || parsed[field].trim() === "") {
        return null;
      }
    }

    return {
      strengths_lv: parsed.strengths_lv,
      weaknesses_lv: parsed.weaknesses_lv,
      improvedPrompt_lv: parsed.improvedPrompt_lv,
      explanation_lv: parsed.explanation_lv,
      nextStep_lv: parsed.nextStep_lv,
    };
  } catch {
    return null;
  }
}

// 8.4 — Classify OpenAI errors into user-friendly Latvian messages
export function classifyOpenAIError(err: unknown): string {
  if (err instanceof OpenAI.APIConnectionError) {
    return "Neizdevās savienoties ar AI serveri. Lūdzu, mēģiniet vēlreiz.";
  }
  if (err instanceof OpenAI.RateLimitError) {
    return "AI serveris ir pārslogots. Lūdzu, uzgaidiet un mēģiniet vēlreiz.";
  }
  if (err instanceof OpenAI.AuthenticationError) {
    return "AI konfigurācijas kļūda. Lūdzu, sazinieties ar organizatoru.";
  }
  if (err instanceof OpenAI.APIError) {
    if (err.status && err.status >= 500) {
      return "AI serveris īslaicīgi nav pieejams. Lūdzu, mēģiniet vēlreiz.";
    }
    return "Kļūda sazinoties ar AI. Lūdzu, mēģiniet vēlreiz.";
  }
  // Timeout or generic network error
  if (err instanceof Error && err.message.toLowerCase().includes("timeout")) {
    return "AI atbilde aizkavējās. Lūdzu, mēģiniet vēlreiz.";
  }
  return "Kļūda sazinoties ar AI. Lūdzu, mēģiniet vēlreiz.";
}
