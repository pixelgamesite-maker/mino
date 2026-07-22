// Mino AI backend — Railway-ready Express server
//
// Flow (preview-first):
//   POST /api/generate  { base, traits, wallet }  -> preview image + generationId
//   POST /api/authorize { generationId, wallet } -> pins to IPFS, returns
//        { uri, nonce, deadline, signature } for the contract mint() call
//
// Previews are held in memory 15 min; only authorized mints get pinned.

import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import {
  validateBase,
  validateTraits,
  buildPrompt,
  NEGATIVE_PROMPT,
  type Base,
  type Traits,
} from "./lib/prompt";
import { generateMino } from "./lib/generate";
import { pinImage, pinMetadata, buildMetadata } from "./lib/ipfs";
import { signMint, signerAddress } from "./lib/signer";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "*" }));
app.use(express.json());

type Pending = { base: Base; traits: Traits; png: Buffer; wallet: string; at: number };
const pending = new Map<string, Pending>();
const TTL_MS = 15 * 60 * 1000;

// Simple per-wallet preview rate limit
const previews = new Map<string, number[]>();
const MAX_PREVIEWS_PER_HOUR = 10;

setInterval(() => {
  const now = Date.now();
  for (const [id, p] of pending) if (now - p.at > TTL_MS) pending.delete(id);
}, 60_000);

app.get("/health", (_req, res) => res.json({ ok: true, signer: signerAddress }));

app.post("/api/generate", async (req, res) => {
  try {
    const wallet = String(req.body.wallet ?? "").toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(wallet))
      return res.status(400).json({ error: "Invalid wallet address" });

    const now = Date.now();
    const recent = (previews.get(wallet) ?? []).filter((t) => now - t < 3600_000);
    if (recent.length >= MAX_PREVIEWS_PER_HOUR)
      return res.status(429).json({ error: "Preview limit reached, try later" });

    const base = validateBase(String(req.body.base ?? ""));
    const traits = validateTraits(req.body.traits ?? {});
    const prompt = buildPrompt(base, traits);
    const png = await generateMino(prompt, NEGATIVE_PROMPT, base);

    recent.push(now);
    previews.set(wallet, recent);

    const id = randomUUID();
    pending.set(id, { base, traits, png, wallet, at: now });

    res.json({
      generationId: id,
      preview: `data:image/png;base64,${png.toString("base64")}`,
      expiresInSeconds: TTL_MS / 1000,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? "Generation failed" });
  }
});

app.post("/api/authorize", async (req, res) => {
  try {
    const { generationId, wallet } = req.body;
    const p = pending.get(String(generationId));
    if (!p) return res.status(404).json({ error: "Preview expired — regenerate" });
    if (p.wallet !== String(wallet).toLowerCase())
      return res.status(403).json({ error: "Wallet mismatch" });

    const name = `Mino #pending-${generationId.slice(0, 8)}`;
    const imageUri = await pinImage(p.png, name);
    const meta = buildMetadata(name, imageUri, p.base, p.traits);
    const uri = await pinMetadata(meta, name);

    const auth = await signMint(wallet as `0x${string}`, uri);
    pending.delete(String(generationId));

    res.json(auth);
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? "Authorization failed" });
  }
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => console.log(`Mino AI backend on :${PORT}`));
