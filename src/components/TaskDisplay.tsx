// src/components/TaskDisplay.tsx
// Task card: title, instruction, context, hints, teaching note, technique badges
import { TECHNIQUE_LABELS, TASK_TECHNIQUES } from "../../convex/constants";

interface Task {
  slug: string;
  title_lv: string;
  instruction_lv: string;
  context_lv: string;
  hints_lv?: string;
  teachingNote_lv?: string;
}

export default function TaskDisplay({ task }: { task: Task }) {
  const techniques = TASK_TECHNIQUES[task.slug] ?? [];

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-4 sm:p-6 shadow-[0_12px_32px_rgba(43,52,55,0.06)]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <h2 className="text-xl font-bold text-on-surface">{task.title_lv}</h2>
        {techniques.length > 0 && (
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {techniques.map((code) => (
              <span
                key={code}
                title={TECHNIQUE_LABELS[code] ?? code}
                className="rounded-full bg-tertiary-container px-2 py-0.5 text-[10px] font-bold text-on-tertiary-container uppercase tracking-wider"
              >
                {code}
              </span>
            ))}
          </div>
        )}
      </div>
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

      {task.teachingNote_lv && (
        <details className="mt-3 rounded-xl bg-tertiary-container/20">
          <summary className="cursor-pointer select-none p-4 text-xs font-bold uppercase tracking-widest text-tertiary hover:text-tertiary-dim transition-colors">
            <span className="material-symbols-outlined text-sm align-middle mr-1">
              school
            </span>
            Tehnika (klikšķiniet, lai uzzinātu vairāk)
          </summary>
          <p className="px-4 pb-4 text-sm text-on-surface-variant leading-relaxed">
            {task.teachingNote_lv}
          </p>
        </details>
      )}
    </div>
  );
}
