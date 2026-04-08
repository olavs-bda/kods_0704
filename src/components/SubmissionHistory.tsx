// src/components/SubmissionHistory.tsx
// Expandable list of previous attempts for the current task
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import FeedbackDisplay from "./FeedbackDisplay";

export default function SubmissionHistory({
  sessionId,
  taskId,
}: {
  sessionId: Id<"sessions">;
  taskId: Id<"tasks">;
}) {
  const submissions = useQuery(api.submissions.getTaskSubmissions, {
    sessionId,
    taskId,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!submissions || submissions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">
        Iepriekšējie mēģinājumi ({submissions.length})
      </h3>

      <div className="space-y-2">
        {submissions.map((sub, idx) => {
          const isExpanded = expandedId === sub._id;
          const date = new Date(sub.createdAt);
          const timeStr = date.toLocaleTimeString("lv-LV", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={sub._id}
              className="rounded-lg border border-gray-200 bg-white"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : sub._id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-700">
                  #{submissions.length - idx} — {timeStr}
                </span>
                <span className="text-gray-400">{isExpanded ? "▲" : "▼"}</span>
              </button>

              {isExpanded && (
                <div className="space-y-3 border-t border-gray-100 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Jūsu prompts
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                      {sub.prompt}
                    </p>
                  </div>

                  {sub.feedback && <FeedbackDisplay feedback={sub.feedback} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
