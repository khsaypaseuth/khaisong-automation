# Khaisong Auto Video Content Automation - Development Plan Prompt

## Project Name
Khaisong Auto Video Content Automation

## Business Context
Khaisong.com is a procurement and freight forwarding service helping customers source products and ship goods from:
- China to Laos
- Thailand to Laos

The system will help Khaisong create daily short-form video posts for Facebook and TikTok.

## Main Goal
Build an automation system where the admin enters a **Goal Prompt**, for example:

> Create 2 posts per day for 3 days to promote Khaisong procurement and freight forwarding from China to Laos. Focus on trust, convenience, sourcing support, warehouse service, customs support, and delivery to Laos.

The system will generate:
- Video voice scripts
- Storyboard image prompts
- Captions for Facebook and TikTok
- AI images using Nano Banana / image generation provider
- AI voice using Gemini TTS
- Final MP4 reel videos using FFmpeg
- Content calendar records
- Approval workflow before posting
- Optional auto-post to Facebook and TikTok after approval

---

# Recommended MVP Approach

Do not start with full AI video generation first.

Start with **image-based short reels**:
- 5 to 8 AI images per video
- Voiceover
- Background music
- Text overlay
- Simple motion effects such as zoom in, pan, fade
- 9:16 vertical video format
- 30 to 60 seconds

This is easier, cheaper, and more consistent for Khaisong marketing.

---

# Core Workflow

```text
Goal Prompt
     ↓
GPT-5 Mini
     ↓
Generate:
- 6 scripts
- 6 captions
- 6 storyboard prompts
     ↓
Nano Banana / Image Generation Provider
     ↓
Generate 5-8 images per video
     ↓
Gemini TTS
     ↓
Generate voice
     ↓
FFmpeg
     ↓
Create MP4 Reel
     ↓
Save to Content Calendar
     ↓
Admin Review / Approve
     ↓
Post to Facebook / TikTok
```

---

# Technology Stack

## Frontend
Use:
- Next.js
- React
- Tailwind CSS
- Shadcn UI

## Backend
Use:
- Node.js
- Next.js API routes or NestJS
- TypeScript

## Database
Use:
- PostgreSQL
- Prisma ORM

## Background Jobs
Use:
- BullMQ
- Redis

## File Processing
Use:
- FFmpeg

## AI Services
Use:
- OpenAI API for GPT-5 Mini script generation
- Google Gemini TTS for voice generation
- Nano Banana / Magnific / selected image generation provider for storyboard images

## Posting APIs
Phase 1:
- Manual download and upload

Phase 2:
- Meta Graph API for Facebook Page posting
- TikTok Content Posting API for TikTok posting

---

# Main System Modules

## 1. Admin Dashboard

Create an admin dashboard with these pages:

### Dashboard Page
Show:
- Total campaigns
- Total videos generated
- Pending approvals
- Approved posts
- Failed jobs
- Scheduled posts

### Campaigns Page
Admin can:
- Create new campaign
- Enter goal prompt
- Select number of posts per day
- Select number of days
- Select language
- Select tone
- Select target audience
- Select platform: Facebook, TikTok, or both
- Select auto-generate or draft only

### Campaign Detail Page
Show:
- Campaign goal
- Generated video ideas
- Script status
- Image generation status
- Voice generation status
- Video rendering status
- Approval status
- Scheduled posting status

### Content Calendar Page
Show:
- Calendar view
- List view
- Date
- Time
- Platform
- Video title
- Status
- Caption
- Preview video
- Approve button
- Reject button
- Regenerate button

### Video Review Page
Admin can:
- Watch video
- Read script
- View storyboard prompts
- View generated images
- Listen to voice
- Edit caption
- Edit hashtags
- Approve video
- Reject video
- Regenerate voice
- Regenerate images
- Regenerate final video

### Settings Page
Admin can configure:
- OpenAI API key
- Gemini API key
- Image generation provider API key
- Facebook Page ID
- Facebook access token
- TikTok API settings
- Default brand colors
- Default logo
- Default background music
- Default output language
- Default posting schedule

---

# User Roles

Start with one admin role.

Future roles:
- Admin
- Content reviewer
- Marketing staff

---

# Database Design

Use Prisma with PostgreSQL.

## Tables

### users
Fields:
- id
- name
- email
- password_hash
- role
- created_at
- updated_at

### campaigns
Fields:
- id
- title
- goal_prompt
- posts_per_day
- number_of_days
- total_posts
- language
- tone
- target_audience
- platforms
- status
- created_by
- created_at
- updated_at

Status examples:
- draft
- generating_scripts
- scripts_generated
- generating_assets
- rendering_videos
- ready_for_review
- approved
- completed
- failed

