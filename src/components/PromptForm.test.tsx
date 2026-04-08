// src/components/PromptForm.test.tsx
// Unit tests for the PromptForm component
// @vitest-environment jsdom
import { describe, test, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { type FormEvent } from "react";
import PromptForm from "./PromptForm";

// Stub gpt-tokenizer to avoid loading the full tokenizer in tests
vi.mock("gpt-tokenizer/model/gpt-4o", () => ({
  countTokens: () => 10,
  estimateCost: () => ({ main: { input: 0.001 } }),
}));

import { afterEach } from "vitest";
afterEach(() => cleanup());

function renderForm(overrides: Partial<Parameters<typeof PromptForm>[0]> = {}) {
  const defaults = {
    prompt: "",
    onPromptChange: vi.fn(),
    onSubmit: vi.fn((e: FormEvent) => e.preventDefault()),
    submitting: false,
    error: null,
  };
  return {
    ...render(
      <PromptForm
        {...defaults}
        {...overrides}
      />,
    ),
    ...defaults,
  };
}

describe("PromptForm", () => {
  test("renders textarea and submit button", () => {
    renderForm();
    expect(screen.getByLabelText(/uzvedne/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iesniegt/i }),
    ).toBeInTheDocument();
  });

  test("disables submit button when prompt is empty", () => {
    renderForm({ prompt: "" });
    expect(screen.getByRole("button", { name: /iesniegt/i })).toBeDisabled();
  });

  test("enables submit button when prompt has content", () => {
    renderForm({ prompt: "Kāds ir AI?" });
    expect(screen.getByRole("button", { name: /iesniegt/i })).toBeEnabled();
  });

  test("disables textarea and button while submitting", () => {
    renderForm({ prompt: "test", submitting: true });
    expect(screen.getByLabelText(/uzvedne/i)).toBeDisabled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("shows button text change while submitting", () => {
    renderForm({ prompt: "test", submitting: true });
    expect(screen.getByRole("button")).toHaveTextContent(/analīze/i);
  });

  test("displays error message when error prop is set", () => {
    renderForm({ error: "Sesija ir beigusies." });
    expect(screen.getByRole("alert")).toHaveTextContent("Sesija ir beigusies.");
  });

  test("does not display error alert when error is null", () => {
    renderForm({ error: null });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("calls onPromptChange when typing", () => {
    const { onPromptChange } = renderForm();
    fireEvent.change(screen.getByLabelText(/uzvedne/i), {
      target: { value: "Hello" },
    });
    expect(onPromptChange).toHaveBeenCalledWith("Hello");
  });

  test("calls onSubmit when form is submitted", () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    renderForm({ prompt: "test prompt", onSubmit });
    fireEvent.click(screen.getByRole("button", { name: /iesniegt/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  test("shows character count", () => {
    renderForm({ prompt: "Hello" });
    expect(screen.getByText("5 rakstzīmes")).toBeInTheDocument();
  });
});
