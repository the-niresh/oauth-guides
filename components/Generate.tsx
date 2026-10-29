"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Line = { text: string; kind: "step" | "error" };

export function Generate({ needsCode }: { needsCode: boolean }) {
  const router = useRouter();
  const [app, setApp] = useState("");
  const [code, setCode] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  // Set when the app already has a live-made guide, so the next click runs a fresh one.
  const [found, setFound] = useState<string | null>(null);

  async function run(e: React.FormEvent, fresh = false) {
    e.preventDefault();
    if (!app.trim() || busy) return;
    setFound(null);
    setBusy(true);
    setLines([{ text: `Starting research on ${app.trim()}. This takes one to three minutes.`, kind: "step" }]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ app: app.trim(), code, fresh }),
      });
      if (res.headers.get("content-type")?.includes("application/json") && res.ok) {
        const hit = (await res.json()) as { existing: string; inLibrary: boolean };
        if (hit.inLibrary) {
          router.push(`/guides/${hit.existing}`);
        } else {
          setFound(hit.existing);
          setLines([{ text: `There is already a guide for ${app.trim()}, made earlier by the agent. Open it, or make a fresh one.`, kind: "step" }]);
        }
        return;
      }
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setLines((l) => [...l, { text: err.error ?? `Request failed (${res.status})`, kind: "error" }]);
        return;
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const parts = buf.split("\n");
        buf = parts.pop() ?? "";
        for (const p of parts.filter(Boolean)) {
          const ev = JSON.parse(p) as { type: string; text?: string; message?: string; slug?: string };
          if (ev.type === "step") setLines((l) => [...l, { text: ev.text!, kind: "step" }]);
          if (ev.type === "error") setLines((l) => [...l, { text: ev.message!, kind: "error" }]);
          if (ev.type === "saved") router.push(`/guides/${ev.slug}`);
        }
      }
    } catch {
      setLines((l) => [...l, { text: "Lost the connection to the agent. Try again.", kind: "error" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink/80 bg-card p-5 shadow-[4px_4px_0_var(--ink)]">
      <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="app">App name or website</label>
        <input
          id="app"
          value={app}
          onChange={(e) => setApp(e.target.value)}
          placeholder="Any app, e.g. Notion or zoom.us"
          maxLength={100}
          className="flex-1 rounded-md border border-line bg-paper px-3 py-2 outline-none focus:border-ink"
        />
        {needsCode && (
          <input
            aria-label="Access code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Access code"
            className="rounded-md border border-line bg-paper px-3 py-2 outline-none focus:border-ink sm:w-36"
          />
        )}
        <button
          disabled={busy || !app.trim()}
          className="rounded-md bg-ink px-4 py-2 text-paper transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
        >
          {busy ? "Researching..." : "Make a guide"}
        </button>
      </form>
      {found && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a href={`/guides/${found}`} className="rounded-md border border-ink px-3 py-1.5 underline-offset-2 hover:underline">Open the saved guide</a>
          <button onClick={(e) => run(e, true)} className="rounded-md border border-line px-3 py-1.5 hover:border-ink">Make a fresh one (costs a run)</button>
        </div>
      )}
      {lines.length > 0 && (
        <ol className="mt-4 max-h-80 space-y-1 overflow-y-auto font-mono text-xs" aria-live="polite">
          {lines.map((l, i) => (
            <li key={i} className={l.kind === "error" ? "text-[var(--hard)]" : "text-muted"}>
              <span className="select-none">{l.kind === "error" ? "!  " : "›  "}</span>
              <span className="break-all">{l.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
