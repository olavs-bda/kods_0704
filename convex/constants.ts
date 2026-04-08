// convex/constants.ts
// Shared constants used by both Convex functions and frontend components

// Returned by getCurrentTask, advanceTask, and getSubmissionContext when the
// session has passed its expiresAt timestamp; the frontend uses this value to
// trigger an automatic redirect rather than showing a generic error banner.
export const SESSION_EXPIRED_ERROR = "Sesija ir beigusies." as const;

// OpenAI configuration defaults
export const AI_MODEL = "gpt-4o-mini" as const;
export const AI_TEMPERATURE = 0.7;
export const AI_TIMEOUT_MS = 30_000;
export const AI_MAX_RETRIES = 1;

// Time helpers
export const MS_PER_HOUR = 60 * 60 * 1000;
