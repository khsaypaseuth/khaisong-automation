import { describe, it, expect } from "vitest";
import { generatedCampaignSchema } from "@/lib/validations/generation";

const validVideo = {
  title: "How Khaisong helps you import from China",
  hook: "Buying from China made simple",
  voiceScript: "Khaisong handles sourcing, shipping, and customs…",
  storyboard: [
    {
      sceneNumber: 1,
      sceneTitle: "Intro",
      sceneDescription: "Warehouse",
      imagePrompt: "A clean modern warehouse",
      overlayText: "Source with confidence",
      durationSeconds: 5,
    },
  ],
  captionFacebook: "FB caption",
  captionTiktok: "TT caption",
  hashtags: ["#Khaisong"],
  suggestedPostingDatetime: "2026-06-21 18:00",
};

describe("generatedCampaignSchema", () => {
  it("parses a valid campaign", () => {
    const parsed = generatedCampaignSchema.parse({
      campaignTitle: "Trust campaign",
      videos: [validVideo],
    });
    expect(parsed.videos).toHaveLength(1);
    expect(parsed.videos[0].storyboard[0].sceneNumber).toBe(1);
  });

  it("applies defaults for optional fields", () => {
    const parsed = generatedCampaignSchema.parse({
      videos: [
        {
          title: "Minimal",
          storyboard: [{ sceneNumber: 1 }],
        },
      ],
    });
    expect(parsed.campaignTitle).toBe("");
    expect(parsed.videos[0].hashtags).toEqual([]);
    expect(parsed.videos[0].storyboard[0].durationSeconds).toBe(5);
  });

  it("rejects a campaign with no videos", () => {
    expect(() => generatedCampaignSchema.parse({ videos: [] })).toThrow();
  });

  it("rejects a video with no storyboard scenes", () => {
    expect(() =>
      generatedCampaignSchema.parse({
        videos: [{ title: "x", storyboard: [] }],
      }),
    ).toThrow();
  });
});
