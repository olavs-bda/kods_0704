// src/components/TaskStepper.tsx
// Horizontal stepper showing task progress (completed / current / upcoming)
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export default function TaskStepper({
  sessionId,
  currentIndex,
}: {
  sessionId: Id<"sessions">;
  currentIndex: number;
}) {
  const summaries = useQuery(api.tasks.getTaskSummaries, { sessionId });

  if (!summaries || "error" in summaries) return null;

  return (
    <nav
      aria-label="Uzdevumu progress"
      className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0"
    >
      <ol className="flex items-center gap-1">
        {summaries.map((task, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <li
              key={task._id}
              className="flex items-center"
            >
              {idx > 0 && (
                <div
                  className={`mx-1 h-0.5 w-4 sm:w-6 rounded-full ${
                    isCompleted ? "bg-primary" : "bg-surface-container-high"
                  }`}
                />
              )}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isCompleted ?
                    "bg-primary text-on-primary shadow-[0_4px_12px_rgba(12,95,174,0.3)]"
                  : isCurrent ?
                    "bg-surface-container-lowest ring-2 ring-primary text-primary shadow-[0_4px_12px_rgba(12,95,174,0.15)]"
                  : "bg-surface-container text-outline"
                }`}
                title={task.title_lv}
              >
                {isCompleted ?
                  <span className="material-symbols-outlined text-sm">
                    check
                  </span>
                : idx + 1}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
