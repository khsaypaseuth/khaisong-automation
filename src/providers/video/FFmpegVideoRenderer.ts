import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  RenderInput,
  RenderResult,
  VideoRenderer,
} from "./VideoRenderer";

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FONT_PATH = process.env.FFMPEG_FONT_PATH || "";

/** Escapes text for the drawtext filter. */
export function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "’")
    .replace(/%/g, "\\%")
    .replace(/\n/g, " ");
}

export function ffmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(FFMPEG, ["-version"]);
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
  });
}

// Some ffmpeg builds omit the drawtext filter (no libfreetype). Detect once so
// we can skip text overlay gracefully instead of failing the whole render.
let drawtextCache: boolean | undefined;
export function drawtextAvailable(): Promise<boolean> {
  if (drawtextCache !== undefined) return Promise.resolve(drawtextCache);
  return new Promise((resolve) => {
    const proc = spawn(FFMPEG, ["-hide_banner", "-filters"]);
    let out = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.on("error", () => resolve((drawtextCache = false)));
    proc.on("close", () => resolve((drawtextCache = /(^|\s)drawtext\b/m.test(out))));
  });
}

/**
 * Pure builder for the ffmpeg argument vector. Kept side-effect-free so the
 * filtergraph and input-index bookkeeping can be unit-tested without ffmpeg.
 */
/** Scene durations scaled so the visuals span targetDurationSeconds (the
 * voiceover length). Preserves relative pacing; min 1s each. */
export function effectiveDurations(
  scenes: { durationSeconds: number }[],
  target?: number | null,
): number[] {
  const base = scenes.map((s) => Math.max(1, s.durationSeconds || 5));
  if (!target || target <= 0) return base;
  const sum = base.reduce((a, b) => a + b, 0);
  const factor = target / sum;
  return base.map((d) => Math.max(1, Math.round(d * factor * 100) / 100));
}

