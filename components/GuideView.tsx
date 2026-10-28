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
      <div className="flex flex-wrap items-center gap-2">
        <Difficulty value={g.difficulty} />
        <ComposioPill status={g.composio.status} slug={g.composio.slug} />
        {inLibrary ? (
          <span className="font-mono text-xs text-muted">library guide</span>
        ) : (
          <span className="font-mono text-xs text-source">made live by the agent, not reviewed by a person</span>
        )}
      </div>
      <h1 className="mt-3 font-serif text-5xl">{g.app}</h1>
      <p className="mt-3 max-w-3xl text-lg">{g.summary}</p>
      <p className="mt-2 max-w-3xl text-sm text-muted">Why {g.difficulty}: {g.difficultyReason}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[["Time to first test login", g.timeToFirstLogin], ["Time until any user can connect", g.timeToProduction]].map(([label, f]) => (
          <div key={label as string} className="rounded-lg border border-line bg-card p-4">
            <div className="font-mono text-xs uppercase tracking-wide text-muted">{label as string}</div>
            <div className="mt-1 text-xl">{(f as FactT).text}</div>
            <div className="mt-2"><EvidenceBadge level={level(g, f as FactT)} /></div>
            <Source c={f as FactT} />
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-line bg-card p-4 text-sm">
        <span className="font-medium">How sure is this guide? </span>
        {c.checked} claims have a quote we found on the cited page, {c["source-only"]} cite a page we could not check,
        and {c.unsure} have no source. {v ? `A person tested ${v.tested.length} parts by hand.` : "Nobody has tested this setup by hand yet."}
        <span className="text-muted"> Made {g.generatedAt.slice(0, 10)} with {g.model}.</span>
      </div>

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
        <Section title="What a person tested">
          <ul className="rounded-lg border border-tested/30 bg-card px-4">
            {v.tested.map((t, i) => (
              <li key={i} className="border-t border-line py-3 first:border-t-0">
                <div className="flex items-start justify-between gap-3">
                  <span><span className="font-medium">{t.what}.</span> {t.result}</span>
                  <TestedBadge />
                </div>
                <div className="mt-1 font-mono text-xs text-muted">{t.date}{t.minutes != null ? ` · took ${t.minutes} min` : ""} · {v.checkedBy}</div>
              </li>
            ))}
          </ul>
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
                  <span className={`rounded px-1.5 py-px font-mono text-[11px] ${OWNER[s.owner].cls}`}>{OWNER[s.owner].label}</span>
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
              <span className={`font-mono text-xs ${s.ok ? "text-checked" : "text-[var(--hard)]"}`}>{s.ok ? "loaded" : `failed${s.httpStatus ? ` ${s.httpStatus}` : ""}`}</span>
              <a href={s.url} target="_blank" rel="noreferrer" className="break-all underline">{s.url}</a>
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}
