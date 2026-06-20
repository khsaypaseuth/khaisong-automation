// Phase 8 seam — posting rendered videos to Facebook / TikTok.

export type SocialPlatform = "FACEBOOK" | "TIKTOK";

export type PostInput = {
  videoUrl: string;
  caption: string;
  scheduledAt?: Date;
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
    throw new Error(
      `SocialPoster (${this.platform}) not implemented (Phase 8)`,
    );
  }
}
