// src/components/HelpOverlay.tsx
// Persistent help button (bottom-right) + help modal explaining the workshop workflow in Latvian
import { useState, useEffect } from "react";
import { MIN_PASSING_SCORE } from "../../convex/constants";

const ONBOARDING_SHOWN_KEY = "pwc_onboarding_shown";

const steps = [
  {
    icon: "assignment",
    title: "Izlasiet uzdevumu",
    description:
      "Katrs uzdevums apraksta, kādu uzvedni jums jāuzraksta — instrukciju, kontekstu un sagaidāmo rezultātu. Atveriet sadaļas «Padoms» un «Tehnika» zemāk uzdevumā, lai saņemtu norādes.",
  },
  {
    icon: "edit_note",
    title: "Uzrakstiet savu uzvedni",
    description:
      "Ievadiet teksta laukā savu uzvedni latviešu valodā. Esiet konkrēti: norādiet darbību, formātu, garumu un mērķauditoriju. Rādītājs «tokeni» apakšā parāda aptuvenās izmaksas — garāka uzvedne = lielākas izmaksas.",
  },
  {
    icon: "smart_toy",
    title: "AI novērtē jūsu uzvedni",
    description:
      "Pēc iesniegšanas AI analizē jūsu uzvedni un piešķir vērtējumu no 1 līdz 10. Jūs saņemsiet konkrētus komentārus par stiprajām pusēm, uzlabojumiem un uzlabotu uzvednes versiju.",
  },
  {
    icon: "arrow_upward",
    title: "Uzlabojiet, lai turpinātu",
    description: `Lai pārietu uz nākamo uzdevumu, vērtējumam jābūt vismaz ${MIN_PASSING_SCORE}/10. Ja vērtējums ir zemāks — izlasiet AI komentārus, pilnveidojiet savu uzvedni un iesniedziet to no jauna. Iesniedziet tikai tad, kad esat veikuši būtiskas izmaiņas — katrs iesniegums izmanto tokenus.`,
  },
];

/**
 * @param autoShow — if true, shows onboarding modal on first visit (used on task page)
 */
export default function HelpOverlay({
  autoShow = false,
}: {
  autoShow?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!autoShow) return;
    try {
      if (sessionStorage.getItem(ONBOARDING_SHOWN_KEY) !== "true") {
        setOpen(true);
        sessionStorage.setItem(ONBOARDING_SHOWN_KEY, "true");
      }
    } catch (err: unknown) {
      console.error("HelpOverlay: failed to access sessionStorage:", err);
    }
  }, [autoShow]);

  return (
    <>
      {/* Help button (always visible, bottom-right) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-1.5 rounded-full bg-surface-container-highest px-4 py-2.5 min-h-[44px] text-xs font-semibold text-on-surface-variant shadow-[0_4px_16px_rgba(43,52,55,0.12)] hover:bg-primary hover:text-on-primary transition-all"
        aria-label="Palīdzība"
      >
        <span className="material-symbols-outlined text-base">help</span>
        Palīdzība
      </button>

      {/* Help modal */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-scrim/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-surface-container-lowest p-5 sm:p-6 shadow-[0_24px_64px_rgba(43,52,55,0.15)] space-y-5 max-h-[85vh] overflow-y-auto">
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
                <strong>Svarīgi:</strong> Uzdevumi kļūst grūtāki — 1. līmenis
                māca pamatus, 3. līmenis — sarežģītas tehnikas. Katra uzdevuma
                „Tehnika" sadaļa izskaidro, ko konkrēti tiek vērtēts.
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-full rounded-full bg-primary px-4 py-2.5 min-h-[44px] text-sm font-semibold text-on-primary hover:opacity-90 transition-all"
            >
              Sapratu!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
