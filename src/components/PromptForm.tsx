// src/components/PromptForm.tsx
// Prompt textarea + submit button with loading/error states and token counter
import { type FormEvent, useState, useEffect, useRef } from "react";
import { countTokens, estimateCost } from "gpt-tokenizer/model/gpt-4o";
import { USD_TO_EUR_RATE } from "../../convex/constants";

const TOKEN_COUNT_DEBOUNCE_MS = 300;

interface PromptFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  error: string | null;
}

export default function PromptForm({
  prompt,
  onPromptChange,
  onSubmit,
  submitting,
  error,
}: PromptFormProps) {
  const [tokenInfo, setTokenInfo] = useState<{
    tokens: number;
    costEur: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!prompt.trim()) {
      setTokenInfo(null);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const tokens = countTokens(prompt);
      const costUsd = estimateCost(tokens);
      const inputCostEur = (costUsd.main?.input ?? 0) * USD_TO_EUR_RATE;
      setTokenInfo({ tokens, costEur: inputCostEur });
    }, TOKEN_COUNT_DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [prompt]);

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3"
    >
      <div>
        <label
          htmlFor="prompt"
          className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1"
        >
          Jūsu uzvedne
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={5}
          placeholder="Ierakstiet savu uzvedni šeit..."
          disabled={submitting}
          className="block w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:text-outline transition-colors resize-none"
        />
        <div className="mt-1 flex justify-between text-xs text-outline">
          <span>
            {tokenInfo ?
              `~${tokenInfo.tokens} tokeni | ~€${tokenInfo.costEur.toFixed(3)}`
            : ""}
          </span>
          <span>{prompt.length} rakstzīmes</span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !prompt.trim()}
        className="w-full rounded-full bg-primary px-4 py-3 min-h-[44px] text-sm font-semibold text-on-primary shadow-[0_4px_16px_rgba(12,95,174,0.25)] hover:shadow-[0_6px_20px_rgba(12,95,174,0.35)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
      >
        {submitting ? "Notiek analīze..." : "Iesniegt uzvedni"}
      </button>
    </form>
  );
}

export function SubmittingIndicator() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_12px_32px_rgba(43,52,55,0.06)] p-8 flex flex-col items-center text-center">
      {/* Atmospheric blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-container/20 rounded-full blur-[80px] animate-pulse-soft pointer-events-none" />

      {/* Rotating ring + central icon */}
      <div className="relative mb-8 flex items-center justify-center z-10">
        <div className="absolute w-32 h-32 border-[0.5px] border-outline-variant/30 rounded-full animate-rotate-slow">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_12px_rgba(12,95,174,0.4)]" />
        </div>
        <div className="w-20 h-20 bg-surface-container-lowest rounded-full shadow-[0_12px_32px_rgba(43,52,55,0.06)] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-tr from-primary/5 to-transparent" />
          <span
            className="material-symbols-outlined text-primary text-4xl animate-pulse"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            model_training
          </span>
        </div>
      </div>

      <div className="space-y-3 animate-pulse-soft z-10">
        <h3 className="text-xl font-extrabold tracking-tight text-on-surface">
          Analizējam jūsu ievadi...
        </h3>
        <p className="text-on-surface-variant text-sm max-w-xs mx-auto">
          Mūsu algoritmi pārskata uzvedni, lai nodrošinātu atbilstību valsts
          pārvaldes standartiem.
        </p>
      </div>

      {/* Progress indicators */}
      <div className="mt-8 w-full space-y-4 z-10">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">
            <span>Lingvistikas pārbaude</span>
            <span className="text-primary">Aktīvs</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-2/3 transition-all duration-1000" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-low p-3 rounded-xl flex flex-col items-center gap-1.5">
            <span
              className="material-symbols-outlined text-secondary text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified_user
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
              Drošība
            </span>
          </div>
          <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col items-center gap-1.5 ring-1 ring-primary/10">
            <span
              className="material-symbols-outlined text-primary text-xl animate-spin"
              style={{ animationDuration: "3s" }}
            >
              sync
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">
              Sintakse
            </span>
          </div>
          <div className="bg-surface-container-low p-3 rounded-xl flex flex-col items-center gap-1.5 opacity-50">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">
              psychology
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
              Konteksts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
