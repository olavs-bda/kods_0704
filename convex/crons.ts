// convex/crons.ts
// Scheduled jobs — runs stale data cleanup daily
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "delete stale sessions and submissions",
  "0 3 * * *",
  internal.cleanup.deleteStaleData,
);

export default crons;
