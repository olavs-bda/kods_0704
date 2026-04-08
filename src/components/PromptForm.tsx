// src/components/PromptForm.tsx
// Prompt textarea + submit button with loading/error states
import { type FormEvent } from "react";

interface PromptFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  error: string | null;
}

export default function PromptForm({
  prompt,
  onPromptChange,
  onSubmit,
  submitting,
  error,
}: PromptFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3"
    >
      <div>
        <label
          htmlFor="prompt"
          className="block text-sm font-medium text-gray-700"
        >
          Jūsu prompts
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={5}
          placeholder="Ierakstiet savu promptu šeit..."
          disabled={submitting}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
        />
        <div className="mt-1 text-right text-xs text-gray-400">
          {prompt.length} rakstzīmes
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !prompt.trim()}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Notiek analīze..." : "Iesniegt promptu"}
      </button>
    </form>
  );
}

export function SubmittingIndicator() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-6">
      <svg
        className="h-5 w-5 animate-spin text-blue-600"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p className="text-sm font-medium text-blue-700">
        AI analizē jūsu promptu...
      </p>
    </div>
  );
}
