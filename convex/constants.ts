// convex/constants.ts
// Shared constants used by both Convex functions and frontend components

// Returned by getCurrentTask, advanceTask, and getSubmissionContext when the
// session has passed its expiresAt timestamp; the frontend uses this value to
// trigger an automatic redirect rather than showing a generic error banner.
export const SESSION_EXPIRED_ERROR = "Sesija ir beigusies." as const;

// OpenAI configuration defaults
export const AI_MODEL = "gpt-5.4-nano" as const;
export const AI_MODEL_BY_LEVEL: Record<number, string> = {
  1: "gpt-5.4-nano",
  2: "gpt-5.4-mini",
  3: "gpt-5.4-mini",
} as const;
export const AI_MODEL_FALLBACK = "gpt-5.4-nano" as const;
export const AI_TEMPERATURE = 0.4;
export const AI_TIMEOUT_MS = 30_000;
export const AI_MAX_RETRIES = 1;

// Time helpers
export const MS_PER_HOUR = 60 * 60 * 1000;

// Cleanup: delete sessions and their submissions after this many days
export const STALE_DATA_RETENTION_DAYS = 90;

// Approximate USD→EUR conversion rate for token cost display
export const USD_TO_EUR_RATE = 0.92;

// Minimum score (out of 10) required to proceed to the next task
export const MIN_PASSING_SCORE = 6;

// Technique labels for badge system (T-codes from PROMPT_PLAN.md)
export const TECHNIQUE_LABELS: Record<string, string> = {
  T1: "Skaidra instrukcija",
  T2: "Konkrētība",
  T3: "Izvades ierobežojumi",
  T4: "Auditorija / konteksts",
  T7: "Strukturēta izvade",
  T8: "Norobežotāji",
  T10: "Uzdevuma sadalīšana",
  T12: "Malas gadījumi",
  T13: "Perspektīva",
  T14: "Lomas piešķiršana",
  T15: "Daudzsoļu domāšana",
  T16: "Loģiskā secība",
  T17: "Kvalitātes kritēriji",
  T20: "Izvades optimizācija",
} as const;

// Map task slugs to their primary technique codes
export const TASK_TECHNIQUES: Record<string, string[]> = {
  "task-1-1": ["T1"],
  "task-1-2": ["T2"],
  "task-1-3": ["T3"],
  "task-1-4": ["T4"],
  "task-1-5": ["T3", "T4"],
  "task-2-1": ["T7"],
  "task-2-2": ["T13"],
  "task-2-3": ["T8"],
  "task-2-4": ["T12"],
  "task-2-5": ["T10"],
  "task-3-1": ["T14"],
  "task-3-2": ["T15", "T16"],
  "task-3-3": ["T17"],
  "task-3-4": ["T14", "T7", "T17"],
  "task-3-5": ["T20"],
} as const;
