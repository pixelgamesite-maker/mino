// Mino AI — trait schema + locked prompt templates
// Base = fixed silhouette/species, chosen first, never typed by the user.
// Traits = 5 freeform text fields layered onto that fixed base.
// Palette is always: white bg, dark base silhouette, neon green trait details.

export const BASES = ["male", "female", "robot", "pet"] as const;
export type Base = (typeof BASES)[number];

export const TRAIT_FIELDS = ["hair", "eyes", "mouth", "cloth", "accessories"] as const;
export type TraitField = (typeof TRAIT_FIELDS)[number];
export type Traits = Record<TraitField, string>;

const MAX_TRAIT_LEN = 30;

// Per-field blocklist — extend as needed
const BLOCKLIST = [
  "nude", "naked", "nsfw", "gore", "blood", "hitler", "swastika",
  "child", "kid", "loli", "nazi", "isis", "porn", "sex",
];

const CLEAN_RE = /^[a-zA-Z0-9 \-']+$/;

export function validateBase(base: string): Base {
  if (!BASES.includes(base as Base)) {
    throw new Error(`Invalid base — choose one of: ${BASES.join(", ")}`);
  }
  return base as Base;
}

export function validateTraits(traits: Partial<Traits>): Traits {
  const out = {} as Traits;
  for (const field of TRAIT_FIELDS) {
    const raw = (traits[field] ?? "").trim().toLowerCase();
    if (!raw) throw new Error(`Missing trait: ${field}`);
    if (raw.length > MAX_TRAIT_LEN)
      throw new Error(`Trait too long: ${field} (max ${MAX_TRAIT_LEN} chars)`);
    if (!CLEAN_RE.test(raw))
      throw new Error(`Invalid characters in ${field} — letters/numbers only`);
    for (const bad of BLOCKLIST) {
      if (raw.includes(bad)) throw new Error(`Trait rejected: ${field}`);
    }
    out[field] = raw;
  }
  return out;
}

// Fixed framing/proportions per base — this is what keeps every Mino of
// the same base looking like the same species regardless of trait text.
const BASE_FRAME: Record<Base, string> = {
  male:
    "male humanoid bust portrait, square jaw, broad shoulders, standard human proportions",
  female:
    "female humanoid bust portrait, softer jawline, narrow shoulders, standard human proportions",
  robot:
    "robot bust portrait, boxy rectangular head, visible neck bolts, mechanical shoulder plating",
  pet:
    "small animal bust portrait, rounded head, forward-facing ears, no shoulders — creature chest only",
};

const EXPRESSION_HINT: Record<Base, string> = {
  male: "human facial expression",
  female: "human facial expression",
  robot: "LED visor expression, glowing eye lights showing",
  pet: "animal facial expression",
};

// Locked template — user text only ever lands in the bracketed slots.
// Palette is stated explicitly so the model tries to separate base vs.
// trait color itself, before our post-processing forces it anyway.
export function buildPrompt(base: Base, traits: Traits): string {
  return [
    `pixel art, 64x64 retro sprite style, ${BASE_FRAME[base]},`,
    `pure white #FFFFFF background,`,
    `base silhouette (head/body shape only) rendered in dark near-black #0A0A0A,`,
    `all of the following details rendered in neon green #00FF41 line art:`,
    `hair/head-covering: ${traits.hair},`,
    `${traits.eyes} ${EXPRESSION_HINT[base]},`,
    `mouth: ${traits.mouth},`,
    `clothing: ${traits.cloth},`,
    `accessories: ${traits.accessories},`,
    "flat colors only, no gradients, no anti-aliasing, no shading, centered, front-facing, three colors total",
  ].join(" ");
}

export const NEGATIVE_PROMPT =
  "realistic, 3d, photo, gradient, blur, smooth shading, multiple characters, text, watermark, extra colors, red, blue, yellow, purple, grey background, black background";
