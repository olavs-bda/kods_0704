// src/components/TaskWorkspace.tsx
// Main workspace: orchestrates task display, prompt input, feedback, progression
import { useState, useEffect, type FormEvent } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { SESSION_EXPIRED_ERROR } from "../../convex/constants";
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
import HelpOverlay from "./HelpOverlay";

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

  // 8.2 — Auto-redirect when session expiry is detected mid-task
  useEffect(() => {
    if (
      taskData &&
      "error" in taskData &&
      taskData.error === SESSION_EXPIRED_ERROR
    ) {
      clearSession();
      // replace() prevents the user navigating back into the expired session
      window.location.replace("/");
    }
  }, [taskData]);

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
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-on-primary-container">
            {taskIndex + 1}/{totalTasks}
          </span>
          <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-on-surface-variant">
            {levelLabels[task.level] ?? task.level}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {participantCode && (
            <span className="text-xs text-on-surface-variant">
              Sveiks,{" "}
              <span className="font-semibold text-on-surface">
                {participantCode}
              </span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-outline hover:text-on-surface transition-colors"
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
          className="w-full rounded-full bg-surface-container-highest px-4 py-3 text-sm font-semibold text-primary hover:bg-primary hover:text-on-primary shadow-[0_4px_16px_rgba(12,95,174,0.1)] hover:shadow-[0_4px_16px_rgba(12,95,174,0.25)] focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 transition-all"
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
        <div className="h-7 w-16 rounded-full bg-surface-container-high" />
        <div className="h-7 w-24 rounded-full bg-surface-container-high" />
      </div>
      <div className="space-y-3 rounded-2xl bg-surface-container-lowest p-6">
        <div className="h-6 w-3/4 rounded-lg bg-surface-container-high" />
        <div className="h-4 w-full rounded-lg bg-surface-container-high" />
        <div className="h-4 w-5/6 rounded-lg bg-surface-container-high" />
      </div>
      <div className="h-32 rounded-2xl bg-surface-container-high" />
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
      <div className="rounded-2xl bg-error-container px-6 py-4 text-center">
        <p className="text-sm font-medium text-on-error-container">{message}</p>
      </div>
      <button
        onClick={handleReturn}
        className="text-sm text-primary hover:underline"
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
      <div className="rounded-full bg-secondary-container p-5 shadow-[0_12px_32px_rgba(43,52,55,0.06)]">
        <span
          className="material-symbols-outlined text-secondary text-5xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          task_alt
        </span>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-on-surface">
          Apsveicam! Darbnīca pabeigta!
        </h2>
        <p className="text-sm text-on-surface-variant">
          Jūs esat veiksmīgi izpildījis visus {totalTasks} uzdevumus.
        </p>
      </div>
      <button
        onClick={handleReturn}
        className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-on-primary shadow-[0_4px_16px_rgba(12,95,174,0.25)] hover:opacity-90 transition-all"
      >
        Atgriezties uz sākumlapu
      </button>
    </div>
  );
}
