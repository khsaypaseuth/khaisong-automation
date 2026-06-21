import { describe, it, expect } from "vitest";
import { pcmToWav, pcmDurationSeconds, parsePcmRate } from "@/lib/audio";

const FORMAT = { sampleRate: 24000, channels: 1, bitsPerSample: 16 };

describe("pcmToWav", () => {
  it("prepends a 44-byte WAV header with correct fields", () => {
    const pcm = Buffer.alloc(8);
    const wav = pcmToWav(pcm, FORMAT);

    expect(wav.length).toBe(44 + 8);
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.toString("ascii", 8, 12)).toBe("WAVE");
    expect(wav.toString("ascii", 12, 16)).toBe("fmt ");
    expect(wav.toString("ascii", 36, 40)).toBe("data");

    expect(wav.readUInt32LE(4)).toBe(36 + 8); // RIFF chunk size
    expect(wav.readUInt16LE(20)).toBe(1); // PCM
    expect(wav.readUInt16LE(22)).toBe(1); // channels
    expect(wav.readUInt32LE(24)).toBe(24000); // sample rate
    expect(wav.readUInt32LE(28)).toBe(48000); // byte rate
    expect(wav.readUInt16LE(34)).toBe(16); // bits per sample
    expect(wav.readUInt32LE(40)).toBe(8); // data size
  });
});

describe("pcmDurationSeconds", () => {
  it("computes duration from byte length", () => {
    // 24000 bytes / (24000 * 2 bytes/sample) = 0.5s
    expect(pcmDurationSeconds(Buffer.alloc(24000), FORMAT)).toBe(0.5);
  });
});

describe("parsePcmRate", () => {
  it("parses the rate from a mime type", () => {
    expect(parsePcmRate("audio/L16;codec=pcm;rate=16000")).toBe(16000);
  });
  it("falls back when no rate present", () => {
    expect(parsePcmRate("audio/wav")).toBe(24000);
    expect(parsePcmRate("", 8000)).toBe(8000);
  });
});
