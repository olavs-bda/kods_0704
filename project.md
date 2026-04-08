# SPEC-1-Prompt-Workshop-Coach

## Background

Public sector organizations in Latvia are increasingly adopting LLM-based tools, but employees lack practical prompt-writing skills. Existing training approaches are either too theoretical or too generic, resulting in low retention and poor real-world applicability.

Workshops are the most effective training format but lack structured exercises, scalable feedback, and organization-specific customization.

Prompt Workshop Coach is a web-first, workshop-scoped application designed to provide structured prompt-writing exercises with real-time AI feedback in Latvian. The system operates without user accounts and uses short-lived session access via organization and participant codes.

The system is designed to be minimal, fast, and highly focused on guided learning during live workshops.

---

## Requirements

### Must Have (M)

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

### Should Have (S)

- Multiple submissions per task
- Submission history storage
- Configurable task sets per organisation
- Rate limiting per participant (configurable)
- Loading states for AI responses

### Could Have (C)

- Session expiry tuning
- Analytics (task completion, common issues)
- Feedback tone variations

### Won’t Have (W)

- User accounts
- Facilitator UI
- Public access
- Scoring or gamification
- Multi-language UI

---

## Method

### Architecture

```
Client (Astro + Tailwind)
        |
        v
Convex Backend
  - Session management
  - Task engine
  - Rate limiting
  - OpenAI integration
        |
        v
OpenAI API
```

### Key Design Decisions

- Session-based model instead of user accounts
- Convex as primary backend (state + logic)
- Astro used as UI shell with client-side interactivity
- Stateless frontend, stateful backend

---

### Data Model (Convex)

#### Organisations

```
{
  _id,
  code,
  name,
  taskIds: [Id<"tasks">],
  settings: {
    sessionExpiryHours,
    maxSubmissionsPerUser
  }
}
```

#### Sessions

```
{
  _id,
  organisationId,
  participantCode,
  currentTaskIndex,
  startedAt,
  lastActiveAt,
  expiresAt,
  submissionCount
}
```

#### Tasks

```
{
  _id,
  slug,
  title_lv,
  instruction_lv,
  context_lv,
  expectedOutput,
  level,
  hints_lv?,
  example_lv?
}
```

#### Submissions

```
{
  _id,
  sessionId,
  taskId,
  prompt,
  createdAt,
  feedback: {
    strengths_lv,
    weaknesses_lv,
    improvedPrompt_lv,
    explanation_lv,
    nextStep_lv
  }
}
```

---

### Core Flows

#### Access Flow

1. User enters codes
2. Backend validates organisation
3. Create or fetch session
4. Check expiry
5. Return current task

#### Submission Flow

1. User submits prompt
2. Validate limits
3. Send to OpenAI
4. Store feedback
5. Return response

#### Progression

- Manual "Next" button
- Increment `currentTaskIndex`

---

### OpenAI Integration

- Model: `gpt-4o-mini` (configurable via `convex/constants.ts`)
- System prompt: level-aware coaching instructions, all feedback in Latvian
- User prompt: includes task title, instruction, context, expected output, and difficulty level
- Response format: JSON with five required fields
- See `convex/submitPrompt.ts` for prompt templates (`buildSystemPrompt`, `buildUserPrompt`)

#### Feedback JSON shape

```json
{
  "strengths_lv": "...",
  "weaknesses_lv": "...",
  "improvedPrompt_lv": "...",
  "explanation_lv": "...",
  "nextStep_lv": "..."
}
```

---

### Rate Limiting

```
if submissionCount >= maxSubmissionsPerUser → reject
```

---

### Expiry Logic

```
if now > expiresAt → session invalid
```

---

## Implementation

### Phase 1: Setup

- Initialize Astro project
- Setup Tailwind
- Setup Convex project
- Configure environment variables

### Phase 2: Backend Core

- Define Convex schema
- Implement session creation/validation
- Implement task retrieval
- Implement submission + storage

### Phase 3: OpenAI Integration

- Implement API wrapper in Convex
- Add structured prompt + parsing
- Add error handling

### Phase 4: Frontend

- Code entry screen
- Task screen
- Prompt input component
- Feedback display
- Loading + error states

### Phase 5: Progression & Limits

- Next task logic
- Rate limiting
- Session expiry handling

### Phase 6: Polish

- Mobile optimization
- UX simplification
- Edge case handling

---

## Milestones

1. MVP Backend Ready
2. Basic UI Functional
3. End-to-End Flow Working
4. AI Feedback Integrated
5. Workshop Pilot Ready

---

## Gathering Results

### Metrics

- Task completion rate
- Average submissions per task
- Drop-off points

### Evaluation

- Workshop facilitator feedback
- Participant usability feedback
- Quality of prompts before vs after

### Success Criteria

- Users complete majority of tasks
- Feedback is understandable and useful
- System performs reliably during workshop load
