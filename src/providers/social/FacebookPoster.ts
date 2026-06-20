import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  PostInput,
  PostResult,
  SocialPlatform,
  SocialPoster,
} from "./SocialPoster";

export type FacebookConfig = {
  pageId: string;
  accessToken: string;
  apiVersion?: string;
};

/**
 * Posts a video to a Facebook Page via the Meta Graph API by uploading the
 * file directly (multipart). Returns the created video/post id.
 * Docs: https://developers.facebook.com/docs/graph-api/reference/page/videos
 */
export class FacebookPoster implements SocialPoster {
  readonly platform: SocialPlatform = "FACEBOOK";

  constructor(private config: FacebookConfig) {}

  async post(input: PostInput): Promise<PostResult> {
    const version = this.config.apiVersion || "v21.0";
    const url = `https://graph-video.facebook.com/${version}/${this.config.pageId}/videos`;

    const buffer = await fs.readFile(input.videoPath);
    const form = new FormData();
    form.append("access_token", this.config.accessToken);
    form.append("description", input.caption);
    form.append(
      "source",
      new Blob([new Uint8Array(buffer)], { type: "video/mp4" }),
      path.basename(input.videoPath),
    );

    const res = await fetch(url, { method: "POST", body: form });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      error?: { message?: string };
    };
    if (!res.ok || !data.id) {
      throw new Error(
        `Facebook post failed: ${data.error?.message ?? res.status}`,
      );
    }

    return {
      platformPostId: data.id,
      url: `https://www.facebook.com/${data.id}`,
    };
  }
}
