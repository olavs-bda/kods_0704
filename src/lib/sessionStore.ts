// src/lib/sessionStore.ts
// Client-side session persistence using localStorage with TTL
import type { Id } from "../../convex/_generated/dataModel";

const SESSION_KEY = "pwc_session";

interface StoredSession {
  sessionId: string;
  organisationCode: string;
  participantCode: string;
  expiresAt: number;
}

export function persistSession(
  sessionId: Id<"sessions">,
  organisationCode: string,
  participantCode: string,
  expiresAt: number,
): void {
  const data: StoredSession = {
    sessionId,
    organisationCode,
    participantCode,
    expiresAt,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function loadSession(): Id<"sessions"> | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data: StoredSession = JSON.parse(raw);
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data.sessionId as Id<"sessions">;
  } catch (err: unknown) {
    console.error("sessionStore.loadSession failed:", err);
    return null;
  }
}

export function loadParticipantCode(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data: StoredSession = JSON.parse(raw);
    return data.participantCode ?? null;
  } catch (err: unknown) {
    console.error("sessionStore.loadParticipantCode failed:", err);
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
