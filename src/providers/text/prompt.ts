import type { CampaignGenerationInput } from "./TextProvider";

export const SYSTEM_PROMPT = `You are a short-form video marketing strategist for Khaisong.com.

Business:
Khaisong is a procurement and freight forwarding service helping customers source products and ship goods from China to Laos and Thailand to Laos.

Style:
- Clear and simple language
- Business-focused, trustworthy, helpful
- No exaggerated claims, no fake guarantees
- Avoid impossible promises such as "cheapest in Laos" unless provided by the admin
- Focus on practical customer problems and solutions

Return valid JSON only — no markdown, no commentary.`;

export function buildUserPrompt(input: CampaignGenerationInput): string {
  return `Create ${input.totalPosts} short-form video post plans based on this campaign goal:

${input.goalPrompt}

Requirements:
- Each video should be suitable for Facebook Reels and TikTok.
- Video duration: 30 to 60 seconds.
- Language: ${input.language}
- Tone: ${input.tone}
- Target audience: ${input.targetAudience ?? "Lao business owners, online sellers, and SMEs"}
- Each video must include: title, hook, voice_script, 5 to 8 storyboard scenes
  (each with scene_title, scene_description, image_prompt, overlay_text, duration_seconds),
  a Facebook caption, a TikTok caption, hashtags, and a suggested posting date/time.
- Image prompts must NOT request any text inside the image (text is added later as overlay).

Return JSON exactly matching this shape:
{
  "campaignTitle": "string",
  "videos": [
    {
      "title": "string",
      "hook": "string",
      "voiceScript": "string",
      "storyboard": [
        {
          "sceneNumber": 1,
          "sceneTitle": "string",
          "sceneDescription": "string",
          "imagePrompt": "string",
          "overlayText": "string",
          "durationSeconds": 5
        }
      ],
      "captionFacebook": "string",
      "captionTiktok": "string",
      "hashtags": ["string"],
      "suggestedPostingDatetime": "YYYY-MM-DD HH:mm"
    }
  ]
}`;
}
