# Phase 1 — Foundation (Implementation Plan)

**Goal:** A working, AI-free skeleton. Admin can log in, CRUD campaigns and video posts, view a content calendar, and see a settings page. No OpenAI / Gemini / image / FFmpeg calls yet. The data model, UI shell, and provider-adapter seams are built so Phases 2–8 plug in cleanly.

**Stack decisions (confirmed):** Next.js (App Router) full-stack with API routes · Postgres + Prisma · Redis + BullMQ (installed now, used Phase 2+) · Docker Compose for Postgres/Redis · Tailwind + shadcn/ui · TypeScript.

---

## Prerequisites (before coding)
- [ ] Install Docker Desktop (CLI not currently on PATH) — needed for Postgres + Redis containers.
- [ ] Confirm GitHub repo `khsaypaseuth/khaisong-automation` will be the remote (currently no local git repo).
- Node 22 / pnpm 10 already present ✅.

---

## Deliverables
1. `git init` + Next.js app scaffold (App Router, TS, Tailwind, ESLint).
2. shadcn/ui set up with base components (button, input, table, dialog, card, badge, select, form, toast).
3. `docker-compose.yml` for Postgres 16 + Redis 7.
4. Prisma schema for **all** plan tables (so later phases don't migrate-churn) + initial migration + seed.
5. Auth: single admin (credentials via NextAuth or lightweight session) — login page, protected dashboard.
6. App shell: sidebar layout, dashboard page with stat cards (counts from DB).
7. Campaign CRUD: list, create (full goal-prompt form), detail, edit, delete. `total_posts = posts_per_day × number_of_days`.
8. Video post CRUD (manual create + listing under a campaign).
9. Content calendar: list view (calendar view deferred to a later polish pass).
10. Settings page: form persisting key/value rows (API keys stored but unused this phase).
11. Provider-adapter interfaces stubbed (`ImageGenerationProvider`, `TTSProvider`, etc.) with `NotImplemented` stubs so the seams exist.
12. README with setup/run instructions.

---

## Proposed structure
```
khaisong-automation/
  docker-compose.yml
  .env / .env.example
  prisma/
    schema.prisma
    seed.ts
  src/
    app/
      (auth)/login/page.tsx
      (dashboard)/
        layout.tsx                 # sidebar shell
        page.tsx                   # dashboard stats
        campaigns/
          page.tsx                 # list
          new/page.tsx             # create form
          [id]/page.tsx            # detail
          [id]/edit/page.tsx
        calendar/page.tsx          # list view
        settings/page.tsx
      api/
        campaigns/route.ts             # GET, POST
        campaigns/[id]/route.ts        # GET, PATCH, DELETE
        campaigns/[id]/videos/route.ts
        videos/[id]/route.ts
        calendar/route.ts
        settings/route.ts
    components/ui/...              # shadcn
    components/...                 # app components
    lib/
      db.ts                        # prisma client singleton
      auth.ts
      queue.ts                     # BullMQ connection (defined, unused this phase)
      validations/                 # zod schemas
    server/
      campaigns/service.ts         # business logic, called by routes
      videos/service.ts
    providers/                     # ADAPTER SEAMS (stubs in Phase 1)
      image/ImageGenerationProvider.ts
      tts/TTSProvider.ts
      text/TextProvider.ts
      video/VideoRenderer.ts
      social/SocialPoster.ts
  worker/                          # BullMQ worker entrypoint (scaffold only)
```

---

## Database (Prisma) — Phase 1 scope
Model the full plan schema now, even though only `users`, `campaigns`, `video_posts`, `storyboard_scenes`, and `settings` get UI this phase. Tables: `users`, `campaigns`, `video_posts`, `storyboard_scenes`, `voice_assets`, `video_assets`, `api_logs`, `posting_logs`, `settings`.

- Use enums for `campaign.status`, `video_post.status`, `approval_status`, `platform` instead of free-text strings.
- `platforms` / `target_platforms` / `hashtags` as `String[]` or JSON.
- `total_posts` computed in service layer on create/update.
- Seed: one admin user + one example campaign (the Khaisong China→Laos example) with a couple of draft video posts so the UI isn't empty.

---

## API routes (Phase 1 subset)
Wired to a service layer (not Prisma-in-route), validated with zod:
```
POST   /api/campaigns
GET    /api/campaigns
GET    /api/campaigns/:id
PATCH  /api/campaigns/:id
DELETE /api/campaigns/:id
GET    /api/campaigns/:id/videos
POST   /api/campaigns/:id/videos
GET    /api/videos/:id
PATCH  /api/videos/:id
GET    /api/calendar
GET/PATCH /api/settings
```
Generation/posting routes (`/generate-scripts`, `/render`, `/post/*`) are **declared as stubs returning 501** so the contract exists for Phase 2+.

---

## Out of scope for Phase 1 (deferred, by design)
- Any AI/API calls (OpenAI, Gemini TTS, image provider).
- FFmpeg rendering, file storage tree, audio/video playback.
- BullMQ job *logic* (connection scaffolded; jobs added Phase 2).
- Facebook/TikTok posting.
- Calendar grid view, multi-user roles, i18n.

---

## Build order (commits)
1. Repo init, Next.js scaffold, Tailwind, ESLint/Prettier.
2. docker-compose (Postgres+Redis), `.env.example`, prisma init + full schema + migration.
3. Prisma client singleton, seed script, verify migration applies.
4. shadcn/ui init + base components, dashboard layout shell + sidebar.
5. Auth (login + route protection) + admin seed user.
6. Campaign service + API routes + zod validation.
7. Campaign UI: list, create form, detail, edit, delete.
8. Video post service/routes + UI under campaign detail.
9. Calendar list page + `/api/calendar`.
10. Settings page + `/api/settings` (key/value persistence).
11. Provider adapter interfaces + NotImplemented stubs + 501 generation routes.
12. README, `.env.example` finalization, manual smoke test.

---

## Phase 1 acceptance criteria
- `docker compose up` + `pnpm prisma migrate dev` + `pnpm dev` brings the app up cleanly.
- Admin can log in and is gated from the dashboard when logged out.
- Admin can create a campaign via the goal-prompt form; `total_posts` is computed; it appears in the list and detail.
- Admin can edit and delete a campaign, and add/list video posts under it.
- Calendar list shows seeded/created posts with date, platform, status, title.
- Settings page saves and reloads key/value entries.
- Adapter interfaces and 501 generation routes exist and typecheck.
- `pnpm build` and `pnpm typecheck` pass.
