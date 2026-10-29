import type { Metadata } from "next";
import Link from "next/link";
import { generatedGuides, getVerification, libraryGuides } from "@/lib/store";
import { counts } from "@/lib/evidence";
import type { Guide } from "@/lib/schema";
import { ComposioPill, Difficulty } from "@/components/badges";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "All guides · OAuth App Field Guide" };

const ORDER = { easy: 0, medium: 1, hard: 2, blocked: 3 };

async function Row({ g, inLibrary }: { g: Guide; inLibrary: boolean }) {
  const c = counts(g);
  const v = inLibrary ? await getVerification(g.slug) : null;
  return (
    <tr className="border-t border-line align-top">
      <td className="py-4 pr-4">
        <Link href={`/guides/${g.slug}`} className="text-lg font-medium underline">{g.app}</Link>
        <div className="mt-1.5"><ComposioPill status={g.composio.status} slug={null} /></div>
      </td>
      <td className="py-4 pr-4"><Difficulty value={g.difficulty} /></td>
      <td className="py-4 pr-4">{g.timeToFirstLogin.text}</td>
      <td className="py-4 pr-4">{g.timeToProduction.text}</td>
      <td className="py-4 pr-4 font-mono text-sm whitespace-nowrap">
        <span className="text-checked">{c.checked} quote checked</span><br />
        <span className="text-source">{c["source-only"]} source only</span><br />
        <span className="text-unsure">{c.unsure} unsure</span>
      </td>
      <td className="py-4 text-sm">
        {inLibrary ? "Read by a person" : <span className="text-source">Made live, not yet read by a person</span>}
        {v?.corrections.length ? <div className="text-muted">{v.corrections.length} corrected</div> : null}
        <div className="text-muted">{v?.tested.length ? `${v.tested.length} parts tested by hand` : "Not tested by hand yet"}</div>
        <div className="font-mono text-xs text-muted">{g.generatedAt.slice(0, 10)}</div>
      </td>
    </tr>
  );
}

function Table({ guides, inLibrary }: { guides: Guide[]; inLibrary: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-card px-4 sm:px-6">
      <table className="w-full min-w-[820px] text-left">
        <thead className="font-mono text-xs uppercase tracking-wide text-muted">
          <tr>{["App", "Difficulty", "First test login", "Any user can connect", "Evidence", "Review"].map((h) => <th key={h} className="pt-4 pr-4 pb-2 align-bottom font-normal">{h}</th>)}</tr>
        </thead>
        <tbody>{guides.map((g) => <Row key={g.slug} g={g} inLibrary={inLibrary} />)}</tbody>
      </table>
    </div>
  );
}

export default async function GuidesPage() {
  const [lib, gen] = await Promise.all([libraryGuides(), generatedGuides()]);
  lib.sort((a, b) => ORDER[a.difficulty] - ORDER[b.difficulty]);
  const live = gen.filter((g) => !lib.some((l) => l.slug === g.slug)).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  return (
    <>
      <h1 className="font-serif text-5xl">All guides</h1>
      <p className="mt-3 max-w-2xl text-lg">
        {lib.length} library guides, read and corrected by a person, and {live.length} made live by the agent when someone
        asked for an app. <Link href="/#research" className="underline">Look up another app</Link>.
      </p>

      <h2 className="mt-12 font-serif text-3xl">Library</h2>
      <p className="mt-1 text-muted">Researched by the agent, checked by code, then read and corrected by a person.</p>
      <div className="mt-4"><Table guides={lib} inLibrary /></div>

      <h2 className="mt-12 font-serif text-3xl">Made live by the agent</h2>
      <p className="mt-1 text-muted">Every app someone has looked up here. Checked by code; no person has read these yet.</p>
      <div className="mt-4">
        {live.length ? <Table guides={live} inLibrary={false} /> : <p className="text-muted">None yet.</p>}
      </div>
    </>
  );
}
