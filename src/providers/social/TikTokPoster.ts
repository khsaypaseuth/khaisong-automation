import { promises as fs } from "node:fs";
import type {
  PostInput,
  PostResult,
  SocialPlatform,
  SocialPoster,
} from "./SocialPoster";

export type TikTokConfig = {
  accessToken: string;
  /** Direct post privacy level (default SELF_ONLY — safest for unaudited apps). */
  privacyLevel?: string;
};

/**
 * Posts a video via the TikTok Content Posting API (direct post, FILE_UPLOAD).
 * Single-chunk upload (whole file). Returns the publish_id; processing is async
 * on TikTok's side.
 * Docs: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
 */
export class TikTokPoster implements SocialPoster {
  readonly platform: SocialPlatform = "TIKTOK";

  constructor(private config: TikTokConfig) {}

  async post(input: PostInput): Promise<PostResult> {
    const buffer = await fs.readFile(input.videoPath);
    const size = buffer.length;

    // 1. Initialize the upload.
    const initRes = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          post_info: {
            title: input.caption,
            privacy_level: this.config.privacyLevel || "SELF_ONLY",
          },
          source_info: {
            source: "FILE_UPLOAD",
            video_size: size,
            chunk_size: size,
            total_chunk_count: 1,
          },
        }),
      },
    );

    const initData = (await initRes.json().catch(() => ({}))) as {
      data?: { publish_id?: string; upload_url?: string };
      error?: { message?: string; code?: string };
    };
    const publishId = initData.data?.publish_id;
    const uploadUrl = initData.data?.upload_url;
    if (!initRes.ok || !publishId || !uploadUrl) {
      throw new Error(
        `TikTok init failed: ${initData.error?.message ?? initRes.status}`,
      );
    }

    // 2. Upload the file bytes to the provided upload URL.
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(size),
        "Content-Range": `bytes 0-${size - 1}/${size}`,
      },
      body: new Uint8Array(buffer),
    });
    if (!uploadRes.ok) {
      throw new Error(`TikTok upload failed: ${uploadRes.status}`);
    }

    return { platformPostId: publishId };
  }
}
