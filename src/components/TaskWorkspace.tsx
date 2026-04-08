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
import { MIN_PASSING_SCORE } from "../../convex/constants";
import FeedbackDisplay from "./FeedbackDisplay";
import SubmissionHistory from "./SubmissionHistory";
import TaskStepper from "./TaskStepper";
import TaskDisplay from "./TaskDisplay";
import PromptForm, { SubmittingIndicator } from "./PromptForm";
import CompletionScreen from "./CompletionScreen";
import SessionError from "./SessionError";
import LoadingSkeleton from "./LoadingSkeleton";
import HelpOverlay from "./HelpOverlay";

interface Feedback {
  strengths_lv: string;
  weaknesses_lv: string;
  improvedPrompt_lv: string;
  explanation_lv: string;
  nextStep_lv: string;
  score?: number;
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
      "errorCode" in taskData &&
      taskData.errorCode === "SESSION_EXPIRED"
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
        if ("errorCode" in result && result.errorCode === "SESSION_EXPIRED") {
          clearSession();
          window.location.replace("/");
          return;
        }
        setError(result.error ?? "Nezināma kļūda.");
      } else {
        setLatestFeedback(result.feedback);
      }
    } catch (err: unknown) {
      console.error("Prompt submission failed:", err);
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
    } catch (err: unknown) {
      console.error("Task advance failed:", err);
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
    <div className="space-y-4 sm:space-y-6 pb-16">
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
              Sveiki,{" "}
              <span className="font-semibold text-on-surface">
                {participantCode}
              </span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-outline hover:text-on-surface transition-colors min-h-[44px] px-2"
          >
            Iziet
          </button>
        </div>
      </div>

      <TaskDisplay task={task} />

      {/* Show prompt text read-only after passing, editable form otherwise */}
      {(
        latestFeedback?.score != null &&
        latestFeedback.score >= MIN_PASSING_SCORE
      ) ?
        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Jūsu uzvedne
          </label>
          <div className="rounded-xl bg-surface-container-highest px-4 py-3 text-sm text-on-surface whitespace-pre-wrap opacity-70">
            {prompt}
          </div>
        </div>
      : <PromptForm
          prompt={prompt}
          onPromptChange={setPrompt}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
        />
      }

      {/* Loading State */}
      {submitting && <SubmittingIndicator />}

      {/* Feedback Display */}
      {latestFeedback && <FeedbackDisplay feedback={latestFeedback} />}

      {/* Next Task / Satisfaction Gate */}
      {latestFeedback &&
        (() => {
          const passing =
            latestFeedback.score != null &&
            latestFeedback.score >= MIN_PASSING_SCORE;
          return passing ?
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="w-full rounded-full bg-primary px-4 py-3 min-h-[44px] text-sm font-semibold text-on-primary shadow-[0_4px_16px_rgba(12,95,174,0.25)] hover:shadow-[0_6px_20px_rgba(12,95,174,0.35)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 transition-all"
              >
                {advancing ?
                  "Notiek pāreja..."
                : taskIndex + 1 < totalTasks ?
                  "Nākamais uzdevums →"
                : "Pabeigt darbnīcu →"}
              </button>
            : <div className="rounded-xl bg-tertiary-container/30 px-4 py-3 text-center space-y-1">
                <p className="text-sm font-semibold text-on-tertiary-container">
                  Mēģiniet uzlabot savu uzvedni, lai sasniegtu vismaz{" "}
                  {MIN_PASSING_SCORE}/10
                </p>
                <p className="text-xs text-on-tertiary-container/70">
                  Izlasiet AI ieteikumus un iesniedziet uzlabotu uzvedni.
                </p>
              </div>;
        })()}

      {/* Submission History (7.6) */}
      <SubmissionHistory
        sessionId={sessionId}
        taskId={task._id}
      />

      {/* Help button + onboarding modal (auto-shows on first visit) */}
      <HelpOverlay autoShow />
    </div>
  );
}
