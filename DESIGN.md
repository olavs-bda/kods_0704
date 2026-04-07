# Design Brief — Neighbors

**Hyperlocal Trust Network for Small Favors**

---

## What We're Building

A web app where neighbors ask for and offer small favors — "Can someone water my plants Thursday?", "Need a hand carrying this upstairs." Every completed favor builds a trust score that makes future cooperation easier.

The core insight: people trust strangers on Airbnb or Uber more than their next-door neighbor, because those platforms have trust infrastructure. We're building that for the block.

---

## Users

**Primary persona:** City dweller, 25–45, lives in an apartment or dense neighborhood. Not particularly tech-savvy. Values convenience and community but doesn't have time to organize meetups. Uses the app when they need help or happen to see something nearby they can help with.

---

## Key Screens

### 1. Sign-in

Email-only login. Clean, minimal. No social sign-in needed for MVP.

### 2. Feed (`/`)

The main screen. A list of open favor requests from nearby neighbors (within ~1km). Sorted by distance — closest first.

Each card shows:

- Request title and short description
- Approximate distance (e.g., "~200m away")
- Requester's first name and trust score
- Time posted

**CTA:** "I can help" button on each card.

Important: location is intentionally fuzzy (~100m precision). Don't show maps or pins — distance text only.

### 3. Create Request

Simple form. Two fields: title and description. User's location is already known from their profile.

After posting, they're taken back to the feed (or to the request detail).

### 4. Request Detail (`/requests/[id]`)

Shows full request info. Context-aware actions:

| Who's viewing              | What they see                   |
| -------------------------- | ------------------------------- |
| Stranger                   | "I can help" button             |
| Requester                  | "Cancel" button, status badge   |
| Accepted helper            | "Mark as complete" button, chat |
| Requester (after accepted) | "Mark as complete" button, chat |

Chat appears below the request details once a helper has been accepted. Realtime — no page refresh needed.

### 5. Profile (`/profile`)

Name, trust score (number of completed favors as a helper), and count of completed favors. Simple and factual — no gamification chrome.

---

## Visual Direction

**Tone:** Warm, grounded, neighborly. Not a startup-y SaaS tool. Not a community-board bulletin. Somewhere between a friendly note and a reliable utility.

**Avoid:**

- Gamification UI (badges, streaks, leaderboards)
- Map views (privacy concern)
- Heavy imagery or illustrations
- Notifications or alerts (not in MVP)

**Consider:**

- Muted, earthy palette — trust over excitement
- Clear status indicators for request states (open / accepted / completed / cancelled)
- Large touch targets — mobile-first layout
- Minimal chrome — content should lead

---

## Request States

```
open → accepted → completed
open → cancelled
```

Each state needs a distinct visual treatment so users always know what's happening.

---

## Constraints

- **Web only** — no native apps, but must work well on mobile browsers
- **No maps** — proximity shown as text distance only (privacy model)
- **No payments** — favors only, not a marketplace
- **No notifications** — users check in actively; no push or email alerts in MVP
- **Single helper per request** — first accepted helper wins

---

## Tech Stack (for context)

- Frontend: Astro + TailwindCSS (Vercel)
- Backend: Convex (realtime subscriptions)
- Auth: Convex Auth (email + password)

Realtime is a first-class feature — feed and chat update live without page refresh.
