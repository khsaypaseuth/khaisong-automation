import { describe, it, expect } from "vitest";
import {
  buildRenderArgs,
  escapeDrawtext,
  effectiveDurations,
} from "@/providers/video/FFmpegVideoRenderer";

function baseInput() {
  return {
    scenes: [
      { imagePath: "/s/1.png", overlayText: "Hello", durationSeconds: 5 },
      { imagePath: "/s/2.png", overlayText: "World", durationSeconds: 4 },
    ],
    voiceAudioPath: "/s/voice.wav",
    outputVideoPath: "/s/out.mp4",
    outputThumbnailPath: "/s/thumb.jpg",
  };
}

function filterGraph(args: string[]): string {
  return args[args.indexOf("-filter_complex") + 1];
}

describe("buildRenderArgs", () => {
  it("maps voice as the input after the images (no music/logo)", () => {
    const args = buildRenderArgs(baseInput());
    expect(args.filter((a) => a === "-i")).toHaveLength(3); // 2 images + voice
    const fg = filterGraph(args);
    expect(fg).toContain("concat=n=2:v=1:a=0[vcat]");
    expect(fg).toContain("[2:a]aresample=async=1[aout]");
    expect(args).toContain("libx264");
    expect(args[args.length - 1]).toBe("/s/out.mp4");
  });

  it("indexes music and logo after voice", () => {
    const args = buildRenderArgs(
      {
        ...baseInput(),
        backgroundMusicPath: "/s/music.mp3",
        logoPath: "/s/logo.png",
      },
      { fontPath: "/fonts/Noto.ttf" },
    );
    const fg = filterGraph(args);
    // images 0,1 · voice 2 · music 3 · logo 4
    expect(fg).toContain("[2:a]volume=1.0[av]");
    expect(fg).toContain("[3:a]volume=0.15[am]");
    expect(fg).toContain("[4:v]scale=220");
    expect(fg).toContain("overlay=W-w-40:60[vout]");
  });

  it("adds drawtext only when a font path is provided", () => {
    const withFont = filterGraph(
      buildRenderArgs(baseInput(), { fontPath: "/f.ttf" }),
    );
    const withoutFont = filterGraph(buildRenderArgs(baseInput(), { fontPath: "" }));
    expect(withFont).toContain("drawtext=");
    expect(withoutFont).not.toContain("drawtext=");
  });
});

describe("escapeDrawtext", () => {
  it("escapes colons and percent signs", () => {
    expect(escapeDrawtext("a:b%c")).toBe("a\\:b\\%c");
  });
});

describe("effectiveDurations", () => {
  const scenes = [{ durationSeconds: 5 }, { durationSeconds: 5 }];

  it("returns base durations with no target", () => {
    expect(effectiveDurations(scenes)).toEqual([5, 5]);
  });

  it("scales proportionally to the target total", () => {
    expect(effectiveDurations(scenes, 5)).toEqual([2.5, 2.5]);
  });

  it("clamps each scene to a minimum of 1s", () => {
    expect(effectiveDurations(scenes, 1)).toEqual([1, 1]);
  });
});

describe("buildRenderArgs with overlay PNGs", () => {
  it("inserts overlay inputs after images and shifts voice index", () => {
    const args = buildRenderArgs({
      scenes: [
        { imagePath: "/s/1.png", overlayImagePath: "/o/1.png", durationSeconds: 5 },
        { imagePath: "/s/2.png", overlayImagePath: "/o/2.png", durationSeconds: 5 },
      ],
      voiceAudioPath: "/s/voice.wav",
      outputVideoPath: "/s/out.mp4",
      outputThumbnailPath: "/s/thumb.jpg",
    });
    expect(args.filter((a) => a === "-i")).toHaveLength(5); // 2 images + 2 overlays + voice
    const fg = args[args.indexOf("-filter_complex") + 1];
    // overlays are inputs 2 and 3; voice is input 4
    expect(fg).toContain("[2:v]scale=1080:1920[ov0]");
    expect(fg).toContain("[base0][ov0]overlay=0:0[sv0]");
    expect(fg).toContain("[3:v]scale=1080:1920[ov1]");
    expect(fg).toContain("[4:a]aresample=async=1[aout]");
    expect(fg).toContain("[sv0][sv1]concat=n=2:v=1:a=0[vcat]");
  });
});
