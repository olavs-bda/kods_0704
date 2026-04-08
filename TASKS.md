# Prompt Workshop Coach – Task Tracker

## Task Status Legend

- ✅ COMPLETED: Task has been fully implemented and tested
- 🚧 IN PROGRESS: Task is currently being worked on
- ⏸ PENDING: Task is planned but not started
- ⚠️ NEEDS WORK: Task has remaining implementation work

## MVP Project Requirements

### Core MVP Features

- Code-based access (Organisation Code + Participant Code)
- Persistent session state with soft expiry (24–72h configurable)
- Task delivery based on organisation
- Sequential task flow (one task at a time)
- Prompt submission with edit/resubmit
- AI-generated structured feedback in Latvian
- Progressive difficulty (levels 1–3)
- Minimal, mobile-responsive UI
- Secure backend (no API keys exposed)
- Graceful error handling

### Technical Requirements

- **Frontend**: Astro (deployed on Vercel) with TypeScript strict mode
- **Backend**: Convex (queries, mutations, actions + built-in database)
- **AI**: OpenAI API via Convex actions
- **Styling**: TailwindCSS utility classes only (no `@apply`)
- **Validation**: Zod for all mutation inputs
- **State**: nanostores for client-side shared state
- **Language**: All user-facing feedback in Latvian

---

## MVP Development Roadmap

## Phase 1: Setup & Infrastructure ✅ COMPLETED

| ID  | Task                                 | Status       | Priority | Details                                                        |
| --- | ------------------------------------ | ------------ | -------- | -------------------------------------------------------------- |
| 1.1 | Initialize Astro project             | ✅ COMPLETED | HIGH     | Astro 6.1.4, TypeScript strict, TailwindCSS v4 via Vite plugin |
| 1.2 | Set up Convex backend                | ✅ COMPLETED | HIGH     | Schema defined, synced, env vars configured                    |
| 1.3 | Configure Vercel deployment          | ✅ COMPLETED | HIGH     | @astrojs/vercel adapter, vercel.json, server output mode       |
| 1.4 | Install and wire core libraries      | ✅ COMPLETED | MEDIUM   | zod, nanostores, date-fns, convex-helpers installed            |
| 1.5 | Configure OpenAI environment         | ✅ COMPLETED | HIGH     | OPENAI_API_KEY set via `npx convex env set`                    |
| 1.6 | Basic project documentation & README | ✅ COMPLETED | LOW      | README with setup, seed, architecture, env vars                |

## Phase 2: Core Data Models ✅ COMPLETED

| ID  | Task                                      | Status       | Priority | Details                                                                                                                                               |
| --- | ----------------------------------------- | ------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Define Convex schema: organisations table | ✅ COMPLETED | HIGH     | code, name, taskIds (array of task references), settings (sessionExpiryHours, maxSubmissionsPerUser); index by_code                                   |
| 2.2 | Define Convex schema: sessions table      | ✅ COMPLETED | HIGH     | organisationId, participantCode, currentTaskIndex, startedAt, lastActiveAt, expiresAt, submissionCount; indexes by_organisationId_and_participantCode |
| 2.3 | Define Convex schema: tasks table         | ✅ COMPLETED | HIGH     | slug, title_lv, instruction_lv, context_lv, expectedOutput, level, hints_lv (optional), example_lv (optional); index by_slug                          |
| 2.4 | Define Convex schema: submissions table   | ✅ COMPLETED | HIGH     | sessionId, taskId (reference to tasks), prompt, createdAt, feedback object; index by_sessionId                                                        |
| 2.5 | Seed initial organisation + task data     | ✅ COMPLETED | MEDIUM   | `convex/seed.ts` — 1 org (BDA-2026), 6 individual tasks (2/level), org links via taskIds array                                         |

## Phase 3: Session Management ✅ COMPLETED

