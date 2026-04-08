// src/components/CompletionScreen.tsx
// Workshop completion state — shown when all tasks are done
import { clearSession } from "../lib/sessionStore";

export default function CompletionScreen({
  totalTasks,
}: {
  totalTasks: number;
}) {
  function handleReturn() {
    clearSession();
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="rounded-full bg-secondary-container p-5 shadow-[0_12px_32px_rgba(43,52,55,0.06)]">
        <span
          className="material-symbols-outlined text-secondary text-5xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          task_alt
        </span>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-on-surface">
          Apsveicam! Darbnīca pabeigta!
        </h2>
        <p className="text-sm text-on-surface-variant">
          Jūs esat veiksmīgi izpildījis visus {totalTasks} uzdevumus.
        </p>
      </div>
      <button
        onClick={handleReturn}
        className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-on-primary shadow-[0_4px_16px_rgba(12,95,174,0.25)] hover:opacity-90 transition-all"
      >
        Atgriezties uz sākumlapu
      </button>
    </div>
  );
}
