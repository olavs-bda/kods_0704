// src/components/HelpOverlay.tsx
// 8.9 — Collapsible onboarding help panel explaining the workshop workflow in Latvian
import { useState, useEffect } from "react";

const HELP_DISMISSED_KEY = "pwc_help_dismissed";

const steps = [
  {
    icon: "login",
    title: "Pieslēgšanās",
    description:
      "Ievadiet organizācijas kodu un savu dalībnieka kodu, lai piekļūtu darbnīcai.",
  },
  {
    icon: "edit_note",
    title: "Uzdevumu izpilde",
    description:
      "Katram uzdevumam uzrakstiet uzvedni (promptu) atbilstoši instrukcijai. Uzdevumi kļūst grūtāki.",
  },
  {
    icon: "smart_toy",
    title: "AI atgriezeniskā saite",
    description:
      "Pēc iesniegšanas AI novērtēs jūsu uzvedni un sniegs ieteikumus uzlabojumiem latviešu valodā.",
  },
  {
    icon: "refresh",
    title: "Uzlabošana",
    description:
      "Varat rediģēt un iesniegt uzvedni atkārtoti, lai uzlabotu rezultātu pirms pāriešanas uz nākamo uzdevumu.",
  },
];

export default function HelpOverlay() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(HELP_DISMISSED_KEY) === "true");
    } catch {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    setOpen(false);
    try {
      sessionStorage.setItem(HELP_DISMISSED_KEY, "true");
    } catch {
      // sessionStorage unavailable — silently continue
    }
  }

  return (
    <>
      {/* First-visit banner */}
      {!dismissed && (
        <div className="rounded-2xl bg-secondary-container/60 backdrop-blur-sm px-5 py-4 flex items-start gap-3">
          <span
            className="material-symbols-outlined text-secondary mt-0.5"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            school
          </span>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-on-secondary-container">
              Pirmā reize darbnīcā?
            </p>
            <p className="text-xs text-on-secondary-container/80 leading-relaxed">
              Šī ir AI uzvedņu (promptu) rakstīšanas darbnīca. Jūs saņemsiet
              uzdevumus un AI atgriezenisko saiti savām uzvedēm.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setOpen(true)}
                className="text-xs font-semibold text-secondary hover:underline"
              >
                Uzzināt vairāk
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs text-on-secondary-container/60 hover:text-on-secondary-container"
              >
                Aizvērt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help button (always visible) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full bg-surface-container-highest px-4 py-2 text-xs font-semibold text-on-surface-variant shadow-[0_4px_16px_rgba(43,52,55,0.12)] hover:bg-primary hover:text-on-primary transition-all"
        aria-label="Palīdzība"
      >
        <span className="material-symbols-outlined text-base">help</span>
        Palīdzība
      </button>

      {/* Help modal */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-scrim/40 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-[0_24px_64px_rgba(43,52,55,0.15)] space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-on-surface">
                Kā darbojas darbnīca?
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-surface-container-high transition-colors"
                aria-label="Aizvērt"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-xl">
                  close
                </span>
              </button>
            </div>

            <ol className="space-y-4">
              {steps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-primary-container">
                    <span className="material-symbols-outlined text-on-primary-container text-lg">
                      {step.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      {i + 1}. {step.title}
                    </p>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="rounded-xl bg-tertiary-container/50 px-4 py-3">
              <p className="text-xs text-on-tertiary-container leading-relaxed">
                <strong>Padoms:</strong> Jo precīzāka un strukturētāka ir jūsu
                uzvedne, jo labāku rezultātu sniegs AI. Izmantojiet kontekstu,
                norādiet formātu un mērķauditoriju.
              </p>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                handleDismiss();
              }}
              className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 transition-all"
            >
              Sapratu!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
