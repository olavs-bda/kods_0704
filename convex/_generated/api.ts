// convex/_generated/api.ts
/* prettier-ignore */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import { anyApi } from "convex/server";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as submissions from "../submissions.js";
import type * as submitPrompt from "../submitPrompt.js";
import type * as tasks from "../tasks.js";

const fullApi: ApiFromModules<{
  "seed": typeof seed,
  "sessions": typeof sessions,
  "submissions": typeof submissions,
  "submitPrompt": typeof submitPrompt,
  "tasks": typeof tasks,
}> = anyApi as any;

export const api: FilterApi<typeof fullApi, FunctionReference<any, "public">> = anyApi as any;

export const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">> = anyApi as any;
