// Mino AI — Pinata pinning + ERC-721 metadata

import type { Base, Traits } from "./prompt";

const PINATA_JWT = process.env.PINATA_JWT!;
const PIN_FILE = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PIN_JSON = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

export async function pinImage(png: Buffer, name: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), `${name}.png`);
  form.append("pinataMetadata", JSON.stringify({ name }));

  const res = await fetch(PIN_FILE, {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Pinata image pin failed: ${await res.text()}`);
  const { IpfsHash } = await res.json();
  return `ipfs://${IpfsHash}`;
}

export function buildMetadata(
  name: string,
  imageUri: string,
  base: Base,
  traits: Traits
) {
  return {
    name,
    description:
      "Mino AI — a prompt-to-mint pixel collection. Pick your base, prompt your traits, mint your Mino.",
    image: imageUri,
    attributes: [
      { trait_type: "Base", value: base },
      { trait_type: "Hair", value: traits.hair },
      { trait_type: "Eyes", value: traits.eyes },
      { trait_type: "Mouth", value: traits.mouth },
      { trait_type: "Cloth", value: traits.cloth },
      { trait_type: "Accessories", value: traits.accessories },
      { trait_type: "Palette", value: "White / Dark / Green" },
    ],
  };
}

export async function pinMetadata(meta: object, name: string): Promise<string> {
  const res = await fetch(PIN_JSON, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: meta,
      pinataMetadata: { name: `${name}-metadata` },
    }),
  });
  if (!res.ok) throw new Error(`Pinata JSON pin failed: ${await res.text()}`);
  const { IpfsHash } = await res.json();
  return `ipfs://${IpfsHash}`;
}
