import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  RenderInput,
  RenderResult,
  VideoRenderer,
} from "./VideoRenderer";

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FONT_PATH = process.env.FFMPEG_FONT_PATH || "";

/** Escapes text for the drawtext filter. */
function escapeDrawtext(text: string): string {
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

export class FFmpegVideoRenderer implements VideoRenderer {
  async render(input: RenderInput): Promise<RenderResult> {
    const { scenes } = input;
    if (scenes.length === 0) throw new Error("No scenes to render");

    await fs.mkdir(path.dirname(input.outputVideoPath), { recursive: true });
    await fs.mkdir(path.dirname(input.outputThumbnailPath), { recursive: true });

    const args: string[] = ["-y"];

    // Image inputs (looped stills; zoompan controls clip length).
    for (const scene of scenes) {
      args.push("-loop", "1", "-i", scene.imagePath);
    }
    const voiceIdx = scenes.length;
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

    scenes.forEach((scene, i) => {
      const dur = Math.max(1, scene.durationSeconds || 5);
      const frames = Math.round(dur * FPS);
      const fadeOut = Math.max(0, dur - 0.4).toFixed(2);
      let chain =
        `[${i}:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,` +
        `crop=${WIDTH}:${HEIGHT},setsar=1,` +
        `zoompan=z='min(zoom+0.0007,1.4)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
        `d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS},` +
        `fade=t=in:st=0:d=0.4,fade=t=out:st=${fadeOut}:d=0.4`;

      if (scene.overlayText?.trim() && FONT_PATH) {
        chain +=
          `,drawtext=fontfile='${FONT_PATH}':text='${escapeDrawtext(scene.overlayText.trim())}':` +
          `fontcolor=white:fontsize=54:box=1:boxcolor=black@0.5:boxborderw=20:` +
          `x=(w-text_w)/2:y=h-360:line_spacing=10`;
      }

      chain += `[sv${i}]`;
      filters.push(chain);
      sceneLabels.push(`[sv${i}]`);
    });

    // Concatenate scene clips into one video stream.
    filters.push(`${sceneLabels.join("")}concat=n=${scenes.length}:v=1:a=0[vcat]`);

    // Optional logo overlay (top-right).
    let videoOut = "[vcat]";
    if (logoIdx >= 0) {
      filters.push(`[${logoIdx}:v]scale=220:-1[lg]`);
      filters.push(`[vcat][lg]overlay=W-w-40:60[vout]`);
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
      "-shortest",
      "-movflags",
      "+faststart",
      input.outputVideoPath,
    );

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
    const totalDuration = scenes.reduce(
      (sum, s) => sum + Math.max(1, s.durationSeconds || 5),
      0,
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
