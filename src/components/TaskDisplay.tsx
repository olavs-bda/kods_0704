// src/components/TaskDisplay.tsx
// Task card: title, instruction, context, hints, level badge

interface Task {
  title_lv: string;
  instruction_lv: string;
  context_lv: string;
  hints_lv?: string;
}

export default function TaskDisplay({ task }: { task: Task }) {
  return (
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
  );
}
