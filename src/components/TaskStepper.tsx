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
      className="overflow-x-auto"
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
                  className={`mx-1 h-0.5 w-4 sm:w-6 ${
                    isCompleted ? "bg-blue-500" : "bg-gray-200"
                  }`}
                />
              )}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isCompleted ? "bg-blue-500 text-white"
                  : isCurrent ?
                    "border-2 border-blue-500 bg-white text-blue-600"
                  : "border border-gray-300 bg-gray-50 text-gray-400"
                }`}
                title={task.title_lv}
              >
                {isCompleted ?
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                : idx + 1}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
