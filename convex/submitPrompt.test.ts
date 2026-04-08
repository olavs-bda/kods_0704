// convex/submitPrompt.test.ts
import { expect, test, describe } from "vitest";
import {
  parseFeedback,
  buildSystemPrompt,
  buildUserPrompt,
  classifyOpenAIError,
} from "./submitPrompt";

import type { Id } from "../../convex/_generated/dataModel";

const sampleTask = {
  _id: "tasks:abc123" as Id<"tasks">,
  slug: "test-task",
  title_lv: "Testa uzdevums",
  instruction_lv: "Uzrakstiet uzvedni",
  context_lv: "Kāds konteksts",
  expectedOutput: "Kopsavilkums",
  level: 1,
};

describe("parseFeedback", () => {
  test("returns feedback object for valid JSON", () => {
    const valid = JSON.stringify({
      strengths_lv: "Stiprā puse",
      weaknesses_lv: "Vājā puse",
      improvedPrompt_lv: "Labāka uzvedne",
      explanation_lv: "Skaidrojums",
      nextStep_lv: "Nākamais solis",
    });
    const result = parseFeedback(valid);
    expect(result).not.toBeNull();
    expect(result?.strengths_lv).toBe("Stiprā puse");
    expect(result?.weaknesses_lv).toBe("Vājā puse");
    expect(result?.improvedPrompt_lv).toBe("Labāka uzvedne");
    expect(result?.explanation_lv).toBe("Skaidrojums");
    expect(result?.nextStep_lv).toBe("Nākamais solis");
  });

  test("returns null for invalid JSON", () => {
    const result = parseFeedback("not-json{{{");
    expect(result).toBeNull();
  });

  test("returns null when a required field is missing", () => {
    const missing = JSON.stringify({
      strengths_lv: "OK",
      weaknesses_lv: "Not great",
      improvedPrompt_lv: "Better",
      explanation_lv: "Why",
      // nextStep_lv missing
    });
    const result = parseFeedback(missing);
    expect(result).toBeNull();
  });

  test("returns null when a field is empty string", () => {
    const empty = JSON.stringify({
      strengths_lv: "OK",
      weaknesses_lv: "Not great",
      improvedPrompt_lv: "Better",
      explanation_lv: "Why",
      nextStep_lv: "   ", // whitespace only
    });
    const result = parseFeedback(empty);
    expect(result).toBeNull();
  });

  test("returns null when a field is not a string", () => {
    const nonString = JSON.stringify({
      strengths_lv: 42,
      weaknesses_lv: "Not great",
      improvedPrompt_lv: "Better",
      explanation_lv: "Why",
      nextStep_lv: "Next",
    });
    const result = parseFeedback(nonString);
    expect(result).toBeNull();
  });

  test("returns null for empty string input", () => {
    const result = parseFeedback("");
    expect(result).toBeNull();
  });

  test("includes score when valid (1–10)", () => {
    const withScore = JSON.stringify({
      strengths_lv: "Stiprā puse",
      weaknesses_lv: "Vājā puse",
      improvedPrompt_lv: "Labāka uzvedne",
      explanation_lv: "Skaidrojums",
      nextStep_lv: "Nākamais solis",
      score: 7,
    });
    const result = parseFeedback(withScore);
    expect(result).not.toBeNull();
    expect(result?.score).toBe(7);
  });

  test("omits score when out of range", () => {
    const outOfRange = JSON.stringify({
      strengths_lv: "Stiprā puse",
      weaknesses_lv: "Vājā puse",
      improvedPrompt_lv: "Labāka uzvedne",
      explanation_lv: "Skaidrojums",
      nextStep_lv: "Nākamais solis",
      score: 15,
    });
    const result = parseFeedback(outOfRange);
    expect(result).not.toBeNull();
    expect(result?.score).toBeUndefined();
  });

  test("rounds float score to integer", () => {
    const floatScore = JSON.stringify({
      strengths_lv: "Stiprā puse",
      weaknesses_lv: "Vājā puse",
      improvedPrompt_lv: "Labāka uzvedne",
      explanation_lv: "Skaidrojums",
      nextStep_lv: "Nākamais solis",
      score: 6.7,
    });
    const result = parseFeedback(floatScore);
    expect(result?.score).toBe(7);
  });

  test("omits score when not a number", () => {
    const nonNumber = JSON.stringify({
      strengths_lv: "Stiprā puse",
      weaknesses_lv: "Vājā puse",
      improvedPrompt_lv: "Labāka uzvedne",
      explanation_lv: "Skaidrojums",
      nextStep_lv: "Nākamais solis",
      score: "high",
    });
    const result = parseFeedback(nonNumber);
    expect(result).not.toBeNull();
    expect(result?.score).toBeUndefined();
  });
});

