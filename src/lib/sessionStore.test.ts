// src/lib/sessionStore.test.ts
import { expect, test, describe, beforeEach } from "vitest";

// Mock sessionStorage for the edge-runtime environment which lacks browser APIs
const store: Record<string, string> = {};
const sessionStorageMock: Storage = {
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
(globalThis as { sessionStorage: Storage }).sessionStorage = sessionStorageMock;

// Import after mock is set up
import {
  persistSession,
  loadSession,
  loadParticipantCode,
  clearSession,
  $sessionId,
} from "./sessionStore";
import type { Id } from "../../convex/_generated/dataModel";

beforeEach(() => {
  // Clear storage and reset atom before each test
  sessionStorageMock.clear();
  $sessionId.set(null);
});

describe("persistSession", () => {
  test("stores session in sessionStorage", () => {
    const id = "sessions:abc123" as Id<"sessions">;
    persistSession(id, "BDA-2026", "p001");
    const raw = sessionStorageMock.getItem("pwc_session");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.sessionId).toBe(id);
    expect(parsed.organisationCode).toBe("BDA-2026");
    expect(parsed.participantCode).toBe("p001");
  });

  test("updates the $sessionId atom", () => {
    const id = "sessions:def456" as Id<"sessions">;
    persistSession(id, "ORG", "p002");
    expect($sessionId.get()).toBe(id);
  });
});

describe("loadSession", () => {
  test("returns null when nothing stored", () => {
    const result = loadSession();
    expect(result).toBeNull();
  });

  test("returns session id when stored", () => {
    const id = "sessions:ghi789" as Id<"sessions">;
    persistSession(id, "BDA-2026", "p003");

    // Reset atom to test that loadSession restores it
    $sessionId.set(null);

    const result = loadSession();
    expect(result).toBe(id);
    expect($sessionId.get()).toBe(id);
  });

  test("returns null for corrupt JSON", () => {
    store["pwc_session"] = "not-valid-json{{{";
    const result = loadSession();
    expect(result).toBeNull();
  });
});

describe("loadParticipantCode", () => {
  test("returns null when nothing stored", () => {
    const result = loadParticipantCode();
    expect(result).toBeNull();
  });

  test("returns participant code when stored", () => {
    const id = "sessions:jkl012" as Id<"sessions">;
    persistSession(id, "BDA-2026", "p-special");
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
  test("removes session from sessionStorage", () => {
    const id = "sessions:mno345" as Id<"sessions">;
    persistSession(id, "BDA-2026", "p004");

    clearSession();

    expect(sessionStorageMock.getItem("pwc_session")).toBeNull();
  });

  test("resets the $sessionId atom to null", () => {
    const id = "sessions:pqr678" as Id<"sessions">;
    persistSession(id, "BDA-2026", "p005");
    expect($sessionId.get()).toBe(id);

    clearSession();

    expect($sessionId.get()).toBeNull();
  });

  test("loadSession returns null after clear", () => {
    const id = "sessions:stu901" as Id<"sessions">;
    persistSession(id, "BDA-2026", "p006");
    clearSession();
    expect(loadSession()).toBeNull();
  });
});
