# Neighbors – Hyperlocal Trust Network - Task Tracker

## Task Status Legend

- ✅ COMPLETED: Task has been fully implemented and tested
- 🚧 IN PROGRESS: Task is currently being worked on
- ⏸ PENDING: Task is planned but not started
- ⚠️ NEEDS WORK: Task has remaining implementation work

## MVP Project Requirements (4 Weeks)

### Core MVP Features

- Email authentication
- User profile with approximate home location (stored precisely, exposed coarsely)
- Create, accept, complete, and cancel favor requests
- Geo-filtered open feed sorted by proximity
- Single helper per request (race-safe accept mutation)
- Trust score derived from completed interactions
- Realtime updates via Convex subscriptions

### Technical Requirements

- **Frontend**: Astro (deployed on Vercel) with TypeScript strict mode
- **Backend**: Convex (queries, mutations, subscriptions + built-in database)
- **Auth**: Convex Auth (email + password)
- **Styling**: TailwindCSS utility classes only (no `@apply`)
- **Geo**: geolib for distance calculation and bounding box filtering
- **Validation**: Zod for all mutation inputs
- **State**: nanostores for client-side shared state
- **Privacy**: exact lat/lng stored, rounded ~100m exposed to clients

## MVP Development Roadmap (4 Weeks)

## Phase 1: Setup & Infrastructure (Week 1) ✅ COMPLETED

| ID  | Task                                 | Status       | Priority | Details                                                    |
| --- | ------------------------------------ | ------------ | -------- | ---------------------------------------------------------- |
| 1.1 | Initialize Astro project             | ✅ COMPLETED | HIGH     | Astro 6, TypeScript strict, TailwindCSS v4 via Vite plugin |
| 1.2 | Set up Convex backend                | ✅ COMPLETED | HIGH     | Schema defined, user mutations, auth config created        |
| 1.3 | Configure Vercel deployment          | ✅ COMPLETED | HIGH     | @astrojs/vercel adapter, vercel.json, server output mode   |
| 1.4 | Integrate auth (Convex Auth)         | ✅ COMPLETED | HIGH     | Convex Auth with Password provider, ConvexAuthProvider     |
| 1.5 | Install and wire core libraries      | ✅ COMPLETED | MEDIUM   | geolib, zod, nanostores, date-fns installed and wired      |
| 1.6 | Basic project documentation & README | ✅ COMPLETED | LOW      | README with setup instructions, architecture, env vars     |

## Phase 2: Core Data Models (Week 1–2) ✅ COMPLETED

| ID  | Task                                     | Status       | Priority | Details                                                                                          |
| --- | ---------------------------------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------ |
| 2.1 | Define Convex schema: users table        | ✅ COMPLETED | HIGH     | email, name, lat, lng, trustScore, createdAt; index by_email                                     |
| 2.2 | Define Convex schema: requests table     | ✅ COMPLETED | HIGH     | title, desc, requesterId, helperId, status, lat/lng, timestamps; indexes by_status, by_requester |
| 2.3 | Define Convex schema: interactions table | ✅ COMPLETED | HIGH     | requesterId, helperId, requestId, outcome, createdAt; indexes by_requester, by_helper, by_pair   |
| 2.4 | Define Convex schema: messages table     | ✅ COMPLETED | MEDIUM   | requestId, senderId, body, createdAt; index by_request                                           |
| 2.5 | User creation mutation on first auth     | ✅ COMPLETED | HIGH     | Upsert user record after first authenticated sign-in; store exact lat/lng                        |

## Phase 3: Core Request Features (Week 2) ✅ COMPLETED

| ID  | Task                                | Status       | Priority | Details                                                                         |
| --- | ----------------------------------- | ------------ | -------- | ------------------------------------------------------------------------------- |
| 3.1 | Create request mutation             | ✅ COMPLETED | HIGH     | Insert request with status=open; validate with Zod                              |
| 3.2 | Geo-filtered open feed query        | ✅ COMPLETED | HIGH     | Bounding box ~1km, filter status=open, exclude own, sort by distance via geolib |
| 3.3 | Accept request mutation (race-safe) | ✅ COMPLETED | HIGH     | Verify status=open, assign helperId, transition to accepted                     |
| 3.4 | Complete request mutation           | ✅ COMPLETED | HIGH     | Validate participants, set status=completed, set completedAt                    |
| 3.5 | Cancel request mutation             | ✅ COMPLETED | HIGH     | Only requester can cancel; transition open → cancelled                          |

## Phase 4: Trust System (Week 2–3) ✅ COMPLETED

