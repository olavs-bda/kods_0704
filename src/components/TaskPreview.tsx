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
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          1. uzdevums
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          Līmenis: {task.level}
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-900">{task.title_lv}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">
        {task.instruction_lv}
      </p>
    </div>
  );
}
