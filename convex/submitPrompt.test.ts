// convex/submitPrompt.test.ts
import { expect, test, describe } from "vitest";
import { parseFeedback, buildSystemPrompt, buildUserPrompt } from "./submitPrompt";

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
});

describe("buildSystemPrompt", () => {
  test("includes level 1 description for beginner", () => {
    const prompt = buildSystemPrompt(1);
    expect(prompt).toContain("beginner");
    expect(prompt).toContain("Latvian");
  });

  test("includes level 2 description for intermediate", () => {
    const prompt = buildSystemPrompt(2);
    expect(prompt).toContain("Intermediate");
  });

  test("includes level 3 description for advanced", () => {
    const prompt = buildSystemPrompt(3);
    expect(prompt).toContain("Advanced");
  });

  test("falls back to level 1 for unknown level", () => {
    const prompt = buildSystemPrompt(99);
    // Should fall back to level 1 description
    expect(prompt).toContain("beginner");
  });

  test("returns valid JSON instruction in prompt", () => {
    const prompt = buildSystemPrompt(1);
    expect(prompt).toContain("strengths_lv");
    expect(prompt).toContain("weaknesses_lv");
    expect(prompt).toContain("improvedPrompt_lv");
    expect(prompt).toContain("explanation_lv");
    expect(prompt).toContain("nextStep_lv");
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
});
