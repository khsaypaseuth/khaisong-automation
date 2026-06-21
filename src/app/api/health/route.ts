import { NextResponse } from "next/server";
import IORedis from "ioredis";
import { requireSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { resolveKeys } from "@/server/settings/keys";
import { resolveSocialConfig } from "@/server/videos/social-posting";
import { ffmpegAvailable } from "@/providers/video/FFmpegVideoRenderer";

async function checkDb(): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function checkRedis(): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.REDIS_URL;
  if (!url) return { ok: false, error: "REDIS_URL not set" };
  const client = new IORedis(url, {
    lazyConnect: true,
    connectTimeout: 1500,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });
  try {
    await client.connect();
    await client.ping();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    client.disconnect();
  }
}

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const [db, redis, ffmpeg, keys, social] = await Promise.all([
    checkDb(),
    checkRedis(),
    ffmpegAvailable(),
    resolveKeys(),
    resolveSocialConfig(),
  ]);

  const body = {
    infra: {
      database: db,
      redis,
      ffmpeg: { ok: ffmpeg },
    },
    providers: {
      openai: Boolean(keys.openaiKey),
      gemini: Boolean(keys.geminiKey),
      image: Boolean(keys.imageKey),
      facebook: Boolean(social.facebook),
      tiktok: Boolean(social.tiktok),
    },
    jobs: {
      inline: process.env.INLINE_JOBS === "true" || !process.env.REDIS_URL,
      autoPost: process.env.AUTO_POST_ENABLED === "true",
    },
  };

  // Healthy if DB is reachable (Redis is optional in INLINE_JOBS mode).
  const status = db.ok ? 200 : 503;
  return NextResponse.json(body, { status });
}
