// src/lib/sessionStore.ts
// Client-side session persistence using localStorage with TTL
import type { Id } from "../../convex/_generated/dataModel";

const SESSION_KEY = "pwc_session";
// Sessions survive tab-close; cleared after 72h on the client side
const SESSION_TTL_MS = 72 * 60 * 60 * 1000;

interface StoredSession {
  sessionId: string;
  organisationCode: string;
  participantCode: string;
  storedAt: number;
}

export function persistSession(
  sessionId: Id<"sessions">,
  organisationCode: string,
  participantCode: string,
): void {
  const data: StoredSession = {
    sessionId,
    organisationCode,
    participantCode,
    storedAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function loadSession(): Id<"sessions"> | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data: StoredSession = JSON.parse(raw);
    if (Date.now() - data.storedAt > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data.sessionId as Id<"sessions">;
  } catch {
    return null;
  }
}

export function loadParticipantCode(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data: StoredSession = JSON.parse(raw);
    return data.participantCode ?? null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
