"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Line = { text: string; kind: "step" | "error" };

export function Generate({ needsCode }: { needsCode: boolean }) {
  const router = useRouter();
  const [app, setApp] = useState("");
  const [code, setCode] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const logRef = useRef<HTMLOListElement>(null);
  // Set when the app already has a live-made guide, so the next click runs a fresh one.
  const [found, setFound] = useState<string | null>(null);

  // A running clock, so a long quiet stretch while the agent reads pages does not look hung.
  useEffect(() => {
    if (!busy) return;
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [busy]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);

  async function run(e: React.FormEvent, fresh = false) {
    e.preventDefault();
    if (!app.trim() || busy) return;
    setFound(null);
    setElapsed(0);
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
      <form onSubmit={run} className="flex flex-col gap-3">
        <label className="sr-only" htmlFor="app">App name or website</label>
        <input
          id="app"
          value={app}
          onChange={(e) => setApp(e.target.value)}
          placeholder="Any app, e.g. Notion or zoom.us"
          maxLength={100}
          className="w-full rounded-md border border-line bg-paper px-4 py-3 text-lg outline-none focus:border-ink"
        />
        <div className="flex flex-col gap-3 sm:flex-row">
        {needsCode && (
          <input
            aria-label="Access code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Access code"
            className="min-w-0 flex-1 rounded-md border border-line bg-paper px-4 py-3 outline-none focus:border-ink"
          />
        )}
        <button
          disabled={busy || !app.trim()}
          aria-busy={busy}
          className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-ink px-6 py-3 text-paper ${needsCode ? "" : "sm:flex-1"} transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 ${busy ? "cursor-wait" : "disabled:opacity-40"}`}
        >
          {busy && (
            <svg className="size-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {busy ? "Researching..." : "Make a guide"}
        </button>
        </div>
      </form>
      {found && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a href={`/guides/${found}`} className="rounded-md border border-ink px-3 py-1.5 underline-offset-2 hover:underline">Open the saved guide</a>
          <button onClick={(e) => run(e, true)} className="rounded-md border border-line px-3 py-1.5 hover:border-ink">Make a fresh one (costs a run)</button>
        </div>
      )}
      {lines.length > 0 && (
        <ol ref={logRef} className="mt-4 max-h-80 space-y-1 overflow-y-auto font-mono text-xs" aria-live="polite">
          {lines.map((l, i) => (
            <li key={i} className={l.kind === "error" ? "text-[var(--hard)]" : "text-muted"}>
              <span className="select-none">{l.kind === "error" ? "!  " : "›  "}</span>
              <span className="break-all">{l.text}</span>
            </li>
          ))}
        </ol>
      )}
      {busy && (
        <div className="mt-4" role="status">
          <div className="flex items-center justify-between font-mono text-xs text-muted">
            <span className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-checked opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-checked" />
              </span>
              Agent is working
            </span>
            <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} · usually 1 to 3 min</span>
          </div>
          <div className="loader-track mt-2 h-1 overflow-hidden rounded-full bg-line">
            <div className="loader-bar h-full w-1/3 rounded-full bg-ink" />
          </div>
        </div>
      )}
    </div>
  );
}