export function buildRenderArgs(
  input: RenderInput,
  opts: { fontPath?: string; drawtext?: boolean } = {},
): string[] {
  const { scenes } = input;
  const fontPath = opts.fontPath ?? FONT_PATH;
  const drawtext = opts.drawtext ?? true;
  const durations = effectiveDurations(scenes, input.targetDurationSeconds);
  const args: string[] = ["-y"];

  // Image inputs as single frames; zoompan expands each to its clip length.
  // (Do NOT -loop here: an infinite input makes the clip infinite and concat
  // never advances past the first scene.)
  for (const scene of scenes) {
    args.push("-i", scene.imagePath);
  }

  // Pre-rendered overlay text PNGs (one per scene that has one).
  const overlayIdx: number[] = scenes.map(() => -1);
  scenes.forEach((scene, i) => {
    if (scene.overlayImagePath) {
      overlayIdx[i] = args.filter((a) => a === "-i").length;
      args.push("-loop", "1", "-i", scene.overlayImagePath);
    }
  });

  const voiceIdx = args.filter((a) => a === "-i").length;
  args.push("-i", input.voiceAudioPath);

  let musicIdx = -1;
  if (input.backgroundMusicPath) {
    musicIdx = args.filter((a) => a === "-i").length;
    args.push("-stream_loop", "-1", "-i", input.backgroundMusicPath);
  }
  let logoIdx = -1;
  if (input.logoPath) {
    logoIdx = args.filter((a) => a === "-i").length;
    args.push("-i", input.logoPath);
  }

  const filters: string[] = [];
  const sceneLabels: string[] = [];
  const starts: number[] = []; // cumulative start time of each scene

  let clock = 0;
  scenes.forEach((scene, i) => {
    starts.push(clock);
    const dur = durations[i];
    clock += dur;
    const frames = Math.round(dur * FPS);
    const fadeOut = Math.max(0, dur - 0.4).toFixed(2);
    let chain =
      `[${i}:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,` +
      `crop=${WIDTH}:${HEIGHT},setsar=1,` +
      `zoompan=z='min(zoom+0.0007,1.4)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
      `d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS},` +
      `fade=t=in:st=0:d=0.4,fade=t=out:st=${fadeOut}:d=0.4`;

    // drawtext fallback only when there's no pre-rendered overlay PNG.
    if (overlayIdx[i] < 0 && scene.overlayText?.trim() && fontPath && drawtext) {
      chain +=
        `,drawtext=fontfile='${fontPath}':text='${escapeDrawtext(scene.overlayText.trim())}':` +
        `fontcolor=white:fontsize=54:box=1:boxcolor=black@0.5:boxborderw=20:` +
        `x=(w-text_w)/2:y=h-360:line_spacing=10`;
    }

    chain += `[sv${i}]`;
    filters.push(chain);
    sceneLabels.push(`[sv${i}]`);
  });

  // Concatenate scene clips into one video stream.
  filters.push(`${sceneLabels.join("")}concat=n=${scenes.length}:v=1:a=0[vcat]`);

  // Composite caption PNGs onto the concatenated stream, each shown only during
  // its scene's time window. (Overlaying per-scene before concat with looped
  // inputs hangs ffmpeg; post-concat enable windows are the reliable pattern.)
  let videoOut = "[vcat]";
  scenes.forEach((scene, i) => {
    if (overlayIdx[i] < 0) return;
    const start = starts[i].toFixed(2);
    const end = (starts[i] + durations[i]).toFixed(2);
    const next = `[tx${i}]`;
    filters.push(`[${overlayIdx[i]}:v]scale=${WIDTH}:${HEIGHT}[ovs${i}]`);
    filters.push(
      `${videoOut}[ovs${i}]overlay=0:0:enable='between(t,${start},${end})'${next}`,
    );
    videoOut = next;
  });

  // Optional logo overlay (top-right).
  if (logoIdx >= 0) {
    filters.push(`[${logoIdx}:v]scale=220:-1[lg]`);
    filters.push(`${videoOut}[lg]overlay=W-w-40:60[vout]`);
    videoOut = "[vout]";
  }

  // Audio: voice + optional background music (ducked).
  let audioOut: string;
  if (musicIdx >= 0) {
    filters.push(`[${voiceIdx}:a]volume=1.0[av]`);
    filters.push(`[${musicIdx}:a]volume=0.15[am]`);
    filters.push(
      `[av][am]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
    );
    audioOut = "[aout]";
  } else {
    filters.push(`[${voiceIdx}:a]aresample=async=1[aout]`);
    audioOut = "[aout]";
  }

  args.push(
    "-filter_complex",
    filters.join(";"),
    "-map",
    videoOut,
    "-map",
    audioOut,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(FPS),
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    // Bound the output to the exact visual length. Using -t (not -shortest)
    // is deterministic; -shortest with looped overlay inputs is racy.
    "-t",
    durations.reduce((a, b) => a + b, 0).toFixed(2),
    "-movflags",
    "+faststart",
    input.outputVideoPath,
  );

  return args;
}

export class FFmpegVideoRenderer implements VideoRenderer {
  async render(input: RenderInput): Promise<RenderResult> {
    const { scenes } = input;
    if (scenes.length === 0) throw new Error("No scenes to render");

    await fs.mkdir(path.dirname(input.outputVideoPath), { recursive: true });
    await fs.mkdir(path.dirname(input.outputThumbnailPath), { recursive: true });

    const drawtext = await drawtextAvailable();
    const args = buildRenderArgs(input, { drawtext });
    const command = `${FFMPEG} ${args.join(" ")}`;
    await this.run(args);

    // Thumbnail from the first frame.
    await this.run([
      "-y",
      "-i",
      input.outputVideoPath,
      "-frames:v",
      "1",
      "-q:v",
      "3",
      input.outputThumbnailPath,
    ]);

    const stat = await fs.stat(input.outputVideoPath);
    const totalDuration = Math.round(
      effectiveDurations(scenes, input.targetDurationSeconds).reduce(
        (sum, d) => sum + d,
        0,
      ),
    );

    return {
      durationSeconds: totalDuration,
      resolution: `${WIDTH}x${HEIGHT}`,
      fileSize: stat.size,
      command,
    };
  }

  private run(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(FFMPEG, args);
      let stderr = "";
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
        if (stderr.length > 20000) stderr = stderr.slice(-20000);
      });
      proc.on("error", (err) => reject(err));
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-2000)}`));
      });
    });
  }
}