### video_posts
Fields:
- id
- campaign_id
- title
- hook
- script_text
- voice_script
- caption_facebook
- caption_tiktok
- hashtags
- target_platforms
- scheduled_date
- scheduled_time
- status
- approval_status
- video_url
- thumbnail_url
- created_at
- updated_at

Status examples:
- draft
- script_generated
- images_generated
- voice_generated
- video_rendered
- ready_for_review
- approved
- scheduled
- posted
- failed

Approval status:
- pending
- approved
- rejected

### storyboard_scenes
Fields:
- id
- video_post_id
- scene_number
- scene_title
- scene_description
- image_prompt
- overlay_text
- duration_seconds
- image_url
- created_at
- updated_at

### voice_assets
Fields:
- id
- video_post_id
- provider
- voice_name
- script_text
- audio_url
- duration_seconds
- status
- created_at

### video_assets
Fields:
- id
- video_post_id
- video_url
- format
- resolution
- duration_seconds
- file_size
- status
- created_at

### api_logs
Fields:
- id
- provider
- endpoint
- request_payload
- response_payload
- status
- error_message
- created_at

### posting_logs
Fields:
- id
- video_post_id
- platform
- platform_post_id
- status
- error_message
- posted_at
- created_at

### settings
Fields:
- id
- key
- value
- created_at
- updated_at

---

# Campaign Generation Logic

When admin submits a campaign goal:

Input:
- goal_prompt
- posts_per_day
- number_of_days
- language
- tone
- target_audience
- platforms

Calculate:
```text
total_posts = posts_per_day * number_of_days
```

Example:
```text
2 posts per day x 3 days = 6 video posts
```

Then call GPT-5 Mini to generate structured JSON.

---

# GPT-5 Mini Prompt Template

Use this prompt in the backend:

```text
You are a short-form video marketing strategist for Khaisong.com.

Business:
Khaisong is a procurement and freight forwarding service helping customers source products and ship goods from China to Laos and Thailand to Laos.

Create {{total_posts}} short-form video post plans based on this campaign goal:

{{goal_prompt}}

Requirements:
- Each video should be suitable for Facebook Reels and TikTok.
- Video duration: 30 to 60 seconds.
- Language: {{language}}
- Tone: {{tone}}
- Target audience: {{target_audience}}
- Each video must include:
  1. title
  2. hook
  3. voice_script
  4. 5 to 8 storyboard scenes
  5. image prompt for each scene
  6. overlay text for each scene
  7. Facebook caption
  8. TikTok caption
  9. hashtags
  10. suggested posting date and time

Style:
- Clear and simple language
- Business-focused
- Trustworthy
- Helpful
- No exaggerated claims
- No fake guarantees
- Avoid saying impossible promises such as "cheapest in Laos" unless provided by admin
- Focus on practical customer problems and solutions

Return valid JSON only.
```

Expected JSON structure:

```json
{
  "campaign_title": "string",
  "videos": [
    {
      "title": "string",
      "hook": "string",
      "voice_script": "string",
      "storyboard": [
        {
          "scene_number": 1,
          "scene_title": "string",
          "scene_description": "string",
          "image_prompt": "string",
          "overlay_text": "string",
          "duration_seconds": 5
        }
      ],
      "caption_facebook": "string",
      "caption_tiktok": "string",
      "hashtags": ["string"],
      "suggested_posting_datetime": "YYYY-MM-DD HH:mm"
    }
  ]
}
```

---

# Image Generation Logic

For each video:
- Read all storyboard scenes
- Send each `image_prompt` to Nano Banana / Magnific / selected image generation provider
- Save returned image file
- Attach image URL to `storyboard_scenes.image_url`

## Image Prompt Style

Each image prompt should request:

```text
Vertical 9:16 social media image, realistic logistics business style, Southeast Asia, China-Laos freight forwarding, professional warehouse, delivery truck, friendly staff, clean modern look, no text, no watermark, no logo unless provided, high detail.
```

Important:
- Do not generate text inside images.
- Text should be added later as overlay using FFmpeg.
- Keep Khaisong brand consistency.
- Use similar visual style across all scenes.

---

# TTS Voice Generation Logic

For each video:
- Send `voice_script` to Gemini TTS
- Select Lao, Thai, Chinese, or English voice depending on campaign language
- Save audio file as MP3 or WAV
- Store audio URL in `voice_assets`

Recommended languages:
- Lao for Lao customers
- Thai for Thai customers
- Chinese for supplier-facing content
- English for general international business content

---

# FFmpeg Video Rendering Logic

For each video:
1. Take 5 to 8 generated images
2. Add motion:
   - slow zoom in
   - pan left/right
   - fade transition
