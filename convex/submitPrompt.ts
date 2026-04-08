// convex/submitPrompt.ts
"use node";

import { v } from "convex/values";
import type { Infer } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import OpenAI from "openai";
import {
  feedbackValidator,
  taskFieldsValidator,
  errorResponseValidator,
  type ErrorCode,
} from "./validators";
import {
  AI_MODEL_BY_LEVEL,
  AI_MODEL_FALLBACK,
  AI_TEMPERATURE,
  AI_TIMEOUT_MS,
  AI_MAX_RETRIES,
} from "./constants";

type Feedback = Infer<typeof feedbackValidator>;
type TaskFields = Infer<typeof taskFieldsValidator>;

// Structured Outputs JSON schema — guarantees the AI response matches this shape
const FEEDBACK_JSON_SCHEMA = {
  name: "prompt_feedback" as const,
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      strengths_lv: {
        type: "string" as const,
        description: "What the prompt does well (in Latvian)",
      },
      weaknesses_lv: {
        type: "string" as const,
        description: "What could be improved (in Latvian)",
      },
      improvedPrompt_lv: {
        type: "string" as const,
        description: "An improved version with concrete additions (in Latvian)",
      },
      explanation_lv: {
        type: "string" as const,
        description: "What was added or changed vs the original (in Latvian)",
      },
      nextStep_lv: {
        type: "string" as const,
        description:
          "One concrete next action for the participant (in Latvian)",
      },
      score: {
        type: "integer" as const,
        description: "Overall prompt quality score from 1 to 10",
        minimum: 1,
        maximum: 10,
      },
    },
    required: [
      "strengths_lv",
      "weaknesses_lv",
      "improvedPrompt_lv",
      "explanation_lv",
      "nextStep_lv",
      "score",
    ] as const,
    additionalProperties: false,
  },
};

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
    errorResponseValidator,
  ),
  handler: async (
    ctx,
    args,
  ): Promise<
    | { submissionId: Id<"submissions">; feedback: Feedback }
    | { error: string; errorCode: ErrorCode }
  > => {
    // Validate context and check rate limit
    const context:
      | {
          sessionId: Id<"sessions">;
          submissionCount: number;
          task: TaskFields;
          maxSubmissions: number;
        }
      | { error: string; errorCode: ErrorCode } = await ctx.runQuery(
      internal.submissions.getSubmissionContext,
      {
        sessionId: args.sessionId,
        taskId: args.taskId,
      },
    );

    if ("error" in context) {
      return { error: context.error, errorCode: context.errorCode };
    }

    const { task } = context;

    // 10.3 — Check for cached feedback on exact (taskId, prompt) match
    const cachedFeedback: Feedback | null = await ctx.runQuery(
      internal.submissions.getCachedFeedback,
      { taskId: args.taskId, prompt: args.prompt },
    );

    if (cachedFeedback) {
      const submissionId: Id<"submissions"> = await ctx.runMutation(
        internal.submissions.storeSubmission,
        {
          sessionId: args.sessionId,
          taskId: args.taskId,
          prompt: args.prompt,
          feedback: cachedFeedback,
        },
      );
      return { submissionId, feedback: cachedFeedback };
    }

    // 9.5 — Query previous prompts for comparative feedback
    const previousPrompts: string[] = await ctx.runQuery(
      internal.submissions.getPreviousPrompts,
      { sessionId: args.sessionId, taskId: args.taskId },
    );

    // Build prompts and call OpenAI
    const systemPrompt = buildSystemPrompt(task.level);
    const userPrompt = buildUserPrompt(args.prompt, task, previousPrompts);
    const model = AI_MODEL_BY_LEVEL[task.level] ?? AI_MODEL_FALLBACK;

    const openai = new OpenAI({
      timeout: AI_TIMEOUT_MS,
      maxRetries: AI_MAX_RETRIES,
    });
    let feedback: Feedback;
    let tokenUsage:
      | { promptTokens: number; completionTokens: number; totalTokens: number }
      | undefined;
    try {
      const response = await openai.chat.completions.create({
        model,
        temperature: AI_TEMPERATURE,
        response_format: {
          type: "json_schema",
          json_schema: FEEDBACK_JSON_SCHEMA,
        },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      // 9.7 — Extract token usage
      if (response.usage) {
        tokenUsage = {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        };
      }

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error("OpenAI returned empty content");
        return {
          error: "AI neatbildēja. Lūdzu, mēģiniet vēlreiz.",
          errorCode: "AI_ERROR",
        };
      }

      const parsed = parseFeedback(content);
      if (!parsed) {
        console.error("OpenAI returned malformed feedback:", content);
        return {
          error: "AI atbilde nav derīga. Lūdzu, mēģiniet vēlreiz.",
          errorCode: "AI_ERROR",
        };
      }
      feedback = parsed;
    } catch (err: unknown) {
      console.error("OpenAI call failed:", err);
      return { error: classifyOpenAIError(err), errorCode: "AI_ERROR" };
    }

    // Store submission and increment count
    const submissionId: Id<"submissions"> = await ctx.runMutation(
      internal.submissions.storeSubmission,
      {
        sessionId: args.sessionId,
        taskId: args.taskId,
        prompt: args.prompt,
        feedback,
        tokenUsage,
      },
    );

    return { submissionId, feedback };
  },
});

