import { describe, it, expect } from "vitest";
import {
  selectTextProvider,
  selectImageProvider,
  type ResolvedKeys,
} from "@/server/settings/keys";

function keys(overrides: Partial<ResolvedKeys>): ResolvedKeys {
  return {
    textProvider: "openai",
    imageProvider: "openai",
    openaiKey: "",
    openaiModel: "gpt-5-mini",
    geminiKey: "",
    geminiTtsModel: "tts",
    geminiTextModel: "gemini-2.5-flash",
    geminiImageModel: "gemini-2.5-flash-image",
    imageKey: "",
    imageModel: "gpt-image-1",
    ...overrides,
  };
}

describe("selectTextProvider", () => {
  it("honors the requested provider when its key exists", () => {
    expect(
      selectTextProvider(keys({ textProvider: "gemini", geminiKey: "g" })),
    ).toBe("gemini");
    expect(
      selectTextProvider(keys({ textProvider: "openai", openaiKey: "o" })),
    ).toBe("openai");
  });

  it("falls back to whichever key is available", () => {
    // Requested gemini but only OpenAI key present
    expect(
      selectTextProvider(keys({ textProvider: "gemini", openaiKey: "o" })),
    ).toBe("openai");
    // Requested openai but only Gemini key present
    expect(
      selectTextProvider(keys({ textProvider: "openai", geminiKey: "g" })),
    ).toBe("gemini");
  });

  it("returns null when nothing is configured", () => {
    expect(selectTextProvider(keys({}))).toBeNull();
  });
});

describe("selectImageProvider", () => {
  it("uses Gemini when requested and keyed", () => {
    expect(
      selectImageProvider(keys({ imageProvider: "gemini", geminiKey: "g" })),
    ).toBe("gemini");
  });

  it("uses OpenAI image key when requested", () => {
    expect(
      selectImageProvider(keys({ imageProvider: "openai", imageKey: "o" })),
    ).toBe("openai");
  });

  it("returns null when nothing is configured", () => {
    expect(selectImageProvider(keys({}))).toBeNull();
  });
});
