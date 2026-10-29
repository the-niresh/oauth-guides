import Link from "next/link";
import type { Guide, Verification, FactT } from "@/lib/schema";
import { counts, level, type Cited } from "@/lib/evidence";
import { ComposioPill, Difficulty, EvidenceBadge, TestedBadge } from "./badges";

const OWNER: Record<string, { label: string; cls: string }> = {
  agent: { label: "Agent did this", cls: "bg-checked/10 text-checked" },
  you: { label: "You do this", cls: "bg-ink/5 text-ink" },
  wait: { label: "You wait", cls: "bg-source/10 text-source" },
};

function Source({ c }: { c: Cited }) {
  if (!c.sourceUrl) return null;
  let host = c.sourceUrl;
  try { host = new URL(c.sourceUrl).host + new URL(c.sourceUrl).pathname; } catch {}
  return (
    <div className="mt-1 text-xs text-muted">
      {c.quote && <span className="italic">“{c.quote}” </span>}
      <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="break-all underline">{host}</a>
    </div>
  );
}

function FactRow({ g, f }: { g: Guide; f: FactT }) {
  return (
    <li className="border-t border-line py-3 first:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <span>{f.text}</span>
        <EvidenceBadge level={level(g, f)} />
      </div>
      <Source c={f} />
    </li>
  );
}

function Section({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl">{title}</h2>
      {empty ? <p className="mt-2 text-sm text-muted">Nothing found.</p> : <div className="mt-3">{children}</div>}
    </section>
  );
}

