/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cleanup from "../cleanup.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as dist__generated_api from "../dist/_generated/api.js";
import type * as dist__generated_server from "../dist/_generated/server.js";
import type * as dist_dist__generated_api from "../dist/dist/_generated/api.js";
import type * as dist_dist__generated_server from "../dist/dist/_generated/server.js";
import type * as dist_dist_seed from "../dist/dist/seed.js";
import type * as dist_seed from "../dist/seed.js";
import type * as dist_testOpenAI from "../dist/testOpenAI.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as submissions from "../submissions.js";
import type * as submitPrompt from "../submitPrompt.js";
import type * as tasks from "../tasks.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cleanup: typeof cleanup;
  constants: typeof constants;
  crons: typeof crons;
  "dist/_generated/api": typeof dist__generated_api;
  "dist/_generated/server": typeof dist__generated_server;
  "dist/dist/_generated/api": typeof dist_dist__generated_api;
  "dist/dist/_generated/server": typeof dist_dist__generated_server;
  "dist/dist/seed": typeof dist_dist_seed;
  "dist/seed": typeof dist_seed;
  "dist/testOpenAI": typeof dist_testOpenAI;
  seed: typeof seed;
  sessions: typeof sessions;
  submissions: typeof submissions;
  submitPrompt: typeof submitPrompt;
  tasks: typeof tasks;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
