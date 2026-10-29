import Link from "next/link";
import { generatedGuides, getVerification, libraryGuides } from "@/lib/store";
import { composioCounts } from "@/lib/composio";
import { libraryStats } from "@/lib/stats";
import type { Guide } from "@/lib/schema";
import { Generate } from "@/components/Generate";
import { TimeChart } from "@/components/TimeChart";
import { ComposioPill, Difficulty } from "@/components/badges";

export const dynamic = "force-dynamic";

const endMinutes = (g: Guide) => (g.timeline?.setupMinutes ?? 0) + (g.timeline?.waitDays ?? 9999) * 1440;

function Stat({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div>
      <div className="font-serif text-4xl leading-none">{value}</div>
      <div className="mt-2 text-sm">{label}</div>
      {note && <div className="mt-0.5 font-mono text-xs text-muted">{note}</div>}
    </div>
  );
}

export default async function Home() {
  const [lib, gen, cc] = await Promise.all([libraryGuides(), generatedGuides(), composioCounts().catch(() => null)]);
  lib.sort((a, b) => endMinutes(a) - endMinutes(b));
  const live = gen.filter((g) => !lib.some((l) => l.slug === g.slug)).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  const stats = libraryStats(lib, live, await Promise.all(lib.map((g) => getVerification(g.slug))));
  const total = cc ? cc.managed + cc.bringYourOwn : 0;

  return (
    <>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.14em] text-muted">For developers whose agents connect to their users&apos; apps</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.02] sm:text-7xl">Will my OAuth app take an hour, or six&nbsp;weeks?</h1>
        </div>
        <p className="text-lg lg:pb-2">
          Before your users can connect an app to your agent, you may need your own OAuth app with that provider,
          and their approval. Each guide tells you how hard it is, how long, what can block you, and which steps
          an agent already did for you. Every claim shows its evidence.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="research">
        <h2 id="research" className="mb-3 font-mono text-sm uppercase tracking-wide text-muted">Look up any app, researched live by an agent</h2>
        <Generate needsCode={Boolean(process.env.ACCESS_CODE)} guides={[...lib, ...live].map((g) => ({ slug: g.slug, app: g.app }))} />
      </section>

      {cc && (
        <section className="mt-16 grid gap-6 border-y border-line py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-center">
          <p className="text-lg">
            Composio lists <strong>{total} OAuth toolkits</strong>. For <strong>{cc.bringYourOwn}</strong> of them there is no
            managed app, so every developer has to make their own. For the rest, the managed app gets you through
            testing, but production usually needs your own: your name on the consent screen, your own rate limit,
            more scopes.
          </p>
          <div>
            <div className="flex h-9 overflow-hidden rounded-md border border-ink/70">
              <div className="flex items-center bg-card px-3 font-mono text-xs" style={{ width: `${(cc.managed / total) * 100}%` }}>
                {cc.managed} managed
              </div>
              <div className="flex flex-1 items-center bg-ink px-3 font-mono text-xs text-paper">{cc.bringYourOwn} bring your own app</div>
            </div>
            <p className="mt-2 font-mono text-xs text-muted">Read from Composio&apos;s managed-auth list by code, refreshed every 6 hours.</p>
          </div>
        </section>
      )}

      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-4xl">An hour, or six weeks</h2>
            <p className="mt-1 max-w-2xl text-muted">
              Setup takes under an hour almost everywhere. The difference is the wait before real users can connect.
              Five apps, chosen because each one is hard in a different way.
            </p>
          </div>
          <Link href="/about#scope" className="font-mono text-xs underline">why these five</Link>
        </div>
        <div className="mt-6 rounded-xl border border-line bg-card p-4 sm:p-6">
          <TimeChart guides={lib} />
        </div>
      </section>

      <section className="mt-16 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div>
          <h2 className="font-serif text-3xl">How sure is the library?</h2>
          <p className="mt-2 text-muted">
            The agent researches. Code checks every quote against the page it cites. A person corrects what is
            still wrong. These numbers come straight from the guide files.
          </p>
          <Link href="/about#quality" className="mt-3 inline-block font-mono text-xs underline">what the checks caught</Link>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          <Stat value={`${stats.checkedShare}%`} label="claims quote checked" note={`${stats.checked} of ${stats.claims}`} />
          <Stat value={String(stats.corrections)} label="corrections by a person" note="shown on each guide" />
          <Stat value={String(stats.library)} label="guides read by a person" note={`plus ${stats.live} made live`} />
          <Stat value={String(stats.unsure)} label="claims marked unsure" note="said, not guessed" />
          <Stat value={stats.avgSeconds ? `${stats.avgSeconds}s` : "-"} label="for a live guide" note={stats.measuredRuns ? `average of ${stats.measuredRuns} measured runs` : "not measured yet"} />
          <Stat value={stats.avgSearches !== null ? String(stats.avgSearches) : "-"} label="web searches per guide" note="most of the cost of a run" />
        </div>
      </section>

      {live.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-3xl">Made live by the agent</h2>
          <p className="mt-1 text-sm text-muted">Requested on this site. Checked by code, not yet read by a person.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {live.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="flex items-center gap-2 rounded-full border border-line bg-card py-1.5 pr-3 pl-1.5 no-underline transition hover:border-ink">
                  <Difficulty value={g.difficulty} />
                  <span className="text-sm">{g.app}</span>
                  <ComposioPill status={g.composio.status} slug={null} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-20 rounded-xl bg-ink p-6 text-paper sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.18em] opacity-70">The product case</p>
        <h2 className="mt-3 max-w-2xl font-serif text-4xl">How I built this: the problem, the scope I chose, and what checking taught me</h2>
        <Link href="/about" className="mt-6 inline-block rounded-md bg-paper px-4 py-2 text-ink no-underline transition hover:opacity-90">
          Read the case
        </Link>
      </section>
    </>
  );
}