describe("buildSystemPrompt", () => {
  test("includes level 1 rubric criteria for beginner", () => {
    const prompt = buildSystemPrompt(1);
    expect(prompt).toContain("Beginner");
    expect(prompt).toContain("INSTRUCTION CLARITY");
    expect(prompt).toContain("Latvian");
  });

  test("includes level 2 rubric criteria for intermediate", () => {
    const prompt = buildSystemPrompt(2);
    expect(prompt).toContain("Intermediate");
    expect(prompt).toContain("STRUCTURED OUTPUT FORMAT");
    expect(prompt).toContain("DELIMITERS");
  });

  test("includes level 3 rubric criteria for advanced", () => {
    const prompt = buildSystemPrompt(3);
    expect(prompt).toContain("Advanced");
    expect(prompt).toContain("ROLE ASSIGNMENT");
    expect(prompt).toContain("MULTI-STEP REASONING");
  });

  test("falls back to level 1 for unknown level", () => {
    const prompt = buildSystemPrompt(99);
    // Should fall back to level 1 criteria
    expect(prompt).toContain("Beginner");
  });

  test("includes verification rule", () => {
    const prompt = buildSystemPrompt(1);
    expect(prompt).toContain("re-read the participant");
  });

  test("includes scoring guide", () => {
    const prompt = buildSystemPrompt(1);
    expect(prompt).toContain("Scoring Guide");
    expect(prompt).toContain("Off-topic");
  });

  test("includes task relevance check in rules", () => {
    const prompt = buildSystemPrompt(1);
    expect(prompt).toContain("off-topic");
    expect(prompt).toContain("Off-topic");
  });
});

describe("buildUserPrompt", () => {
  test("includes task information in the prompt", () => {
    const prompt = buildUserPrompt("My user prompt", sampleTask);
    expect(prompt).toContain("Testa uzdevums");
    expect(prompt).toContain("Uzrakstiet uzvedni");
    expect(prompt).toContain("Kāds konteksts");
    expect(prompt).toContain("Kopsavilkums");
  });

  test("includes the user's prompt text", () => {
    const prompt = buildUserPrompt("Tell me something", sampleTask);
    expect(prompt).toContain("Tell me something");
  });

  test("includes difficulty level", () => {
    const prompt = buildUserPrompt("Any prompt", sampleTask);
    expect(prompt).toContain("1"); // level 1
  });

  test("formats prompt with task hints if present", () => {
    const taskWithHints = { ...sampleTask, hints_lv: "Hints here", level: 2 };
    const prompt = buildUserPrompt("My prompt", taskWithHints);
    expect(prompt).toContain("My prompt");
    expect(prompt).toContain("2"); // level 2
  });

  test("includes previous prompts for comparative feedback", () => {
    const previousPrompts = ["First attempt", "Second attempt"];
    const prompt = buildUserPrompt(
      "Third attempt",
      sampleTask,
      previousPrompts,
    );
    expect(prompt).toContain("Previous Prompt (attempt #1)");
    expect(prompt).toContain("First attempt");
    expect(prompt).toContain("Previous Prompt (attempt #2)");
    expect(prompt).toContain("Second attempt");
    expect(prompt).toContain("Current Prompt (attempt #3)");
    expect(prompt).toContain("Third attempt");
    expect(prompt).toContain("Compare");
  });

  test("omits comparative context when no previous prompts", () => {
    const prompt = buildUserPrompt("First try", sampleTask, []);
    expect(prompt).not.toContain("Previous Prompt");
    expect(prompt).not.toContain("Compare");
    expect(prompt).toContain("First try");
  });

  test("includes teachingNote_lv when present in task", () => {
    const taskWithNote = {
      ...sampleTask,
      teachingNote_lv:
        "Skaidra instrukcija (T1): laba uzvedne sākas ar darbības vārdu.",
    };
    const prompt = buildUserPrompt("My prompt", taskWithNote);
    expect(prompt).toContain("Teaching Focus");
    expect(prompt).toContain("Skaidra instrukcija");
  });

  test("includes example_lv when present in task", () => {
    const taskWithExample = {
      ...sampleTask,
      example_lv: "Apkopo šo tekstu 3 īsos teikumos.",
    };
    const prompt = buildUserPrompt("My prompt", taskWithExample);
    expect(prompt).toContain("Reference Example");
    expect(prompt).toContain("Apkopo šo tekstu 3 īsos teikumos.");
  });
});

describe("8.4 — classifyOpenAIError", () => {
  test("returns connection error message for APIConnectionError", () => {
    // Simulate the error shape
    const err = new Error("Connection refused");
    Object.defineProperty(err, "constructor", {
      value: { name: "APIConnectionError" },
    });
    // Direct test with a generic Error that includes "timeout"
    const result = classifyOpenAIError(err);
    expect(result).toContain("Lūdzu");
  });

  test("returns timeout message for timeout errors", () => {
    const err = new Error("Request timeout exceeded");
    const result = classifyOpenAIError(err);
    expect(result).toBe("AI atbilde aizkavējās. Lūdzu, mēģiniet vēlreiz.");
  });

  test("returns generic Latvian error for unknown errors", () => {
    const result = classifyOpenAIError(new Error("something weird"));
    expect(result).toBe("Kļūda sazinoties ar AI. Lūdzu, mēģiniet vēlreiz.");
  });

  test("returns generic Latvian error for non-Error values", () => {
    const result = classifyOpenAIError("string error");
    expect(result).toBe("Kļūda sazinoties ar AI. Lūdzu, mēģiniet vēlreiz.");
  });

  test("error messages are in Latvian", () => {
    const result = classifyOpenAIError(null);
    expect(result).not.toContain("Error");
    expect(result).toMatch(/^[A-ZĀ-Ž]/); // starts with uppercase Latvian
    expect(result).toMatch(/\.$/); // ends with period
  });
});