3. Add text overlay per scene
4. Add voiceover
5. Add background music quietly
6. Add Khaisong logo watermark
7. Export as MP4 vertical reel

Output settings:
- Resolution: 1080x1920
- Aspect ratio: 9:16
- Format: MP4
- Codec: H.264
- Audio: AAC
- Duration: 30 to 60 seconds

Suggested FFmpeg steps:
- Normalize all images to 1080x1920
- Create scene clips from images
- Add overlay text
- Concatenate scene clips
- Mix voice audio and background music
- Add logo overlay
- Export final MP4

---

# Content Calendar Logic

After video is rendered:
- Create content calendar entry
- Set status to `ready_for_review`
- Admin reviews video
- Admin can approve, reject, regenerate, or edit caption

Only approved videos can be posted.

---

# Posting Logic

## Phase 1: Manual Posting
For MVP:
- Admin downloads final MP4
- Admin copies caption
- Admin posts manually to Facebook and TikTok

This avoids API complexity at the beginning.

## Phase 2: Semi-Automatic Posting
- Admin clicks "Post to Facebook"
- Admin clicks "Post to TikTok"
- System posts using APIs

## Phase 3: Fully Automatic Posting
- Approved posts are automatically posted at scheduled time
- System records post ID and post URL
- Failed posts are logged and retried

---

# Background Job Queue

Use BullMQ with Redis.

Create these jobs:

## generateCampaignScriptsJob
Input:
- campaign_id

Steps:
- Load campaign
- Call GPT-5 Mini
- Parse JSON
- Create video_posts
- Create storyboard_scenes

## generateImagesJob
Input:
- video_post_id

Steps:
- Load storyboard scenes
- Generate image for each scene
- Save image
- Update scene records

## generateVoiceJob
Input:
- video_post_id

Steps:
- Load voice_script
- Call Gemini TTS
- Save audio
- Update voice_assets

## renderVideoJob
Input:
- video_post_id

Steps:
- Load images
- Load voice
- Load music
- Run FFmpeg
- Save MP4
- Update video_post status

## postToSocialJob
Input:
- video_post_id
- platform

Steps:
- Check approval status
- Post to platform
- Save posting log

---

# File Storage

For MVP:
Use local storage on VPS:

```text
/storage
  /campaigns
    /campaign-id
      /video-post-id
        /images
        /audio
        /video
        /thumbnail
```

Future:
Move to S3-compatible storage.

---

# Environment Variables

Create `.env`:

```env
DATABASE_URL=
REDIS_URL=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini

GEMINI_API_KEY=
GEMINI_TTS_MODEL=
GEMINI_TTS_VOICE_LAO=
GEMINI_TTS_VOICE_THAI=
GEMINI_TTS_VOICE_ENGLISH=
GEMINI_TTS_VOICE_CHINESE=

IMAGE_PROVIDER=
IMAGE_PROVIDER_API_KEY=
IMAGE_PROVIDER_BASE_URL=

FACEBOOK_PAGE_ID=
FACEBOOK_ACCESS_TOKEN=

TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_ACCESS_TOKEN=
TIKTOK_REFRESH_TOKEN=

APP_BASE_URL=
STORAGE_PATH=/storage
DEFAULT_BACKGROUND_MUSIC_PATH=
DEFAULT_LOGO_PATH=
```

---

# API Routes

Create these backend routes:

## Campaigns
```text
POST /api/campaigns
GET /api/campaigns
GET /api/campaigns/:id
PATCH /api/campaigns/:id
DELETE /api/campaigns/:id
```

## Generation
```text
POST /api/campaigns/:id/generate-scripts
POST /api/videos/:id/generate-images
POST /api/videos/:id/generate-voice
POST /api/videos/:id/render
POST /api/videos/:id/regenerate
```

## Review
```text
GET /api/videos/:id
PATCH /api/videos/:id/script
PATCH /api/videos/:id/captions
POST /api/videos/:id/approve
POST /api/videos/:id/reject
```

## Calendar
```text
GET /api/calendar
PATCH /api/calendar/:videoPostId/schedule
```

## Posting
```text
POST /api/videos/:id/post/facebook
POST /api/videos/:id/post/tiktok
```

## Settings
```text
GET /api/settings
PATCH /api/settings
```

---

# Suggested Development Phases

## Phase 1 - Foundation
Build:
- Next.js app
- PostgreSQL + Prisma
- Login
- Admin dashboard layout
- Campaign CRUD
- Video post CRUD
- Content calendar basic list

Do not connect AI yet.

