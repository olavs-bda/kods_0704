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
    <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_12px_32px_rgba(43,52,55,0.06)]">
      <h2 className="text-xl font-bold text-on-surface">{task.title_lv}</h2>
      <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
        {task.instruction_lv}
      </p>

      {task.context_lv && (
        <div className="mt-4 rounded-xl bg-surface-container-low p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-outline mb-1">
            Konteksts
          </p>
          <p className="text-sm text-on-surface">{task.context_lv}</p>
        </div>
      )}

      {task.hints_lv && (
        <details className="mt-3 rounded-xl bg-surface-container-low">
          <summary className="cursor-pointer select-none p-4 text-xs font-bold uppercase tracking-widest text-tertiary hover:text-tertiary-dim transition-colors">
            <span className="material-symbols-outlined text-sm align-middle mr-1">
              lightbulb
            </span>
            Padoms (klikšķiniet, lai atklātu)
          </summary>
          <p className="px-4 pb-4 text-sm text-on-surface-variant">
            {task.hints_lv}
          </p>
        </details>
      )}
    </div>
  );
}
