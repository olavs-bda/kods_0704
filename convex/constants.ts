// convex/constants.ts
// Shared error codes used by both Convex functions and frontend components

// Returned by getCurrentTask, advanceTask, and getSubmissionContext when the
// session has passed its expiresAt timestamp; the frontend uses this value to
// trigger an automatic redirect rather than showing a generic error banner.
export const SESSION_EXPIRED_ERROR = "Sesija ir beigusies." as const;
