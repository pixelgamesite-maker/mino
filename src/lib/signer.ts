// Mino AI — backend mint authorizer
// Signs (to, uri, nonce, deadline) with EIP-712 so the contract only
// accepts metadata produced by this backend.

import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(
  process.env.SIGNER_PRIVATE_KEY as `0x${string}`
);

const CONTRACT = process.env.MINO_CONTRACT_ADDRESS as `0x${string}`;
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 46630); // Robinhood testnet default

export async function signMint(to: `0x${string}`, uri: string) {
  const nonce = BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 15 * 60); // 15 min

  const signature = await account.signTypedData({
    domain: {
      name: "MinoAI",
      version: "1",
      chainId: CHAIN_ID,
      verifyingContract: CONTRACT,
    },
    types: {
      Mint: [
        { name: "to", type: "address" },
        { name: "uri", type: "string" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Mint",
    message: { to, uri, nonce, deadline },
  });

  return {
    uri,
    nonce: nonce.toString(),
    deadline: deadline.toString(),
    signature,
  };
}

export const signerAddress = account.address;
