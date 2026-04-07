# Neighbors

Hyperlocal "small favors network" — neighbors request and fulfill help through an open feed with a dynamic trust graph.

## Tech Stack

- **Frontend**: Astro 6 (deployed on Vercel)
- **Backend**: Convex (realtime subscriptions, mutations, queries + built-in database)
- **Auth**: Convex Auth (email + password)
- **Styling**: TailwindCSS v4
- **Language**: TypeScript (strict mode)
- **Libraries**: geolib, zod, nanostores, date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- Convex account ([convex.dev](https://convex.dev))

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start Convex dev backend (first run will prompt login + project creation)
npx convex dev

# In a separate terminal, start Astro dev server
npx astro dev
```

### Environment Variables

| Variable          | Description           |
| ----------------- | --------------------- |
| `PUBLIC_CONVEX_URL` | Convex deployment URL |

### Project Structure

```
src/
  pages/          # Astro pages
  layouts/        # Astro layouts
  components/     # React + Astro components
  lib/            # Shared utilities
  styles/         # Global CSS (Tailwind)
convex/
  schema.ts       # Database schema
  users.ts        # User queries & mutations
  auth.config.ts  # Convex Auth config
  auth.ts         # Auth providers (Password)
  http.ts         # HTTP routes for auth
public/           # Static assets
```

### Commands

```bash
npm run dev       # Start Astro dev server
npx convex dev    # Start Convex dev backend
npm run build     # Production build
npm run preview   # Preview production build
```