| ID  | Task                                | Status       | Priority | Details                                                                            |
| --- | ----------------------------------- | ------------ | -------- | ---------------------------------------------------------------------------------- |
| 3.1 | Validate organisation code mutation | ✅ COMPLETED | HIGH     | `sessions.validateOrganisation` — lookup by code via index, return org or null     |
| 3.2 | Create or resume session mutation   | ✅ COMPLETED | HIGH     | `sessions.createOrResumeSession` — create/resume with expiry check; Latvian errors |
| 3.3 | Session expiry logic                | ✅ COMPLETED | HIGH     | Checked in createOrResumeSession, getCurrentTask, advanceTask, touchSession        |
| 3.4 | Update session activity mutation    | ✅ COMPLETED | MEDIUM   | `sessions.touchSession` + auto-touch on resume and task advance                    |

## Phase 4: Task Engine ✅ COMPLETED

| ID  | Task                          | Status       | Priority | Details                                                                                   |
| --- | ----------------------------- | ------------ | -------- | ----------------------------------------------------------------------------------------- |
| 4.1 | Get current task query        | ✅ COMPLETED | HIGH     | `tasks.getCurrentTask` — returns task + index + total + isCompleted; handles all edges    |
| 4.2 | Advance to next task mutation | ✅ COMPLETED | HIGH     | `tasks.advanceTask` — increments index, validates bounds, touches lastActiveAt            |
| 4.3 | Get task history query        | ✅ COMPLETED | MEDIUM   | `tasks.getSubmissionHistory` — all submissions for session, ordered desc by creation time |

## Phase 5: Submission & AI Feedback ✅ COMPLETED

| ID  | Task                           | Status       | Priority | Details                                                                                                             |
| --- | ------------------------------ | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Submit prompt action           | ✅ COMPLETED | HIGH     | `submitPrompt.submitPrompt` action — validates, calls OpenAI gpt-4o-mini, parses JSON, stores submission            |
| 5.2 | OpenAI prompt template         | ✅ COMPLETED | HIGH     | System + user prompt with task context, level-aware coaching, JSON response_format; all feedback in Latvian         |
| 5.3 | Parse and validate AI response | ✅ COMPLETED | HIGH     | `parseFeedback()` — validates all 5 required string fields; graceful error on malformed response                    |
| 5.4 | Rate limiting enforcement      | ✅ COMPLETED | HIGH     | `submissions.getSubmissionContext` checks `submissionCount >= maxSubmissionsPerUser`; Latvian error if exceeded     |
| 5.5 | Store submission + feedback    | ✅ COMPLETED | HIGH     | `submissions.storeSubmission` — inserts submission with feedback, increments session submissionCount + lastActiveAt |
| 5.6 | Resubmit / edit flow           | ✅ COMPLETED | MEDIUM   | Multiple submissions per task supported; `submissions.getTaskSubmissions` query for per-task history                |

## Phase 6: Frontend – Access Flow ✅ COMPLETED

| ID  | Task                                   | Status       | Priority | Details                                                                   |
| --- | -------------------------------------- | ------------ | -------- | ------------------------------------------------------------------------- |
| 6.1 | Code entry page (`/`)                  | ✅ COMPLETED | HIGH     | LoginForm component with org + participant code; LoginPage island wrapper |
| 6.2 | Session validation and redirect        | ✅ COMPLETED | HIGH     | createOrResumeSession → sessionStore persist → redirect `/task`           |
| 6.3 | Error states for invalid/expired codes | ✅ COMPLETED | MEDIUM   | Latvian error messages for invalid org, expired session, rate limits      |

## Phase 7: Frontend – Task & Feedback UI ✅ COMPLETED