| ID  | Task                              | Status       | Priority | Details                                                                |
| --- | --------------------------------- | ------------ | -------- | ---------------------------------------------------------------------- |
| 4.1 | Interaction logging on completion | ✅ COMPLETED | HIGH     | Insert interaction record (outcome=completed) inside complete mutation |
| 4.2 | Increment helper trustScore       | ✅ COMPLETED | HIGH     | Atomic increment on users.trustScore when interaction is logged        |
| 4.3 | Expose trustScore on user profile | ✅ COMPLETED | MEDIUM   | Query to fetch public user profile with trust score                    |

## Phase 5: Chat System (Week 3) ⏸ PENDING

| ID  | Task                       | Status    | Priority | Details                                                       |
| --- | -------------------------- | --------- | -------- | ------------------------------------------------------------- |
| 5.1 | Send message mutation      | ⏸ PENDING | MEDIUM   | Validate sender is requester or helper; append to messages    |
| 5.2 | Realtime messages query    | ⏸ PENDING | MEDIUM   | Convex subscription scoped to requestId; ordered by createdAt |
| 5.3 | Access control enforcement | ⏸ PENDING | MEDIUM   | Only requester + accepted helper can read/write chat          |

## Phase 6: Privacy Layer (Week 3) ⏸ PENDING

| ID  | Task                                       | Status    | Priority | Details                                                          |
| --- | ------------------------------------------ | --------- | -------- | ---------------------------------------------------------------- |
| 6.1 | Coordinate rounding utility                | ⏸ PENDING | HIGH     | Round lat/lng to ~100m precision before returning to client      |
| 6.2 | Apply rounding in feed and request queries | ⏸ PENDING | HIGH     | All client-facing queries strip exact coords, return rounded     |
| 6.3 | Verify exact coords never leak             | ⏸ PENDING | HIGH     | Audit all public query `returns` validators for lat/lng exposure |

## Phase 7: UI (Week 3–4) ⏸ PENDING

| ID  | Task                                   | Status    | Priority | Details                                                     |
| --- | -------------------------------------- | --------- | -------- | ----------------------------------------------------------- |
| 7.1 | Feed page (`/`)                        | ⏸ PENDING | HIGH     | List nearby open requests, realtime via Convex subscription |
| 7.2 | Request creation form                  | ⏸ PENDING | HIGH     | Title + description fields, submits create mutation         |
| 7.3 | Request detail page (`/requests/[id]`) | ⏸ PENDING | HIGH     | Show request info, accept / complete / cancel actions       |
| 7.4 | Chat interface on request detail       | ⏸ PENDING | MEDIUM   | Realtime message list + send input; shown after accepted    |
| 7.5 | User profile page (`/profile`)         | ⏸ PENDING | MEDIUM   | Display name, completed favors count, trust score           |
| 7.6 | Auth flow pages (sign-in)              | ⏸ PENDING | HIGH     | Sign-in page and redirect flow after authentication         |

## Phase 8: Testing & Polish (Week 4) ⏸ PENDING

| ID  | Task                                   | Status    | Priority | Details                                                           |
| --- | -------------------------------------- | --------- | -------- | ----------------------------------------------------------------- |
| 8.1 | End-to-end request lifecycle testing   | ⏸ PENDING | HIGH     | Create → accept → complete flow verified; trust score increments  |
| 8.2 | Race condition test on accept mutation | ⏸ PENDING | HIGH     | Concurrent accept calls on same request; only one succeeds        |
| 8.3 | Privacy audit                          | ⏸ PENDING | HIGH     | Confirm exact coords never exposed in any client response         |
| 8.4 | Auth edge cases                        | ⏸ PENDING | HIGH     | Expired sessions and unauthenticated access to protected routes   |
| 8.5 | Geo filtering accuracy check           | ⏸ PENDING | MEDIUM   | Verify bounding box + geolib distance sort returns correct radius |
| 8.6 | UI/UX polish and responsive layout     | ⏸ PENDING | MEDIUM   | Mobile-friendly feed and request detail pages                     |
| 8.7 | Production deployment to Vercel        | ⏸ PENDING | HIGH     | Environment vars set, Convex prod deployment, smoke test live URL |

---

## 🏗️ Architecture Reference

### Request Lifecycle

```
open → accepted → completed
open → cancelled
```

### Feed Query Algorithm

1. Bounding box filter (~1km radius from user location)
2. Filter `status = "open"`
3. Exclude requests where `requesterId = currentUser._id`
4. Sort ascending by distance (geolib)

### Privacy Model

- **Stored**: exact `lat` / `lng` (full precision)
- **Exposed**: rounded to ~100m (`Math.round(coord * 1000) / 1000`)

### Trust Score Algorithm

- `trustScore` increments by 1 for each `completed` interaction where user is `helperId`
- Updated atomically inside the `completeRequest` mutation

### Key Convex Conventions

- All functions must include `returns` validator (`v.null()` for void)
- Use `.withIndex()` — never `.filter()` for indexed fields
- Public mutations: `mutation`; server-only: `internalMutation`
- Indexes named after fields: `by_status_and_requesterId`
