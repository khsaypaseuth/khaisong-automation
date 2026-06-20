# Khaisong Auto Video Content Automation

Admin system that turns a **Goal Prompt** into short-form vertical reels (Facebook / TikTok)
for Khaisong.com's procurement & freight forwarding service (China→Laos, Thailand→Laos).

Pipeline (built phase by phase): **GPT script → AI images → Gemini TTS → FFmpeg render →
admin approval → post**.

> **Status: Phase 2 — GPT script generation.** Phase 1 foundation + OpenAI-powered
> script/caption/storyboard generation. See [docs/PHASE-1-PLAN.md](docs/PHASE-1-PLAN.md)
> and the full spec in
> [docs/khaisong-auto-video-automation-development-plan.md](docs/khaisong-auto-video-automation-development-plan.md).

## Script generation (Phase 2)

From a campaign detail page, click **Generate scripts**. The configured text provider
(OpenAI, `OPENAI_API_KEY` + `OPENAI_MODEL`) produces video plans — title, hook, voice
script, 5–8 storyboard scenes, captions, hashtags — which are saved as video posts +
storyboard scenes. Raw model output is logged to `api_logs` for debugging.

Generation runs as a background job:

- **Local dev:** set `INLINE_JOBS="true"` to run in-process (no worker/Redis needed).
- **With a worker:** leave `INLINE_JOBS` empty, run Redis, and start `pnpm worker`
  alongside `pnpm dev`. The route enqueues a BullMQ job the worker processes.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript — full-stack with API routes
- **PostgreSQL** + **Prisma 6**
- **Redis** + **BullMQ** (scaffolded now, used Phase 2+)
- **Tailwind 4** + **shadcn/ui** (base-ui registry)
- Auth: JWT cookie session (`jose` + `bcryptjs`), single admin role

## Prerequisites

- Node 22+, pnpm 10+
- **Docker Desktop** (for Postgres + Redis)

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
#   edit .env — set AUTH_SECRET (openssl rand -base64 32) and admin credentials

# 3. Start Postgres + Redis
pnpm db:up           # docker compose up -d

# 4. Create the database schema + seed an admin user and example campaign
pnpm db:migrate      # prisma migrate dev
pnpm db:seed         # prisma db seed

# 5. Run the app
pnpm dev             # http://localhost:3000
```

Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm db:up` | Start Postgres + Redis (Docker) |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Seed admin + example campaign |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm worker` | Run the BullMQ worker (no processors yet) |

## Project structure

```
prisma/                  Schema (all tables) + seed
src/
  app/
    (auth)/login         Login page
    (dashboard)/         Sidebar shell: dashboard, campaigns, calendar, settings, videos
    api/                 Route handlers (campaigns, videos, calendar, settings, auth)
                         + 501 stubs for generation/posting (later phases)
  components/            UI + feature components
  lib/                   db, auth/session, api helpers, validations, queue
  server/                Service layer (business logic, called by routes)
  providers/             Adapter seams: text, image, tts, video, social (NotImplemented stubs)
worker/                  BullMQ worker entrypoint (scaffold)
docs/                    Development plan + phase plan
```

## What works in Phase 1

- Admin login + route protection
- Campaign CRUD (goal-prompt form, auto-computed `total_posts`)
- Video post CRUD under each campaign
- Content calendar (list view)
- Settings (key/value persistence for provider keys + brand defaults)
- Dashboard stat cards

Generation and posting endpoints exist but return **501 Not Implemented** until their phase.

## Roadmap

Phase 2 GPT scripts · Phase 3 images · Phase 4 Gemini TTS · Phase 5 FFmpeg render ·
Phase 6 approval workflow · Phase 7 manual posting · Phase 8 API posting.
