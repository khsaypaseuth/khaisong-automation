import { Resvg } from "@resvg/resvg-js";

const WIDTH = 1080;
const HEIGHT = 1920;
const FONT_SIZE = 52;
const LINE_HEIGHT = 70;
const MAX_CHARS_PER_LINE = 22;
const BOTTOM_MARGIN = 320; // distance of the text block bottom from the frame bottom

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Greedy wrap into lines. Splits on spaces when present; otherwise hard-wraps
 * by character count (Lao often has no inter-word spaces). */
export function wrapText(text: string, maxChars = MAX_CHARS_PER_LINE): string[] {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return [];
  const lines: string[] = [];

  for (const word of clean.split(" ")) {
    if (word.length > maxChars) {
      // hard-wrap a long token
      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(word.slice(i, i + maxChars));
      }
      continue;
    }
    const last = lines[lines.length - 1];
    if (last && (last + " " + word).length <= maxChars) {
      lines[lines.length - 1] = last + " " + word;
    } else {
      lines.push(word);
    }
  }
  return lines.slice(0, 4); // cap at 4 lines
}

function buildSvg(lines: string[], fontFamily: string): string {
  const blockHeight = lines.length * LINE_HEIGHT;
  const boxPad = 28;
  const boxTop = HEIGHT - BOTTOM_MARGIN - blockHeight - boxPad;
  const boxHeight = blockHeight + boxPad * 2;
  const boxX = 60;
  const boxW = WIDTH - boxX * 2;
  const firstBaseline = boxTop + boxPad + FONT_SIZE;

  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="${WIDTH / 2}" y="${firstBaseline + i * LINE_HEIGHT}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${boxX}" y="${boxTop}" width="${boxW}" height="${boxHeight}" rx="24" fill="black" fill-opacity="0.5"/>
  <text text-anchor="middle" font-family="${escapeXml(fontFamily)}" font-size="${FONT_SIZE}" font-weight="700" fill="white">${tspans}</text>
</svg>`;
}

const FONT_FAMILY = process.env.FFMPEG_FONT_FAMILY || "Lao Sangam MN";

/**
 * Renders overlay text to a transparent 1080x1920 PNG using the given font
 * file. Avoids ffmpeg's drawtext (which needs libfreetype) and renders Lao
 * reliably. Returns null if there's nothing to draw.
 */
export async function renderOverlayPng(
  text: string,
  fontPath: string,
): Promise<Buffer | null> {
  const lines = wrapText(text);
  if (lines.length === 0) return null;

  const svg = buildSvg(lines, FONT_FAMILY);

  const resvg = new Resvg(svg, {
    background: "rgba(0,0,0,0)",
    font: {
      fontFiles: [fontPath],
      defaultFontFamily: FONT_FAMILY,
      // also allow system fonts so the family name resolves reliably
      loadSystemFonts: true,
    },
  });
  return Buffer.from(resvg.render().asPng());
}