// 5.2 — System prompt template with level-specific rubric criteria
export function buildSystemPrompt(level: number): string {
  const levelCriteria: Record<number, string> = {
    1: `## Evaluation Criteria — Level 1 (Beginner)
1. INSTRUCTION CLARITY (T1) — Clear action verb? ("Apkopo", "Uzraksti", "Sagatavo")
2. SPECIFICITY (T2) — Concrete numbers or terms instead of vague words? ("kaut ko", "dažus")
3. OUTPUT CONSTRAINTS (T3) — Specified length, format, or structure? ("3 teikumos", "sarakstā")
4. AUDIENCE / CONTEXT (T4) — Mentioned who reads the output or the domain?
5. LANGUAGE — Written in Latvian?

## Tone
Be VERY encouraging — this is a beginner. Celebrate what they got right first.
- In weaknesses_lv, name only ONE specific gap from the 5 criteria above. Never add requirements from Level 2 or 3.
- The improved prompt should be only slightly better — add one missing element (word count, format, audience, or extra detail). NOT a Level 3 rewrite.
- If the prompt already covers all 5 criteria above, score 8+ and suggest a minor polish.
- Next step: one small, concrete action they can try immediately.`,

    2: `## Evaluation Criteria — Level 2 (Intermediate)
Level 1 fundamentals (clear verb, constraints, Latvian, audience, specificity) PLUS:
6. STRUCTURED OUTPUT FORMAT (T7) — Defined output structure? (table, numbered list, sections with headers)
7. DELIMITERS (T8) — Separated instructions from input data? (---, \`\`\`, ===)
8. EDGE CASE HANDLING (T12) — Addressed missing data or ambiguity? ("Ja dati nav pieejami, raksti 'Nav norādīts'")
9. PERSPECTIVE (T13) — Specified viewpoint or audience? ("no ... perspektīvas", "priekš ...")
10. TASK DECOMPOSITION (T10) — Broke complex requests into sub-parts?

## Tone
Balanced — acknowledge Level 1 skills already demonstrated.
- Focus criticism on format specification and context-setting.
- The improved prompt should demonstrate structured thinking.
- Introduce the "input-output contract" concept — telling the AI exactly what it receives and what it should produce.`,

    3: `## Evaluation Criteria — Level 3 (Advanced)
Level 1+2 criteria PLUS:
11. ROLE ASSIGNMENT (T14) — Assigned an expert role? ("Tu esi..." with domain expertise)
12. MULTI-STEP REASONING (T15, T16) — Sequenced analysis into numbered steps with logical flow?
13. JUSTIFICATION (T15) — Required reasoning for conclusions? ("pamatojums", "kāpēc")
14. QUALITY CRITERIA (T17) — Defined what "good" output looks like?
15. OUTPUT OPTIMISATION (T20) — Set explicit constraints on length, depth, and style?

## Tone
Rigorous — high standards. Point out subtle issues: role specificity, logical step order, measurable criteria.
- Improved prompt should demonstrate sophisticated prompt engineering.
- Next step should introduce a new technique: prompt chaining, few-shot examples, or meta-prompting.`,
  };

  const criteria = levelCriteria[level] ?? levelCriteria[1];

  return `# Rules (apply in order)
1. ALL feedback text MUST be in Latvian.
2. FIRST check: does the participant's prompt address the assigned task? If off-topic → score 1–2, state this in weaknesses_lv, and improvedPrompt_lv MUST redirect to the actual task.
3. Evaluate ONLY against the criteria listed for this level. Do NOT penalize for missing techniques from higher levels. If the prompt covers all this level's fundamentals, that is excellent work.
4. Do NOT invent names, system names, or details absent from the task context.
5. When citing a strength, quote the specific words from the participant's prompt.
6. When citing a weakness, confirm the issue is genuinely absent from the participant's text — do NOT claim something is missing if the participant already included it.
7. weaknesses_lv: identify only the SINGLE most important gap for this level. Do not list multiple weaknesses.
8. improvedPrompt_lv MUST add exactly one concrete new element not in the original. Never return a rephrased copy.
9. In explanation_lv, name what was ADDED or CHANGED vs the original.
10. Keep each field concise (2–4 sentences).
11. Before responding: re-read the participant's prompt and verify the weakness is real and not already addressed.

# Identity
Expert prompt engineering coach for Latvian public sector employees. Evaluate user-written prompts and provide structured feedback in Latvian.

${criteria}

## Scoring Guide (score against THIS level's criteria only)
- 1–2: Off-topic or unrelated to the assigned task
- 3: Wrong topic, or barely relates
- 4–5: On-topic but missing most of this level's criteria
- 6–7: Covers some criteria, clear room for improvement
- 8–9: Covers most or all of this level's criteria well
- 10: Covers all criteria with strong execution`;
}

