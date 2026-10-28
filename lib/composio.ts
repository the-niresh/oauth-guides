import type { ComposioStatus } from "./schema";

// Composio publishes its managed-app list as markdown. Code reads it, not the model,
// so this part of every guide is exact.
const LIST_URL = "https://docs.composio.dev/toolkits/managed-auth.md";

type Row = { name: string; slug: string; managed: boolean };

let cache: { rows: Row[]; at: number } | null = null;

export async function loadComposioList(): Promise<Row[]> {
  if (cache && Date.now() - cache.at < 6 * 3600_000) return cache.rows;
  const rows = parseComposioList(await (await fetch(LIST_URL)).text());
  cache = { rows, at: Date.now() };
  return rows;
}

export function parseComposioList(md: string): Row[] {
  const rows: Row[] = [];
  let managed: boolean | null = null;
  for (const line of md.split("\n")) {
    if (line.startsWith("## Composio-managed")) managed = true;
    else if (line.startsWith("## Bring your own")) managed = false;
    else if (line.startsWith("## ")) managed = null;
    const m = line.match(/^\| \[([^\]]+)\]\([^)]*\) \| `([A-Z0-9_]+)` \|/);
    if (m && managed !== null) rows.push({ name: m[1], slug: m[2], managed });
  }
  return rows;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Names people type that differ from Composio's toolkit names.
const ALIASES: Record<string, string> = { x: "twitter", google: "gmail", googlemail: "gmail" };

export async function composioStatus(app: string): Promise<ComposioStatus> {
  const checkedAt = new Date().toISOString();
  const rows = await loadComposioList();
  let key = norm(app.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\..*$/, ""));
  key = ALIASES[key] ?? key;
  const hit = rows.find((r) => norm(r.name) === key || norm(r.slug) === key);
  if (!hit) return { status: "not_listed", slug: null, name: null, checkedAt };
  return { status: hit.managed ? "managed" : "bring_your_own", slug: hit.slug, name: hit.name, checkedAt };
}

export async function composioCounts() {
  const rows = await loadComposioList();
  const managed = rows.filter((r) => r.managed).length;
  return { managed, bringYourOwn: rows.length - managed };
}
