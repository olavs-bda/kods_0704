// src/lib/sessionStore.test.ts
import { expect, test, describe, beforeEach, vi } from "vitest";

// Mock localStorage for the edge-runtime environment which lacks browser APIs
const store: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (index: number) => Object.keys(store)[index] ?? null,
};
(globalThis as { localStorage: Storage }).localStorage = localStorageMock;

// Import after mock is set up
import {
  persistSession,
  loadSession,
  loadParticipantCode,
  clearSession,
} from "./sessionStore";
import type { Id } from "../../convex/_generated/dataModel";

beforeEach(() => {
  localStorageMock.clear();
  vi.restoreAllMocks();
});

describe("persistSession", () => {
  test("stores session in localStorage", () => {
    const id = "sessions:abc123" as Id<"sessions">;
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000;
    persistSession(id, "BDA-2026", "p001", expiresAt);
    const raw = localStorageMock.getItem("pwc_session");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.sessionId).toBe(id);
    expect(parsed.organisationCode).toBe("BDA-2026");
    expect(parsed.participantCode).toBe("p001");
    expect(parsed.expiresAt).toBe(expiresAt);
  });
});

describe("loadSession", () => {
  test("returns null when nothing stored", () => {
    const result = loadSession();
    expect(result).toBeNull();
  });

  test("returns session id when stored", () => {
    const id = "sessions:ghi789" as Id<"sessions">;
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000;
    persistSession(id, "BDA-2026", "p003", expiresAt);

    const result = loadSession();
    expect(result).toBe(id);
  });

  test("returns null for corrupt JSON", () => {
    store["pwc_session"] = "not-valid-json{{{";
    const result = loadSession();
    expect(result).toBeNull();
  });

  test("returns null and clears entry when TTL has expired", () => {
    const id = "sessions:expired1" as Id<"sessions">;
    // Manually store with expiresAt in the past
    store["pwc_session"] = JSON.stringify({
      sessionId: id,
      organisationCode: "BDA-2026",
      participantCode: "p-old",
      expiresAt: Date.now() - 1000,
    });

    const result = loadSession();
    expect(result).toBeNull();
    expect(localStorageMock.getItem("pwc_session")).toBeNull();
  });
});

describe("loadParticipantCode", () => {
  test("returns null when nothing stored", () => {
    const result = loadParticipantCode();
    expect(result).toBeNull();
  });

  test("returns participant code when stored", () => {
    const id = "sessions:jkl012" as Id<"sessions">;
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000;
    persistSession(id, "BDA-2026", "p-special", expiresAt);
    const result = loadParticipantCode();
    expect(result).toBe("p-special");
  });

  test("returns null for corrupt JSON", () => {
    store["pwc_session"] = "{bad json";
    const result = loadParticipantCode();
    expect(result).toBeNull();
  });
});

describe("clearSession", () => {
  test("removes session from localStorage", () => {
    const id = "sessions:mno345" as Id<"sessions">;
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000;
    persistSession(id, "BDA-2026", "p004", expiresAt);

    clearSession();

    expect(localStorageMock.getItem("pwc_session")).toBeNull();
  });

  test("loadSession returns null after clear", () => {
    const id = "sessions:stu901" as Id<"sessions">;
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000;
    persistSession(id, "BDA-2026", "p006", expiresAt);
    clearSession();
    expect(loadSession()).toBeNull();
  });
});