// 5.2 — User prompt template with optional comparative context
export function buildUserPrompt(
  userPrompt: string,
  task: TaskFields,
  previousPrompts?: string[],
): string {
  let prompt = `Evaluate the following prompt written by a workshop participant.

## Task Information
- Task title: ${task.title_lv}
- Task instruction: ${task.instruction_lv}
- Task context: ${task.context_lv}
- Expected output type: ${task.expectedOutput}
- Difficulty level: ${task.level}
`;

  // Include teaching focus so the AI knows what technique this task targets
  if (task.teachingNote_lv) {
    prompt += `
## Teaching Focus for This Task
${task.teachingNote_lv}
`;
  }

  // Include gold-standard example so the AI has a concrete reference
  if (task.example_lv) {
    prompt += `
## Reference Example (what a strong prompt for this task looks like)
"""
${task.example_lv}
"""
`;
  }

  if (previousPrompts && previousPrompts.length > 0) {
    previousPrompts.forEach((prev, i) => {
      prompt += `
## Participant's Previous Prompt (attempt #${i + 1})
"""
${prev}
"""
`;
    });
    prompt += `
## Participant's Current Prompt (attempt #${previousPrompts.length + 1})
"""
${userPrompt}
"""

Compare with previous attempt(s): acknowledge improvements, note any regressions, and suggest the next refinement.
All text must be in Latvian.`;
  } else {
    prompt += `
## Participant's Prompt
"""
${userPrompt}
"""

All text must be in Latvian.`;
  }

  return prompt;
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

    const feedback: Feedback = {
      strengths_lv: parsed.strengths_lv,
      weaknesses_lv: parsed.weaknesses_lv,
      improvedPrompt_lv: parsed.improvedPrompt_lv,
      explanation_lv: parsed.explanation_lv,
      nextStep_lv: parsed.nextStep_lv,
    };

    // Optional score (1–10)
    if (
      typeof parsed.score === "number" &&
      parsed.score >= 1 &&
      parsed.score <= 10
    ) {
      feedback.score = Math.round(parsed.score);
    }

    return feedback;
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
