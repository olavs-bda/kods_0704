# Prompt Workshop Coach

Workshop-scoped web app for structured prompt-writing exercises with real-time AI feedback in Latvian. No user accounts — access via Organisation Code + Participant Code.

## Tech Stack

- **Frontend**: Astro 6 (deployed on Vercel)
- **Backend**: Convex (queries, mutations, actions + built-in database)
- **AI**: OpenAI API via Convex actions
- **Styling**: TailwindCSS v4
- **Language**: TypeScript (strict mode)
- **Libraries**: zod, nanostores, date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- Convex account ([convex.dev](https://convex.dev))
- OpenAI API key

### Setup

```bash
# Install dependencies
npm install

# Start Convex dev backend (first run will prompt login + project creation)
npx convex dev

# Set OpenAI API key in Convex environment
npx convex env set OPENAI_API_KEY <your-key>

# In a separate terminal, start Astro dev server
npx astro dev
```

### Environment Variables

| Variable            | Where        | Description           |
| ------------------- | ------------ | --------------------- |
| `PUBLIC_CONVEX_URL` | `.env.local` | Convex deployment URL |
| `OPENAI_API_KEY`    | Convex env   | OpenAI API key        |

### Project Structure

```
src/
  pages/          # Astro pages
  layouts/        # Astro layouts
  components/     # React + Astro components
  lib/            # Shared utilities
  styles/         # Global CSS (Tailwind)
convex/
  schema.ts       # Database schema (organisations, sessions, taskSets, submissions)
public/           # Static assets
```

### Seed Data

After starting the Convex backend, seed the database with test organisations and tasks:

```bash
npx convex run --no-push seed:seedData
```

This creates:

- **1 organisation**: `BDA-2026`
- **6 tasks**: prompt engineering exercises (2 per level, levels 1–3)
- **Settings**: 48h session expiry, 50 submissions/user

### Commands

```bash
npm run dev       # Start Astro dev server
npx convex dev    # Start Convex dev backend
npm run build     # Production build
npm run preview   # Preview production build
```

### Architecture

```
User enters codes → Validate Org → Create/Resume Session → Get Current Task
Submit Prompt → Check Rate Limit → OpenAI (GPT-4o-mini) → Store Feedback → Display
Task 1 (Level 1) → Task 2 (Level 1) → ... → Task 6 (Level 3) → Done
```

All AI calls go through Convex actions — API keys never reach the client.
