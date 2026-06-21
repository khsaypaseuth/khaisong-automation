-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'REVIEWER', 'STAFF');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('FACEBOOK', 'TIKTOK');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'GENERATING_SCRIPTS', 'SCRIPTS_GENERATED', 'GENERATING_ASSETS', 'RENDERING_VIDEOS', 'READY_FOR_REVIEW', 'APPROVED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "VideoPostStatus" AS ENUM ('DRAFT', 'SCRIPT_GENERATED', 'GENERATING_IMAGES', 'IMAGES_GENERATED', 'GENERATING_VOICE', 'VOICE_GENERATED', 'RENDERING', 'VIDEO_RENDERED', 'READY_FOR_REVIEW', 'APPROVED', 'SCHEDULED', 'POSTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "PostingStatus" AS ENUM ('PENDING', 'POSTED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal_prompt" TEXT NOT NULL,
    "posts_per_day" INTEGER NOT NULL,
    "number_of_days" INTEGER NOT NULL,
    "total_posts" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'Lao',
    "tone" TEXT NOT NULL DEFAULT 'Helpful, trustworthy, professional',
    "target_audience" TEXT,
    "platforms" "Platform"[],
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_posts" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hook" TEXT,
    "script_text" TEXT,
    "voice_script" TEXT,
    "caption_facebook" TEXT,
    "caption_tiktok" TEXT,
    "hashtags" TEXT[],
    "target_platforms" "Platform"[],
    "scheduled_date" TIMESTAMP(3),
    "scheduled_time" TEXT,
    "status" "VideoPostStatus" NOT NULL DEFAULT 'DRAFT',
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "video_url" TEXT,
    "thumbnail_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storyboard_scenes" (
    "id" TEXT NOT NULL,
    "video_post_id" TEXT NOT NULL,
    "scene_number" INTEGER NOT NULL,
    "scene_title" TEXT,
    "scene_description" TEXT,
    "image_prompt" TEXT,
    "overlay_text" TEXT,
    "duration_seconds" INTEGER NOT NULL DEFAULT 5,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storyboard_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_assets" (
    "id" TEXT NOT NULL,
    "video_post_id" TEXT NOT NULL,
    "provider" TEXT,
    "voice_name" TEXT,
    "script_text" TEXT,
    "audio_url" TEXT,
    "duration_seconds" INTEGER,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_assets" (
    "id" TEXT NOT NULL,
    "video_post_id" TEXT NOT NULL,
    "video_url" TEXT,
    "format" TEXT,
    "resolution" TEXT,
    "duration_seconds" INTEGER,
    "file_size" INTEGER,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_logs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "endpoint" TEXT,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "status" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posting_logs" (
    "id" TEXT NOT NULL,
    "video_post_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platform_post_id" TEXT,
    "status" "PostingStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posting_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "video_posts_campaign_id_idx" ON "video_posts"("campaign_id");

-- CreateIndex
CREATE INDEX "storyboard_scenes_video_post_id_idx" ON "storyboard_scenes"("video_post_id");

-- CreateIndex
CREATE INDEX "voice_assets_video_post_id_idx" ON "voice_assets"("video_post_id");

-- CreateIndex
CREATE INDEX "video_assets_video_post_id_idx" ON "video_assets"("video_post_id");

-- CreateIndex
CREATE INDEX "posting_logs_video_post_id_idx" ON "posting_logs"("video_post_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_posts" ADD CONSTRAINT "video_posts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyboard_scenes" ADD CONSTRAINT "storyboard_scenes_video_post_id_fkey" FOREIGN KEY ("video_post_id") REFERENCES "video_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_assets" ADD CONSTRAINT "voice_assets_video_post_id_fkey" FOREIGN KEY ("video_post_id") REFERENCES "video_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_assets" ADD CONSTRAINT "video_assets_video_post_id_fkey" FOREIGN KEY ("video_post_id") REFERENCES "video_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posting_logs" ADD CONSTRAINT "posting_logs_video_post_id_fkey" FOREIGN KEY ("video_post_id") REFERENCES "video_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
