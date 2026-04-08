// src/components/LoginForm.tsx
// Code entry form — Organisation Code + Participant Code → create/resume session
import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { persistSession } from "../lib/sessionStore";

export default function LoginForm({
  onReady,
  onLoading,
}: {
  onReady?: (ready: boolean) => void;
  onLoading?: (loading: boolean) => void;
}) {
  const [orgCode, setOrgCode] = useState("");
  const [participantCode, setParticipantCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createOrResumeSession = useMutation(api.sessions.createOrResumeSession);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedOrg = orgCode.trim().toUpperCase();
    const trimmedParticipant = participantCode.trim();

    if (!trimmedOrg || !trimmedParticipant) {
      setError("Lūdzu, aizpildiet abus laukus.");
      return;
    }

    setLoading(true);
    onLoading?.(true);
    try {
      const result = await createOrResumeSession({
        organisationCode: trimmedOrg,
        participantCode: trimmedParticipant,
      });

      if ("error" in result) {
        setError(result.error ?? "Nezināma kļūda.");
        return;
      }

      persistSession(
        result.sessionId,
        trimmedOrg,
        trimmedParticipant,
        result.expiresAt,
      );
      window.location.href = "/task";
    } catch (err: unknown) {
      console.error("Login failed:", err);
      setError("Radās neparedzēta kļūda. Lūdzu, mēģiniet vēlreiz.");
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="orgCode"
          className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1"
        >
          Organizācijas kods
        </label>
        <input
          id="orgCode"
          type="text"
          value={orgCode}
          onChange={(e) => {
            setOrgCode(e.target.value);
            onReady?.(
              e.target.value.trim() !== "" && participantCode.trim() !== "",
            );
          }}
          placeholder="piem., BDA-2026"
          autoComplete="off"
          className="block w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="participantCode"
          className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1"
        >
          Dalībnieka kods
        </label>
        <input
          id="participantCode"
          type="text"
          value={participantCode}
          onChange={(e) => {
            setParticipantCode(e.target.value);
            onReady?.(orgCode.trim() !== "" && e.target.value.trim() !== "");
          }}
          placeholder="piem., Jānis"
          autoComplete="off"
          className="block w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
        />
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
        disabled={loading}
        className="w-full rounded-full bg-primary px-4 py-3 min-h-[44px] text-sm font-semibold text-on-primary shadow-[0_4px_16px_rgba(12,95,174,0.25)] hover:shadow-[0_6px_20px_rgba(12,95,174,0.35)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
      >
        {loading ? "Notiek pieslēgšanās..." : "Sākt darbnīcu"}
      </button>
    </form>
  );
}
