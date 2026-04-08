// src/components/TaskWorkspace.tsx
// Main workspace: orchestrates task display, prompt input, feedback, progression
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
import TaskDisplay from "./TaskDisplay";
import PromptForm, { SubmittingIndicator } from "./PromptForm";

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

      <TaskDisplay task={task} />

      <PromptForm
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
      />

      {/* Loading State */}
      {submitting && <SubmittingIndicator />}

      {/* Feedback Display */}
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
