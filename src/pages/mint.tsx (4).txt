import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAccount, useConnect, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import PromptTerminal from "../components/PromptTerminal";
import { MINO_ADDRESS, minoAbi } from "../lib/contract";
import styles from "./mint.module.css";

const BASES = [
  { id: "male", label: "MALE" },
  { id: "female", label: "FEMALE" },
  { id: "robot", label: "ROBOT" },
  { id: "pet", label: "PET" },
];

const FIELDS = [
  { key: "hair", label: "Hair", placeholder: "e.g. mohawk" },
  { key: "eyes", label: "Eyes (mood)", placeholder: "e.g. angry" },
  { key: "mouth", label: "Mouth", placeholder: "e.g. smirk" },
  { key: "cloth", label: "Cloth", placeholder: "e.g. hoodie" },
  { key: "accessories", label: "Accessories", placeholder: "e.g. gold chain" },
];

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Phase = "form" | "previewing" | "previewed" | "authorizing" | "minting" | "done" | "error";

export default function Mint() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { writeContractAsync } = useWriteContract();

  const [base, setBase] = useState<string | null>(null);
  const [traits, setTraits] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("form");
  const [preview, setPreview] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filled = FIELDS.every((f) => (traits[f.key] ?? "").trim().length > 0);
  const canGenerate = base && filled && isConnected;

  function setTrait(key: string, value: string) {
    setTraits((t) => ({ ...t, [key]: value }));
  }

  async function handleGenerate() {
    if (!canGenerate || !address) return;
    setPhase("previewing");
    setErrorMsg(null);
    try {
      const res = await fetch(`${API}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base, traits, wallet: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setPreview(data.preview);
      setGenerationId(data.generationId);
      setPhase("previewed");
    } catch (e: any) {
      setErrorMsg(e.message);
      setPhase("error");
    }
  }

  async function handleMint() {
    if (!generationId || !address) return;
    setPhase("authorizing");
    setErrorMsg(null);
    try {
      const res = await fetch(`${API}/api/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId, wallet: address }),
      });
      const auth = await res.json();
      if (!res.ok) throw new Error(auth.error ?? "Authorization failed");

      setPhase("minting");
      await writeContractAsync({
        address: MINO_ADDRESS,
        abi: minoAbi,
        functionName: "mint",
        args: [auth.uri, BigInt(auth.nonce), BigInt(auth.deadline), auth.signature],
        value: parseEther("0.002"),
      });
      setPhase("done");
    } catch (e: any) {
      setErrorMsg(e.message ?? "Mint failed");
      setPhase("error");
    }
  }

  return (
    <>
      <Head><title>Mint — Mino AI</title></Head>
      <main className={styles.page}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.wordmark}>MINO_AI</Link>
          {isConnected ? (
            <span className={styles.wallet}>{address?.slice(0, 6)}…{address?.slice(-4)}</span>
          ) : (
            <button className={styles.connectBtn} onClick={() => connect({ connector: connectors[0] })}>
              Connect wallet
            </button>
          )}
        </nav>

        <div className={styles.grid}>
          <div className={styles.formCol}>
            <section className={styles.block}>
              <h2 className={styles.blockTitle}><span className={styles.num}>01</span> Base</h2>
              <div className={styles.baseGrid}>
                {BASES.map((b) => (
                  <button
                    key={b.id}
                    className={`${styles.baseBtn} ${base === b.id ? styles.baseBtnActive : ""}`}
                    onClick={() => setBase(b.id)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.block}>
              <h2 className={styles.blockTitle}><span className={styles.num}>02</span> Traits</h2>
              <div className={styles.fields}>
                {FIELDS.map((f) => (
                  <label key={f.key} className={styles.field}>
                    <span className={styles.fieldLabel}>{f.label}</span>
                    <input
                      className={styles.input}
                      placeholder={f.placeholder}
                      maxLength={30}
                      value={traits[f.key] ?? ""}
                      onChange={(e) => setTrait(f.key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </section>

            <PromptTerminal base={base} traits={traits} />

            {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

            <div className={styles.actions}>
              {phase !== "previewed" && phase !== "done" && (
                <button
                  className={styles.primaryBtn}
                  disabled={!canGenerate || phase === "previewing"}
                  onClick={handleGenerate}
                >
                  {phase === "previewing" ? "Generating…" : "03  Generate preview"}
                </button>
              )}
              {phase === "previewed" && (
                <div className={styles.mintRow}>
                  <button className={styles.ghostBtn} onClick={() => { setPhase("form"); setPreview(null); }}>
                    Regenerate
                  </button>
                  <button className={styles.primaryBtn} onClick={handleMint}>
                    04  Mint — 0.002 ETH
                  </button>
                </div>
              )}
              {(phase === "authorizing" || phase === "minting") && (
                <button className={styles.primaryBtn} disabled>
                  {phase === "authorizing" ? "Pinning to IPFS…" : "Confirm in wallet…"}
                </button>
              )}
              {phase === "done" && <p className={styles.successText}>Minted. Check your wallet.</p>}
            </div>
          </div>

          <div className={styles.previewCol}>
            <div className={styles.canvas}>
              {preview ? (
                <img src={preview} alt="Mino preview" className={styles.canvasImg} />
              ) : (
                <span className={styles.canvasEmpty}>fill traits, generate to preview</span>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
