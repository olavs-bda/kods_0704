// src/lib/sessionStore.ts
// Client-side session state using nanostores
import { atom } from "nanostores";
import type { Id } from "../../convex/_generated/dataModel";

const SESSION_KEY = "pwc_session";

interface StoredSession {
  sessionId: string;
  organisationCode: string;
  participantCode: string;
}

export const $sessionId = atom<Id<"sessions"> | null>(null);

export function persistSession(
  sessionId: Id<"sessions">,
  organisationCode: string,
  participantCode: string,
): void {
  const data: StoredSession = { sessionId, organisationCode, participantCode };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  $sessionId.set(sessionId);
}

export function loadSession(): Id<"sessions"> | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data: StoredSession = JSON.parse(raw);
    $sessionId.set(data.sessionId as Id<"sessions">);
    return data.sessionId as Id<"sessions">;
  } catch {
    return null;
  }
}

export function loadParticipantCode(): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data: StoredSession = JSON.parse(raw);
    return data.participantCode ?? null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  $sessionId.set(null);
}
