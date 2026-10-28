import type { Guide, GuideDraft } from "./schema";

export type Level = "checked" | "source-only" | "unsure";

export type Cited = { sourceUrl: string | null; quote: string | null; status: "sourced" | "unsure" };

// checked: the quoted words were found on the cited page by our own fetch.
// source-only: the agent gave a page, but we could not find its quote there
//   (often a page that builds itself with JavaScript, or a loose quote).
// unsure: no source. An estimate or a gap.
export function level(g: Guide, c: Cited): Level {
  if (c.status === "unsure" || !c.sourceUrl) return "unsure";
  const page = g.sourceChecks.find((s) => s.url === c.sourceUrl);
  const hit = page?.quotes.find((q) => q.quote === c.quote);
  return hit?.found ? "checked" : "source-only";
}

export function allCited(g: GuideDraft): Cited[] {
  return [g.timeToFirstLogin, g.timeToProduction, ...g.costs, ...g.requirements, ...g.reviewTriggers, ...g.steps, ...g.blockers];
}

export function counts(g: Guide): Record<Level, number> {
  const out: Record<Level, number> = { checked: 0, "source-only": 0, unsure: 0 };
  for (const c of allCited(g)) out[level(g, c)]++;
  return out;
}
