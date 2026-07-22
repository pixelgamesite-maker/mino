import Head from "next/head";
import Link from "next/link";
import styles from "./index.module.css";

const STEPS = [
  { n: "01", title: "Pick your base", body: "Male, female, robot, or pet. Sets your Mino's fixed shape — nothing else changes it." },
  { n: "02", title: "Prompt your traits", body: "Hair, eyes, mouth, cloth, accessories. Five fields, five words each, entirely yours." },
  { n: "03", title: "Preview it", body: "See your exact Mino before you pay a cent. Regenerate until it's right." },
  { n: "04", title: "Mint it", body: "One transaction. The image you approved is the image you own — permanently." },
];

const EXAMPLE_TRAITS = [
  { base: "MALE", hair: "mohawk", eyes: "angry", mouth: "smirk", cloth: "hoodie", accessories: "gold chain" },
  { base: "ROBOT", hair: "antenna", eyes: "sleepy", mouth: "vents", cloth: "plating", accessories: "visor" },
  { base: "PET", hair: "tufted ears", eyes: "curious", mouth: "fangs", cloth: "collar", accessories: "bandana" },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Mino AI — Prompt Your Mint</title>
        <meta name="description" content="Pick a base. Prompt your traits. Mint a one-of-one pixel Mino." />
      </Head>

      <main className={styles.page}>
        <nav className={styles.nav}>
          <span className={styles.wordmark}>MINO_AI</span>
          <Link href="/mint" className={styles.navCta}>Mint →</Link>
        </nav>

        <section className={styles.hero}>
          <p className={styles.eyebrow}>&gt; prompt-to-mint pixel collection_</p>
          <h1 className={styles.h1}>
            You don't pick a Mino.<br />You <span className={styles.accent}>prompt</span> one.
          </h1>
          <p className={styles.heroBody}>
            Four bases. Five traits. One line of text per field, straight into
            the model that draws your character. White canvas, dark base,
            green details — every Mino, every time.
          </p>
          <Link href="/mint" className={styles.primaryCta}>Start minting</Link>
        </section>

        <section className={styles.examples}>
          {EXAMPLE_TRAITS.map((ex) => (
            <div key={ex.base} className={styles.card}>
              <div className={styles.cardSwatch} aria-hidden="true">
                <span className={styles.swatchBase}>{ex.base}</span>
              </div>
              <dl className={styles.cardTraits}>
                <div><dt>hair</dt><dd>{ex.hair}</dd></div>
                <div><dt>eyes</dt><dd>{ex.eyes}</dd></div>
                <div><dt>mouth</dt><dd>{ex.mouth}</dd></div>
                <div><dt>cloth</dt><dd>{ex.cloth}</dd></div>
                <div><dt>accessories</dt><dd>{ex.accessories}</dd></div>
              </dl>
            </div>
          ))}
        </section>

        <section className={styles.steps}>
          {STEPS.map((s) => (
            <div key={s.n} className={styles.step}>
              <span className={styles.stepNum}>{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </section>

        <section className={styles.ctaBand}>
          <p>5,555 Minos. Base and traits fixed at mint. Nothing regenerates twice.</p>
          <Link href="/mint" className={styles.primaryCta}>Prompt your mint</Link>
        </section>

        <footer className={styles.footer}>
          <span>MINO_AI</span>
          <span className={styles.footerMuted}>on Robinhood Chain</span>
        </footer>
      </main>
    </>
  );
}