| ID  | Task                               | Status       | Priority | Details                                                                             |
| --- | ---------------------------------- | ------------ | -------- | ----------------------------------------------------------------------------------- |
| 7.1 | Task display component             | ✅ COMPLETED | HIGH     | TaskWorkspace shows title, instruction, context, level badge, hints                 |
| 7.2 | Prompt input component             | ✅ COMPLETED | HIGH     | Textarea with character count, submit button, disabled during submission            |
| 7.3 | Feedback display component         | ✅ COMPLETED | HIGH     | FeedbackDisplay with strengths, weaknesses, improved prompt, explanation, next step |
| 7.4 | Loading state for AI response      | ✅ COMPLETED | MEDIUM   | SubmittingIndicator spinner + skeleton loader for initial data                      |
| 7.5 | "Next Task" button and progression | ✅ COMPLETED | HIGH     | Shows after feedback; CompletionScreen at end; advanceTask mutation                 |
| 7.6 | Submission history view            | ✅ COMPLETED | MEDIUM   | SubmissionHistory with expandable per-attempt view including feedback               |

## Phase 8: Testing & Polish 🚧 IN PROGRESS

| ID  | Task                                           | Status       | Priority | Details                                                                           |
| --- | ---------------------------------------------- | --------- | -------- | --------------------------------------------------------------------------------- |
| 8.1 | End-to-end access → task → submit flow testing | ✅ COMPLETED | HIGH     | `convex/flow.test.ts` — 13 tests: session creation, task retrieval, advancement, submission storage, rate-limit enforcement |
| 8.2 | Session expiry edge cases                      | ✅ COMPLETED | HIGH     | `convex/expiry.test.ts` — 10 tests: expired session rejected at login/touch/task/advance/submit; mid-task expiry auto-redirects in `TaskWorkspace.tsx` |
| 8.3 | Rate limiting validation                       | ✅ COMPLETED | HIGH     | `convex/rateLimit.test.ts` — 8 tests: boundary (at/below/above limit), enforcement through storeSubmission, Latvian error messages |
| 8.4 | OpenAI error handling                          | ✅ COMPLETED | HIGH     | `classifyOpenAIError()` in submitPrompt.ts — timeout (30s), rate limit, auth, connection, 5xx; all Latvian messages; 5 tests |
| 8.5 | Mobile responsiveness                          | ⏸ PENDING | MEDIUM   | Verify all pages work on mobile; touch-friendly inputs and buttons                |
| 8.6 | UI/UX polish                                   | ⏸ PENDING | MEDIUM   | Consistent spacing, typography, Latvian copy review                               |
| 8.7 | Production deployment to Vercel                | ⏸ PENDING | HIGH     | Environment vars set, Convex prod deployment, OpenAI key configured, smoke test   |
| 8.8 | Token-level usage tracking                     | ⏸ PENDING | MEDIUM   | Track per-submission token usage (input/output); enforce budget cap per user      |
| 8.9 | User onboarding / help                         | ✅ COMPLETED | MEDIUM   | `HelpOverlay.tsx` — first-visit banner + persistent help button + 4-step modal walkthrough; all Latvian |

---

## 🏗️ Architecture Reference

### Access Flow

```
Enter Codes → Validate Org → Create/Resume Session → Check Expiry → Return Current Task
```

### Submission Flow

```
Submit Prompt → Check Rate Limit → Send to OpenAI → Parse Response → Store Feedback → Display
```

### Task Progression

```
Task 1 (Level 1) → Task 2 (Level 1) → ... → Task N (Level 3) → Done
```

### Session Model

- **Created**: on first valid code entry
- **Resumed**: on subsequent entries with same org + participant code
- **Expired**: when `now > expiresAt` (configurable 24–72h per organisation)

### Data Flow

```
Organisation → taskIds[] → Tasks (individual documents)
Session → Submissions[] → Feedback (from OpenAI)
```

### Key Convex Conventions

- All functions must include `returns` validator (`v.null()` for void)
- Use `.withIndex()` — never `.filter()` for indexed fields
- Public mutations: `mutation`; server-only: `internalMutation`
- Actions for OpenAI calls (cannot access `ctx.db` directly)
- Indexes named after fields: `by_organisationId_and_participantCode`
- `"use node";` at top of files using OpenAI SDK
