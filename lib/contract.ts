export const MINO_ADDRESS = process.env.NEXT_PUBLIC_MINO_ADDRESS as `0x${string}`;

export const minoAbi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [
      { name: "uri", type: "string" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "mintPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalMinted",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "tokensOfOwner",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
] as const;

// Public IPFS gateway for resolving ipfs:// URIs client-side.
// Swap for your own gateway (Pinata dedicated gateway, etc) for reliability.
export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export function resolveIpfs(uri: string): string {
  return uri.startsWith("ipfs://")
    ? IPFS_GATEWAY + uri.slice("ipfs://".length)
    : uri;
}
