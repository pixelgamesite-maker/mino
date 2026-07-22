import styles from "./PromptTerminal.module.css";

type Props = {
  base: string | null;
  traits: Record<string, string>;
};

const FIELD_ORDER = ["hair", "eyes", "mouth", "cloth", "accessories"] as const;

export default function PromptTerminal({ base, traits }: Props) {
  const lines: string[] = [];
  lines.push(`> base: ${base ?? "—"}`);
  for (const f of FIELD_ORDER) {
    lines.push(`> ${f}: ${traits[f] || ""}`);
  }

  return (
    <div className={styles.terminal} role="status" aria-live="polite">
      <div className={styles.bar}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.title}>prompt.mino</span>
      </div>
      <div className={styles.body}>
        {lines.map((line, i) => (
          <div key={i} className={styles.line}>
            {line}
            {i === lines.length - 1 && <span className={styles.cursor} />}
          </div>
        ))}
      </div>
    </div>
  );
}
