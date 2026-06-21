# Testing Guide

Test the pipeline in **layers** — get each layer working before adding the next. Cheapest
and most self-contained first; external/paid APIs last.

> **Never paste API keys into chat or commit them.** Put them in `.env` (gitignored) or the
> in-app **Settings** page. When something fails, share the **error text** from the terminal
> or the **Activity Log** page — not your keys.

| Layer | Feature | Needs | Notes |
|---|---|---|---|
| 1 | Login, CRUD, calendar | Docker | free |
| 2 | Script generation | OpenAI key | ~cents per campaign |
| 3 | Image generation | OpenAI key | **most expensive** (~6 images × videos) |
| 4 | Voice (TTS) | Gemini key | free tier available |
| 5 | Render MP4 | FFmpeg installed | free, local |
| 6–7 | Review / approve / manual post | nothing new | free |
| 8 | API posting (FB/TikTok) | platform apps | needs app approval |

---

## Step 0 — Install prerequisites

```bash
# Docker Desktop — runs Postgres + Redis. Download, install, and LAUNCH it:
#   https://www.docker.com/products/docker-desktop
# FFmpeg — Phase 5 rendering:
brew install ffmpeg
```

Verify:
```bash
docker --version
ffmpeg -version | head -1
```

## Step 1 — Bring up the stack (Layer 1, no keys)

```bash
cd /Users/khamphone/Documents/CodingProject/Projects/khaisong-automation
cp -n .env.example .env          # if you don't already have .env
#   ensure .env has: AUTH_SECRET set, INLINE_JOBS="true"
pnpm install
pnpm db:up                       # Postgres + Redis (Docker must be running)
pnpm db:migrate                  # first run creates the initial migration
pnpm db:seed                     # admin user + example campaign
pnpm dev                         # http://localhost:3000
```

Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`
(defaults: `admin@khaisong.com` / `changeme123`).

**Check setup any time** — visit while logged in:
```
http://localhost:3000/api/health
```
It reports DB / Redis / FFmpeg reachability and which providers are configured.

**Layer 1 passes when:** you can log in, create/edit/delete a campaign, add video posts,
and see the calendar. No keys required.

## Step 2 — Configure AI keys (Layers 2–4)

Add keys in the **Settings** page (preferred) or `.env`:

- **OpenAI** (scripts + images): https://platform.openai.com/api-keys — needs billing.
  - Models live in `.env`: `OPENAI_MODEL=gpt-5-mini`, `IMAGE_PROVIDER_MODEL=gpt-image-1`.
    If a model id errors, change it here.
- **Gemini** (voice): https://aistudio.google.com/apikey — free tier.
  - Model in `.env`: `GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts`.

Keep `INLINE_JOBS="true"` so jobs run in-process (no separate worker needed).

## Step 3 — Run the pipeline

1. Open the seeded campaign → **Generate scripts** (Layer 2). Wait for status
   `Scripts Generated`; video posts appear with titles/captions/storyboards.
2. Open a video → **Generate images** (3) → **Generate voice** (4) → **Render video** (5).
   - Shortcut: **Generate all assets** on the campaign runs images→voice→render for every
     video. **Regenerate all** on a video re-runs its pipeline.
3. **Review:** edit captions/schedule → **Approve** → **Download MP4** / **Copy caption** /
   **Mark posted** (Layers 6–7).
4. If a step fails, open **Activity Log** — provider, status, and the exact error (render
   shows the full ffmpeg stderr).

## Step 4 — API posting (Layer 8, last)

Hardest layer — platforms gate posting behind app review.

- **Facebook**: Meta app + Page; Page access token with `pages_manage_posts` +
  `pages_read_engagement`. Set `FACEBOOK_PAGE_ID`, `FACEBOOK_ACCESS_TOKEN`.
- **TikTok**: developer app with `video.publish` scope (must pass audit). Set
  `TIKTOK_ACCESS_TOKEN`; keep `TIKTOK_PRIVACY_LEVEL=SELF_ONLY`.
- Verify a **single manual "Post via API"** works before setting `AUTO_POST_ENABLED="true"`.
- Auto-post scheduler runs only with `pnpm worker` (not in INLINE_JOBS mode).

---

## Running with a worker instead of inline

For background jobs / the auto-post scheduler:
```bash
# .env: leave INLINE_JOBS empty
pnpm dev          # terminal 1
pnpm worker       # terminal 2 (needs Redis up)
```

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `/api/health` DB not ok | Docker not running, or `pnpm db:up` / `pnpm db:migrate` not run |
| `pnpm db:migrate` connection refused | Postgres container not up — `pnpm db:up`, check Docker Desktop |
| 503 "… not configured" on generate | Key missing — add in Settings or `.env`; check `/api/health` |
| Script gen fails with model error | `OPENAI_MODEL` id invalid for your account — change it |
| Image gen 403 / model not found | `gpt-image-1` not enabled — verify org access or change model |
| Render 503 "FFmpeg not installed" | `brew install ffmpeg`, or set `FFMPEG_PATH` |
| Render fails, no overlay text | Set `FFMPEG_FONT_PATH` to a `.ttf` (Lao/Thai: Noto Sans Lao) |
| Render fails in filtergraph | Copy the ffmpeg stderr from Activity Log and share it |
| Images/video don't display | They're served by `/api/files/...` (auth-guarded) — must be logged in |
| Redis errors but jobs still run | Expected in `INLINE_JOBS="true"` mode — Redis is optional then |

When asking for help, include: the **error text** + **which step**. Never the keys.
