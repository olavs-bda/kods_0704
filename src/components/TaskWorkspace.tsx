// src/components/TaskWorkspace.tsx
// Main workspace: task display, prompt input, feedback, progression, history
import { useState, useEffect, type FormEvent } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  loadSession,
  loadParticipantCode,
  clearSession,
} from "../lib/sessionStore";
import FeedbackDisplay from "./FeedbackDisplay";
import SubmissionHistory from "./SubmissionHistory";
import TaskStepper from "./TaskStepper";

interface Feedback {
  strengths_lv: string;
  weaknesses_lv: string;
  improvedPrompt_lv: string;
  explanation_lv: string;
  nextStep_lv: string;
}

export default function TaskWorkspace() {
  const [sessionId, setSessionId] = useState<Id<"sessions"> | null>(null);

  useEffect(() => {
    const id = loadSession();
    if (!id) {
      window.location.href = "/";
      return;
    }
    setSessionId(id);
  }, []);

  if (!sessionId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Notiek ielāde...</p>
      </div>
    );
  }

  return <TaskView sessionId={sessionId} />;
}

function TaskView({ sessionId }: { sessionId: Id<"sessions"> }) {
  const taskData = useQuery(api.tasks.getCurrentTask, { sessionId });
  const submitPrompt = useAction(api.submitPrompt.submitPrompt);
  const advanceTask = useMutation(api.tasks.advanceTask);
  const participantCode = loadParticipantCode();

  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestFeedback, setLatestFeedback] = useState<Feedback | null>(null);
  const [advancing, setAdvancing] = useState(false);

  // Reset prompt and feedback when task changes
  useEffect(() => {
    if (taskData && !("error" in taskData)) {
      setPrompt("");
      setLatestFeedback(null);
      setError(null);
    }
  }, [taskData && !("error" in taskData) ? taskData.taskIndex : null]);

  if (!taskData) {
    return <LoadingSkeleton />;
  }

  if ("error" in taskData) {
    return <SessionError message={taskData.error ?? "Nezināma kļūda."} />;
  }

  const { task, taskIndex, totalTasks, isCompleted } = taskData;

  if (isCompleted) {
    return <CompletionScreen totalTasks={totalTasks} />;
  }

  const levelLabels: Record<number, string> = {
    1: "Pamata",
    2: "Vidējs",
    3: "Augsts",
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!prompt.trim()) {
      setError("Lūdzu, ievadiet promptu.");
      return;
    }

    setSubmitting(true);
    setLatestFeedback(null);

    try {
      const result = await submitPrompt({
        sessionId,
        taskId: task._id,
        prompt: prompt.trim(),
      });

      if ("error" in result) {
        setError(result.error ?? "Nezināma kļūda.");
      } else {
        setLatestFeedback(result.feedback);
      }
    } catch {
      setError("Radās kļūda. Lūdzu, mēģiniet vēlreiz.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdvance() {
    setAdvancing(true);
    try {
      const result = await advanceTask({ sessionId });
      if ("error" in result) {
        setError(result.error ?? "Nezināma kļūda.");
      }
    } catch {
      setError("Neizdevās pāriet uz nākamo uzdevumu.");
    } finally {
      setAdvancing(false);
    }
  }

  function handleLogout() {
    clearSession();
    window.location.href = "/";
  }

  return (
    <div className="space-y-6">
      {/* Task Stepper */}
      <TaskStepper
        sessionId={sessionId}
        currentIndex={taskIndex}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {taskIndex + 1}/{totalTasks}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Līmenis: {levelLabels[task.level] ?? task.level}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {participantCode && (
            <span className="text-xs text-gray-500">
              Veiksmīgu uzvedņošanu,{" "}
              <span className="font-semibold text-gray-700">
                {participantCode}
              </span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Iziet
          </button>
        </div>
      </div>

      {/* Task Display (7.1) */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">{task.title_lv}</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          {task.instruction_lv}
        </p>

        {task.context_lv && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Konteksts
            </p>
            <p className="mt-1 text-sm text-gray-700">{task.context_lv}</p>
          </div>
        )}

        {task.hints_lv && (
          <details className="mt-3 rounded-lg bg-amber-50">
            <summary className="cursor-pointer select-none p-4 text-xs font-semibold uppercase tracking-wide text-amber-600 hover:text-amber-700">
              Padoms (klikšķiniet, lai atklātu)
            </summary>
            <p className="px-4 pb-4 text-sm text-amber-800">{task.hints_lv}</p>
          </details>
        )}
      </div>

      {/* Prompt Input (7.2) */}
      <form
        onSubmit={handleSubmit}
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
            onChange={(e) => setPrompt(e.target.value)}
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

      {/* Loading State (7.4) */}
      {submitting && <SubmittingIndicator />}

      {/* Feedback Display (7.3) */}
      {latestFeedback && <FeedbackDisplay feedback={latestFeedback} />}

      {/* Next Task Button (7.5) */}
      {latestFeedback && (
        <button
          onClick={handleAdvance}
          disabled={advancing}
          className="w-full rounded-lg border-2 border-blue-600 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          {advancing ?
            "Notiek pāreja..."
          : taskIndex + 1 < totalTasks ?
            "Nākamais uzdevums →"
          : "Pabeigt darbnīcu →"}
        </button>
      )}

      {/* Submission History (7.6) */}
      <SubmissionHistory
        sessionId={sessionId}
        taskId={task._id}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex gap-3">
        <div className="h-7 w-16 rounded-full bg-gray-200" />
        <div className="h-7 w-24 rounded-full bg-gray-200" />
      </div>
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-6 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
      </div>
      <div className="h-32 rounded-lg bg-gray-200" />
    </div>
  );
}

function SubmittingIndicator() {
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

function SessionError({ message }: { message: string }) {
  function handleReturn() {
    clearSession();
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-center">
        <p className="text-sm font-medium text-red-700">{message}</p>
      </div>
      <button
        onClick={handleReturn}
        className="text-sm text-blue-600 hover:underline"
      >
        Atgriezties uz sākumlapu
      </button>
    </div>
  );
}

function CompletionScreen({ totalTasks }: { totalTasks: number }) {
  function handleReturn() {
    clearSession();
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="rounded-full bg-green-100 p-4">
        <svg
          className="h-12 w-12 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Apsveicam! Darbnīca pabeigta!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Jūs esat veiksmīgi izpildījis visus {totalTasks} uzdevumus.
        </p>
      </div>
      <button
        onClick={handleReturn}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        Atgriezties uz sākumlapu
      </button>
    </div>
  );
}
