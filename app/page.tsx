import Link from "next/link";
import { generatedGuides, getVerification, libraryGuides } from "@/lib/store";
import { composioCounts } from "@/lib/composio";
import { counts } from "@/lib/evidence";
import type { Guide } from "@/lib/schema";
import { Generate } from "@/components/Generate";
import { ComposioPill, Difficulty } from "@/components/badges";

export const dynamic = "force-dynamic";

const ORDER = { easy: 0, medium: 1, hard: 2, blocked: 3 };

async function Row({ g }: { g: Guide }) {
  const c = counts(g);
  const v = await getVerification(g.slug);
  return (
    <tr className="border-t border-line align-top">
      <td className="py-3 pr-3">
        <Link href={`/guides/${g.slug}`} className="font-medium underline">{g.app}</Link>
        <div className="mt-1"><ComposioPill status={g.composio.status} slug={null} /></div>
      </td>
      <td className="py-3 pr-3"><Difficulty value={g.difficulty} /></td>
      <td className="py-3 pr-3 text-sm">{g.timeToFirstLogin.text}</td>
      <td className="py-3 pr-3 text-sm">{g.timeToProduction.text}</td>
      <td className="py-3 font-mono text-xs whitespace-nowrap">
        <span className="text-checked">{c.checked} checked</span><br />
        <span className="text-source">{c["source-only"]} source only</span><br />
        <span className="text-unsure">{c.unsure} unsure</span>
        {v && <><br /><span className="text-tested">{v.tested.length} tested</span></>}
      </td>
    </tr>
  );
}

function Table({ guides }: { guides: Guide[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead className="font-mono text-xs uppercase tracking-wide text-muted">
          <tr><th className="pb-2">App</th><th className="pb-2">Difficulty</th><th className="pb-2">First test login</th><th className="pb-2">Any user can connect</th><th className="pb-2">Evidence</th></tr>
        </thead>
        <tbody>{guides.map((g) => <Row key={g.slug} g={g} />)}</tbody>
      </table>
    </div>
  );
}

export default async function Home() {
  const [lib, gen, cc] = await Promise.all([libraryGuides(), generatedGuides(), composioCounts().catch(() => null)]);
  lib.sort((a, b) => ORDER[a.difficulty] - ORDER[b.difficulty]);
  const live = gen.filter((g) => !lib.some((l) => l.slug === g.slug)).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  const all = [...lib, ...live].map(counts);
  const sum = (k: "checked" | "source-only" | "unsure") => all.reduce((n, c) => n + c[k], 0);

  return (
    <>
      <section className="max-w-3xl">
        <h1 className="font-serif text-5xl leading-tight">Will my OAuth app take an hour, or six weeks?</h1>
        <p className="mt-4 text-lg">
          Before your users can connect an app to your agent, you may need your own OAuth app with that provider, and
          sometimes their approval. Look an app up to see how hard it is, how long it takes, what can block you, and
          which parts an agent can do for you. Every claim shows its evidence.
        </p>
        {cc && (
          <p className="mt-3 text-sm text-muted">
            Composio lists {cc.managed + cc.bringYourOwn} OAuth toolkits. {cc.bringYourOwn} of them have no managed app,
            so every developer has to make their own.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wide text-muted">Any app, researched live by an agent</h2>
        <Generate needsCode={Boolean(process.env.ACCESS_CODE)} />
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-3xl">Library</h2>
          <p className="font-mono text-xs text-muted">
            {lib.length} checked guides · {live.length} made live · claims: {sum("checked")} quote checked, {sum("source-only")} source only, {sum("unsure")} unsure
          </p>
        </div>
        <p className="mt-1 text-sm text-muted">Library guides were made by the agent, then read and corrected by a person.</p>
        <div className="mt-4"><Table guides={lib} /></div>
      </section>

      {live.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-3xl">Made live</h2>
          <p className="mt-1 text-sm text-muted">Made by the agent on request. No person has reviewed these.</p>
          <div className="mt-4"><Table guides={live} /></div>
        </section>
      )}

      <section className="mt-12 rounded-lg border border-line p-4 text-sm text-muted">
        <span className="font-medium text-ink">How to read the evidence. </span>
        <span className="text-checked">Quote checked</span>: our code opened the cited page and found the quoted words.{" "}
        <span className="text-source">Source only</span>: a page is cited, but the quote was not found on it (some pages load with JavaScript). Open the link.{" "}
        <span className="text-unsure">Unsure</span>: no source, often a time estimate.{" "}
        <span className="text-tested">Tested</span>: a person did this setup and wrote down what happened.
      </section>
    </>
  );
}
