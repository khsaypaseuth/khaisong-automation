# Khaisong Auto Video Content Automation

Admin system that turns a **Goal Prompt** into short-form vertical reels (Facebook / TikTok)
for Khaisong.com's procurement & freight forwarding service (China→Laos, Thailand→Laos).

Pipeline (built phase by phase): **GPT script → AI images → Gemini TTS → FFmpeg render →
admin approval → post**.

> **Status: Phase 6 — approval workflow.** Phases 1–5 + a review page to edit
> captions/hashtags/schedule and approve or reject videos before posting. See
> [docs/PHASE-1-PLAN.md](docs/PHASE-1-PLAN.md) and the full spec in
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

## Image generation (Phase 3)

On a **video detail page**, click **Generate images**. One image per storyboard scene
is produced by the configured image provider (`IMAGE_PROVIDER`, default OpenAI
`gpt-image-1`), with a brand-consistent style suffix and **no text in the image**
(overlays come later via FFmpeg). Images are saved under `STORAGE_PATH` and served by
the auth-guarded `/api/files/[...path]` route. Runs as a `generate-images` job (same
INLINE_JOBS / worker model as scripts).

## Voiceover (Phase 4)

On a video detail page, click **Generate voice**. The video's `voice_script` is sent to
Gemini TTS (`GEMINI_API_KEY`, `GEMINI_TTS_MODEL`); the returned PCM is wrapped into a WAV,
saved to storage, and recorded as a `VoiceAsset` — playable inline in the admin UI. Voice
selection is per-language via `GEMINI_TTS_VOICE_<LANG>` env vars. Runs as a `generate-voice`
job.

## Rendering (Phase 5)

Once a video has scene images **and** a voiceover, click **Render video**. FFmpeg
normalises each image to 1080×1920, applies a slow zoom + fade per scene, overlays the
scene text (if `FFMPEG_FONT_PATH` is set), concatenates the clips, mixes the voiceover
with optional ducked background music (`DEFAULT_BACKGROUND_MUSIC_PATH`), overlays an
optional logo (`DEFAULT_LOGO_PATH`), and exports an H.264/AAC MP4 + thumbnail. The result
plays inline and is downloadable; the video moves to **Ready for review**. The exact
ffmpeg command is saved to `api_logs` for debugging. Runs as a `render-video` job.

## Review &amp; approval (Phase 6)

The video detail page doubles as the review page. Admins can edit the Facebook/TikTok
captions, hashtags, and scheduled date/time, then **Approve** (only once rendered) or
**Reject**. Approval is also available inline on the Content Calendar. Only approved
videos may be posted (Phases 7–8).

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript — full-stack with API routes
- **PostgreSQL** + **Prisma 6**
- **Redis** + **BullMQ** (scaffolded now, used Phase 2+)
- **Tailwind 4** + **shadcn/ui** (base-ui registry)
- Auth: JWT cookie session (`jose` + `bcryptjs`), single admin role

## Prerequisites

- Node 22+, pnpm 10+
- **Docker Desktop** (for Postgres + Redis)
- **FFmpeg** on PATH (for Phase 5 rendering) — `brew install ffmpeg` / `apt install ffmpeg`

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
