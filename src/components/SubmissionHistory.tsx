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
      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
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
              className="rounded-2xl bg-surface-container-low overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : sub._id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-surface-container transition-colors"
              >
                <span className="font-medium text-on-surface">
                  #{submissions.length - idx} — {timeStr}
                </span>
                <span className="text-outline text-xs">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </button>

              {isExpanded && (
                <div className="space-y-3 px-4 py-3 bg-surface-container-lowest rounded-b-2xl">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Jūsu uzvedne
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-on-surface">
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
