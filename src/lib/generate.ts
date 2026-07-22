// Mino AI — generation + post-processing
// Replicate generates; we then force every pixel to one of exactly three
// colors (white bg / dark base / green traits), snap to a 64x64 grid,
// and upscale 16x nearest-neighbor for marketplaces.

import Replicate from "replicate";
import sharp from "sharp";
import type { Base } from "./prompt";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

const WHITE = { r: 255, g: 255, b: 255 }; // background
const DARK = { r: 10, g: 10, b: 10 };     // base silhouette
const GREEN = { r: 0, g: 255, b: 65 };    // #00FF41 — prompted traits

const GRID = 64;        // logical pixel resolution
const OUTPUT = 1024;    // final image size (64 * 16)

export async function generateRaw(prompt: string, negative: string): Promise<Buffer> {
  // Any SDXL pixel-art model/LoRA works; swap the slug for your favorite.
  const output = (await replicate.run(
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    {
      input: {
        prompt,
        negative_prompt: negative,
        width: 1024,
        height: 1024,
        num_inference_steps: 30,
      },
    }
  )) as string[];

  const res = await fetch(output[0]);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Force the image into the Mino tri-tone style:
 * 1. Downscale to 64x64 (kills AI smoothness, creates true pixels)
 * 2. Classify every pixel into WHITE / DARK / GREEN by luminance + hue
 * 3. Upscale nearest-neighbor to 1024 for crisp marketplace display
 *
 * Classification logic:
 *  - Bright, low-saturation pixels -> WHITE (background)
 *  - Dark, low-saturation pixels   -> DARK (base silhouette)
 *  - Anything green-ish/mid-tone   -> GREEN (prompted trait detail)
 */
export async function minoify(raw: Buffer): Promise<Buffer> {
  const small = await sharp(raw)
    .resize(GRID, GRID, { kernel: "lanczos3" })
    .removeAlpha()
    .raw()
    .toBuffer();

  const out = Buffer.alloc(GRID * GRID * 3);
  for (let i = 0; i < GRID * GRID; i++) {
    const r = small[i * 3], g = small[i * 3 + 1], b = small[i * 3 + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const isGreenish = g > r && g > b && sat > 0.15;

    let c;
    if (isGreenish) c = GREEN;
    else if (lum > 170) c = WHITE;
    else c = DARK;

    out[i * 3] = c.r;
    out[i * 3 + 1] = c.g;
    out[i * 3 + 2] = c.b;
  }

  return sharp(out, { raw: { width: GRID, height: GRID, channels: 3 } })
    .resize(OUTPUT, OUTPUT, { kernel: "nearest" })
    .png()
    .toBuffer();
}

export async function generateMino(
  prompt: string,
  negative: string,
  _base: Base
): Promise<Buffer> {
  const raw = await generateRaw(prompt, negative);
  return minoify(raw);
}
