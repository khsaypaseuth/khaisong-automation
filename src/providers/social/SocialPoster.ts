// Phase 8 seam — posting rendered videos to Facebook / TikTok.

export type SocialPlatform = "FACEBOOK" | "TIKTOK";

export type PostInput = {
  /** Absolute disk path to the rendered MP4. */
  videoPath: string;
  caption: string;
};

export type PostResult = {
  platformPostId: string;
  url?: string;
};

export interface SocialPoster {
  readonly platform: SocialPlatform;
  post(input: PostInput): Promise<PostResult>;
}

export class NotImplementedSocialPoster implements SocialPoster {
  constructor(public readonly platform: SocialPlatform) {}
  async post(): Promise<never> {
    throw new Error(`SocialPoster (${this.platform}) not configured`);
  }
}
