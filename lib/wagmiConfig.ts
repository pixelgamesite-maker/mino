import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

const mainnetRpc = process.env.NEXT_PUBLIC_RPC_URL_MAINNET
  || "https://rpc.mainnet.chain.robinhood.com";
const testnetRpc = process.env.NEXT_PUBLIC_RPC_URL_TESTNET
  || "https://rpc.testnet.chain.robinhood.com";

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [mainnetRpc] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" } },
});

export const robinhoodChainTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [testnetRpc] } },
  blockExplorers: { default: { name: "Explorer", url: "https://explorer.testnet.chain.robinhood.com" } },
  testnet: true,
});

const useTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === "true";

export const wagmiConfig = createConfig({
  chains: useTestnet ? [robinhoodChainTestnet] : [robinhoodChain],
  connectors: [injected()],
  transports: {
    [robinhoodChain.id]: http(mainnetRpc),
    [robinhoodChainTestnet.id]: http(testnetRpc),
  },
});

export const activeChain = useTestnet ? robinhoodChainTestnet : robinhoodChain;