## Phase 2 - GPT Script Generation
Build:
- OpenAI API integration
- Campaign goal prompt form
- Generate scripts and captions
- Save generated JSON to database
- Show generated video post plans in UI

## Phase 3 - Image Generation
Build:
- Image provider adapter
- Generate image per storyboard scene
- Save images
- Show storyboard gallery

Create provider interface:

```ts
interface ImageGenerationProvider {
  generateImage(prompt: string, options: ImageGenerationOptions): Promise<ImageGenerationResult>
}
```

This allows switching between Nano Banana, Magnific, or another provider later.

## Phase 4 - Gemini TTS
Build:
- Gemini TTS adapter
- Generate voice audio from script
- Save audio file
- Play audio in admin UI

Create provider interface:

```ts
interface TTSProvider {
  generateSpeech(text: string, options: TTSOptions): Promise<TTSResult>
}
```

## Phase 5 - FFmpeg Video Renderer
Build:
- FFmpeg rendering pipeline
- Image to video
- Add voiceover
- Add background music
- Add text overlay
- Add logo
- Export 1080x1920 MP4
- Preview video in UI

## Phase 6 - Approval Workflow
Build:
- Review page
- Approve button
- Reject button
- Regenerate button
- Edit captions
- Edit schedule

## Phase 7 - Manual Posting MVP
Build:
- Download MP4 button
- Copy Facebook caption button
- Copy TikTok caption button
- Mark as posted manually

## Phase 8 - API Posting
Build later:
- Facebook posting API
- TikTok posting API
- Scheduled automatic posting
- Retry failed posting jobs

---

# Important Development Rules

## Keep API Providers Swappable
Do not hard-code image generation provider.

Use adapters:
- OpenAITextProvider
- GeminiTTSProvider
- NanoBananaImageProvider
- FFmpegVideoRenderer
- FacebookPoster
- TikTokPoster

## Always Save Intermediate Outputs
Save:
- GPT raw JSON
- Parsed script
- Image prompts
- Generated images
- TTS audio
- FFmpeg command logs
- Final MP4
- API errors

This makes debugging easier.

## Never Auto-Post Without Approval in MVP
The first version must require admin approval before posting.

## Generate No Text Inside Images
All text should be overlayed with FFmpeg to avoid broken AI text.

## Brand Consistency
Use:
- Khaisong logo
- Consistent colors
- Consistent font
- Consistent intro/outro
- Professional freight forwarding visuals

---

# Example Khaisong Campaign Prompt

```text
Create 2 posts per day for 3 days for Khaisong.com.

Goal:
Promote Khaisong as a trusted procurement and freight forwarding service from China to Laos and Thailand to Laos.

Audience:
Lao business owners, online sellers, shop owners, and SMEs who want to buy goods from China or Thailand but do not know how to source, ship, or clear goods.

Tone:
Helpful, trustworthy, simple, professional.

Language:
Lao.

Main messages:
- We help source products
- We help contact suppliers
- We help arrange warehouse and shipping
- We help ship from China to Laos
- We help ship from Thailand to Laos
- We support customers from order to delivery
- Contact us for quotation
```

---

# Example Generated Video Topics

1. How Khaisong helps you buy products from China
2. Common mistakes when importing from China
3. Why use a freight forwarder from China to Laos
4. Thailand to Laos delivery made easier
5. How Khaisong supports online sellers
6. From supplier to your shop in Laos

---

# MVP Success Criteria

The MVP is successful when:

- Admin can create one campaign goal
- System generates 6 video plans
- Each video has script, caption, and storyboard
- System generates images for each video
- System generates voice for each video
- System renders MP4 vertical reel
- Admin can approve video
- Admin can download video and copy caption
- Admin can use the videos for Facebook and TikTok

---

# Future Improvements

After MVP:
- Auto-post to Facebook Page
- Auto-post to TikTok
- Add WhatsApp/LINE lead capture links in captions
- Add analytics dashboard
- Add A/B testing for captions
- Add multiple languages per campaign
- Add product-specific campaign templates
- Add customer testimonial video templates
- Add warehouse update video templates
- Add trending product video templates
- Add seasonal campaign templates
- Add approval workflow for staff
- Add auto-translation Lao, Thai, Chinese, English

---

# Instruction for Claude Code / Cursor

Please build this system step by step.

Start with Phase 1 only:
- Next.js app
- Prisma + PostgreSQL
- Admin dashboard
- Campaign CRUD
- Video post CRUD
- Content calendar list
- Settings page placeholder

Do not implement AI API calls until the database, UI, and workflow structure are stable.

Use clean TypeScript, clear folder structure, and provider adapter pattern so OpenAI, Gemini TTS, Nano Banana image generation, and FFmpeg can be added phase by phase.
