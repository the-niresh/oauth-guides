import type { Level } from "@/lib/evidence";

const LEVEL: Record<Level, { label: string; cls: string; title: string }> = {
  checked: { label: "quote checked", cls: "text-checked border-checked/40 bg-checked/5", title: "We opened the cited page and found these exact words on it." },
  "source-only": { label: "source, not checked", cls: "text-source border-source/40 bg-source/5", title: "The agent cited a page, but our checker could not find the quote on it. Open the link before relying on this." },
  unsure: { label: "unsure", cls: "text-unsure border-unsure/40 bg-unsure/5", title: "No source. An estimate or something the agent could not confirm." },
};

export function EvidenceBadge({ level }: { level: Level }) {
  const l = LEVEL[level];
  return (
    <span title={l.title} className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 font-mono text-xs ${l.cls}`}>
      {l.label}
    </span>
  );
}

export function TestedBadge() {
  return (
    <span title="A person did this setup and recorded the result." className="inline-block whitespace-nowrap rounded border border-tested/40 bg-tested/5 px-2 py-0.5 font-mono text-xs text-tested">
      tested by hand
    </span>
  );
}

const DIFF: Record<string, string> = {
  easy: "bg-[var(--easy)]",
  medium: "bg-[var(--medium)]",
  hard: "bg-[var(--hard)]",
  blocked: "bg-[var(--blocked)]",
};

export function Difficulty({ value }: { value: string }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-white ${DIFF[value] ?? "bg-unsure"}`}>
      {value}
    </span>
  );
}

export function ComposioPill({ status, slug }: { status: string; slug: string | null }) {
  const text =
    status === "managed" ? "Composio has a managed app"
    : status === "bring_your_own" ? "Bring your own app on Composio"
    : "Not a Composio toolkit";
  return (
    <span className="inline-block rounded border border-line bg-card px-2 py-0.5 text-sm text-muted">
      {text}{slug ? ` · ${slug}` : ""}
    </span>
  );
}
