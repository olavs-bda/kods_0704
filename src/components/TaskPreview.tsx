// src/components/TaskPreview.tsx
// Blurred preview of the first task, shown on the login page
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function TaskPreview({ ready }: { ready?: boolean }) {
  const task = useQuery(api.tasks.getFirstTask);

  if (!task) return null;

  return (
    <div
      className={`transition-all duration-500 ${
        ready ? "" : "pointer-events-none blur-md opacity-40 select-none"
      }`}
      aria-hidden={!ready}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-on-primary-container">
          1. uzdevums
        </span>
        <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-on-surface-variant">
          Līmenis: {task.level}
        </span>
      </div>
      <h3 className="text-lg font-bold text-on-surface">{task.title_lv}</h3>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
        {task.instruction_lv}
      </p>
    </div>
  );
}
