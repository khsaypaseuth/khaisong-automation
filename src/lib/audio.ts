// Gemini TTS returns raw PCM (signed 16-bit little-endian). Wrap it in a WAV
// container so browsers can play it directly.

export type PcmFormat = {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
};

export function pcmToWav(pcm: Buffer, format: PcmFormat): Buffer {
  const { sampleRate, channels, bitsPerSample } = format;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcm.length;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // audio format = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

export function pcmDurationSeconds(pcm: Buffer, format: PcmFormat): number {
  const bytesPerSample = (format.bitsPerSample / 8) * format.channels;
  return pcm.length / (format.sampleRate * bytesPerSample);
}

/** Parses sample rate from a mime type like "audio/L16;codec=pcm;rate=24000". */
export function parsePcmRate(mimeType: string, fallback = 24000): number {
  const match = mimeType.match(/rate=(\d+)/);
  return match ? Number(match[1]) : fallback;
}