export function GuideView({ g, v, inLibrary }: { g: Guide; v: Verification | null; inLibrary: boolean }) {
  const c = counts(g);
  return (
    <article>
      <Link href="/" className="font-mono text-xs text-muted no-underline hover:text-ink">← All guides</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            OAuth app setup · {inLibrary ? "library guide, read and corrected by a person" : <span className="text-source">made live by the agent, not yet read by a person</span>}
          </p>
          <h1 className="mt-3 font-serif text-6xl leading-none">{g.app}</h1>
          <p className="mt-4 text-lg">{g.summary}</p>
          <p className="mt-3 text-sm text-muted"><span className="font-medium text-ink">Why {g.difficulty}:</span> {g.difficultyReason}</p>
          <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs">
            {(["agent", "you", "wait"] as const).map((o) => {
              const n = g.steps.filter((s) => s.owner === o).length;
              return n ? <span key={o} className={`rounded px-2 py-1 ${OWNER[o].cls}`}>{OWNER[o].label}: {n} step{n > 1 ? "s" : ""}</span> : null;
            })}
          </div>
        </div>

        <aside className="rounded-xl border border-ink/80 bg-card p-5 shadow-[4px_4px_0_var(--ink)]" aria-label="Verdict">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">Verdict</span>
            <Difficulty value={g.difficulty} />
          </div>
          {[["First test login", g.timeToFirstLogin], ["Any user can connect", g.timeToProduction]].map(([label, f]) => (
            <div key={label as string} className="mt-4 border-t border-line pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs uppercase tracking-wide text-muted">{label as string}</span>
                <EvidenceBadge level={level(g, f as FactT)} />
              </div>
              <div className="mt-1 text-lg leading-snug">{(f as FactT).text}</div>
            </div>
          ))}
          <div className="mt-4 border-t border-line pt-3">
            <div className="font-mono text-xs uppercase tracking-wide text-muted">On Composio</div>
            <div className="mt-1"><ComposioPill status={g.composio.status} slug={g.composio.slug} /></div>
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wide text-muted">
              <span>Evidence</span><span>{c.checked + c["source-only"] + c.unsure} claims</span>
            </div>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-line">
              <div className="bg-checked" style={{ flexGrow: c.checked }} />
              <div className="bg-source" style={{ flexGrow: c["source-only"] }} />
              <div className="bg-unsure/50" style={{ flexGrow: c.unsure }} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-xs">
              <span className="text-checked">{c.checked} checked</span>
              <span className="text-source">{c["source-only"]} source only</span>
              <span className="text-unsure">{c.unsure} unsure</span>
              {v?.tested.length ? <span className="text-tested">{v.tested.length} tested</span> : null}
              {v?.corrections.length ? <span>{v.corrections.length} corrected</span> : null}
            </div>
          </div>
        </aside>
      </div>

      <p className="mt-6 text-sm text-muted">
        {g.sourceChecks.some((s) => s.ok && s.readable === false) && "Some cited pages only show text with JavaScript, so their quotes could not be checked by code. "}
        {v?.tested.length ? "" : "This setup has not been tested by hand yet. "}
        Researched {g.generatedAt.slice(0, 10)} by the agent
        {g.usage ? `, using ${g.usage.searchCalls} web searches in ${g.usage.seconds} seconds` : ""}.
      </p>

      {g.composio.status !== "not_listed" && (
        <div className="mt-4 rounded-lg border border-line p-4 text-sm">
          <span className="font-medium">On Composio: </span>
          {g.composio.status === "managed"
            ? "Composio has its own OAuth app for this toolkit, so you can build and test without making one. Make your own when you need your name on the consent screen, scopes beyond Composio's defaults, your own rate limit, or triggers faster than every 15 minutes."
            : "Composio has no managed OAuth app for this toolkit. You have to make your own app before any user can connect, then paste its client ID and secret into a Composio auth config."}{" "}
          The redirect URI to register is shown in the Composio dashboard when you create the auth config.{" "}
          <a className="underline" href="https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app" target="_blank" rel="noreferrer">Composio docs</a>
          <span className="text-muted"> · list checked {g.composio.checkedAt.slice(0, 10)}</span>
        </div>
      )}

      {v && (
        <Section title="What a person found">
          {v.tested.length === 0 && <p className="text-sm text-muted">Read against the sources by a person. The setup itself has not been tested by hand yet.</p>}
          {v.tested.length > 0 && <ul className="rounded-lg border border-tested/30 bg-card px-4">
            {v.tested.map((t, i) => (
              <li key={i} className="border-t border-line py-3 first:border-t-0">
                <div className="flex items-start justify-between gap-3">
                  <span><span className="font-medium">{t.what}.</span> {t.result}</span>
                  <TestedBadge />
                </div>
                <div className="mt-1 font-mono text-xs text-muted">{t.date}{t.minutes != null ? ` · took ${t.minutes} min` : ""} · {v.checkedBy}</div>
              </li>
            ))}
          </ul>}
          {v.corrections.length > 0 && (
            <>
              <h3 className="mt-6 font-medium">What we corrected after checking</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {v.corrections.map((x, i) => (
                  <li key={i} className="rounded border border-line bg-card p-3">
                    <div className="text-muted line-through">{x.agentSaid}</div>
                    <div className="mt-1">{x.actually}</div>
                    {x.source && <a className="mt-1 block break-all text-xs underline" href={x.source} target="_blank" rel="noreferrer">{x.source}</a>}
                  </li>
                ))}
              </ul>
            </>
          )}
          {v.notes.length > 0 && <ul className="mt-4 list-disc pl-5 text-sm">{v.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
        </Section>
      )}

      <Section title="Steps">
        <ol className="space-y-3">
          {g.steps.map((s, i) => (
            <li key={i} className="grid grid-cols-[2rem_minmax(0,1fr)] rounded-lg border border-line bg-card p-4">
              <span className="font-mono text-muted">{i + 1}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-1.5 py-px font-mono text-xs ${OWNER[s.owner].cls}`}>{OWNER[s.owner].label}</span>
                  <span className="font-medium">{s.title}</span>
                  <EvidenceBadge level={level(g, s)} />
                </div>
                <p className="mt-1 text-sm">{s.detail}</p>
                <Source c={s} />
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="What you need" empty={!g.requirements.length && !g.costs.length}>
        <ul className="rounded-lg border border-line bg-card px-4">
          {[...g.costs, ...g.requirements].map((f, i) => <FactRow key={i} g={g} f={f} />)}
        </ul>
      </Section>

      <Section title="What triggers a review" empty={!g.reviewTriggers.length}>
        <ul className="rounded-lg border border-line bg-card px-4">
          {g.reviewTriggers.map((f, i) => <FactRow key={i} g={g} f={f} />)}
        </ul>
      </Section>

      <Section title="If you get stuck" empty={!g.blockers.length}>
        <ul className="space-y-3">
          {g.blockers.map((b, i) => (
            <li key={i} className="rounded-lg border border-line bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium">{b.problem}</span>
                <EvidenceBadge level={level(g, b)} />
              </div>
              <p className="mt-1 text-sm">{b.whatToDo}</p>
              <Source c={b} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Text the agent wrote for you" empty={!g.agentDrafts.length}>
        <div className="space-y-3">
          {g.agentDrafts.map((d, i) => (
            <div key={i} className="rounded-lg border border-line bg-card p-4">
              <div className="font-mono text-xs uppercase tracking-wide text-muted">{d.title}</div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{d.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Not confirmed" empty={!g.openQuestions.length}>
        <ul className="list-disc space-y-1 pl-5 text-sm">{g.openQuestions.map((q, i) => <li key={i}>{q}</li>)}</ul>
      </Section>

      <Section title="Every page the agent cited">
        <ul className="space-y-1 text-sm">
          {g.sourceChecks.map((s) => (
            <li key={s.url} className="flex gap-2">
              <span className={`shrink-0 font-mono text-xs ${!s.ok ? "text-[var(--hard)]" : s.readable === false ? "text-source" : "text-checked"}`}>
                {!s.ok ? `failed${s.httpStatus ? ` ${s.httpStatus}` : ""}` : s.readable === false ? "needs JavaScript, quotes not checkable" : "loaded"}
              </span>
              <a href={s.url} target="_blank" rel="noreferrer" className="break-all underline">{s.url}</a>
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}
