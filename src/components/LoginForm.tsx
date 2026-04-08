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

      persistSession(result.sessionId, trimmedOrg, trimmedParticipant);
      window.location.href = "/task";
    } catch {
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
          className="block text-sm font-medium text-gray-700"
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
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="participantCode"
          className="block text-sm font-medium text-gray-700"
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
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Notiek pieslēgšanās..." : "Sākt darbnīcu"}
      </button>
    </form>
  );
}
