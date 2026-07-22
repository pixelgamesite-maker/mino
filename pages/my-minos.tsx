import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAccount, useConnect, useReadContract } from "wagmi";
import { MINO_ADDRESS, minoAbi, resolveIpfs } from "../lib/contract";
import styles from "./my-minos.module.css";

type Attribute = { trait_type: string; value: string };
type Metadata = {
  name: string;
  image: string;
  attributes: Attribute[];
};

type MinoCard = {
  tokenId: bigint;
  meta: Metadata | null;
  loading: boolean;
};

export default function MyMinos() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [cards, setCards] = useState<MinoCard[]>([]);

  const { data: tokenIds, isLoading: idsLoading } = useReadContract({
    address: MINO_ADDRESS,
    abi: minoAbi,
    functionName: "tokensOfOwner",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (!tokenIds || (tokenIds as bigint[]).length === 0) {
      setCards([]);
      return;
    }
    const ids = tokenIds as bigint[];
    setCards(ids.map((tokenId) => ({ tokenId, meta: null, loading: true })));

    ids.forEach(async (tokenId) => {
      try {
        const meta = await fetchMetaOnChain(tokenId);
        setCards((prev) =>
          prev.map((c) => (c.tokenId === tokenId ? { ...c, meta, loading: false } : c))
        );
      } catch {
        setCards((prev) =>
          prev.map((c) => (c.tokenId === tokenId ? { ...c, loading: false } : c))
        );
      }
    });
  }, [tokenIds]);

  // Reads tokenURI directly from the contract, then fetches the metadata
  // JSON from IPFS. No backend indexer needed — tokensOfOwner() + tokenURI()
  // is enough for a wallet-scale "My Minos" view.
  async function fetchMetaOnChain(tokenId: bigint): Promise<Metadata> {
    const { readContract } = await import("wagmi/actions");
    const { wagmiConfig } = await import("../lib/wagmiConfig");
    const uri = (await readContract(wagmiConfig, {
      address: MINO_ADDRESS,
      abi: minoAbi,
      functionName: "tokenURI",
      args: [tokenId],
    })) as string;
    const metaRes = await fetch(resolveIpfs(uri));
    return metaRes.json();
  }

  return (
    <>
      <Head><title>My Minos — Mino AI</title></Head>
      <main className={styles.page}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.wordmark}>MINO_AI</Link>
          <div className={styles.navRight}>
            <Link href="/mint" className={styles.navLink}>Mint</Link>
            {isConnected ? (
              <span className={styles.wallet}>{address?.slice(0, 6)}…{address?.slice(-4)}</span>
            ) : (
              <button className={styles.connectBtn} onClick={() => connect({ connector: connectors[0] })}>
                Connect wallet
              </button>
            )}
          </div>
        </nav>

        <div className={styles.header}>
          <h1 className={styles.h1}>My Minos</h1>
          {isConnected && tokenIds !== undefined && (
            <span className={styles.count}>{(tokenIds as bigint[]).length} owned</span>
          )}
        </div>

        {!isConnected && (
          <div className={styles.empty}>
            <p>Connect your wallet to see your Minos.</p>
            <button className={styles.connectBtn} onClick={() => connect({ connector: connectors[0] })}>
              Connect wallet
            </button>
          </div>
        )}

        {isConnected && idsLoading && (
          <p className={styles.statusText}>&gt; reading chain_</p>
        )}

        {isConnected && !idsLoading && cards.length === 0 && (
          <div className={styles.empty}>
            <p>No Minos yet.</p>
            <Link href="/mint" className={styles.primaryCta}>Prompt your first mint</Link>
          </div>
        )}

        <div className={styles.grid}>
          {cards.map((c) => (
            <div key={c.tokenId.toString()} className={styles.card}>
              <div className={styles.cardImgWrap}>
                {c.loading ? (
                  <span className={styles.loadingDot} />
                ) : c.meta ? (
                  <img
                    src={resolveIpfs(c.meta.image)}
                    alt={c.meta.name}
                    className={styles.cardImg}
                  />
                ) : (
                  <span className={styles.cardImgError}>failed to load</span>
                )}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardId}>#{c.tokenId.toString()}</span>
                {c.meta && (
                  <dl className={styles.cardTraits}>
                    {c.meta.attributes.map((a) => (
                      <div key={a.trait_type}>
                        <dt>{a.trait_type}</dt>
                        <dd>{a.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
