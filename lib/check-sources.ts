import type { GuideDraft, SourceCheck } from "./schema";
import { allCited } from "./evidence";

// Quotes come back with markdown marks (`code`, **bold**) that the page text does not have.
// Dashes of every width count as one plain hyphen on both sides.
const squash = (s: string) =>
  s.toLowerCase().replace(/[`*]/g, "").replace(/[\u2010-\u2015]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, " ").trim();

function pageText(html: string): string {
  return squash(
    html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&[mn]dash;/g, "-").replace(/&[lr]squo;/g, "'").replace(/&[lr]dquo;/g, '"')
      .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
  );
}

async function fetchText(url: string): Promise<{ ok: boolean; status: number | null; text: string }> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { "user-agent": "Mozilla/5.0 (oauth-guides source checker)" },
    });
    return { ok: res.ok, status: res.status, text: res.ok ? pageText(await res.text()) : "" };
  } catch {
    return { ok: false, status: null, text: "" };
  }
}

// Opens every cited page and looks for the quoted words. A claim whose page will not
// load is downgraded to "unsure": we cannot show anyone where it came from.
export async function checkSources(g: GuideDraft): Promise<{ guide: GuideDraft; checks: SourceCheck[] }> {
  const cited = allCited(g).filter((c) => c.sourceUrl);
  const urls = [...new Set(cited.map((c) => c.sourceUrl!))];
  const pages = new Map(await Promise.all(urls.map(async (u) => [u, await fetchText(u)] as const)));

  const checks: SourceCheck[] = urls.map((url) => {
    const p = pages.get(url)!;
    const quotes = cited.filter((c) => c.sourceUrl === url && c.quote).map((c) => ({
      quote: c.quote!,
      // Long quotes often get trimmed or reflowed; the first 80 characters are enough.
      // A trailing full stop is often added by the model, so it is ignored.
      found: p.ok && p.text.includes(squash(c.quote!).replace(/[.;:,]+$/, "").slice(0, 80)),
    }));
    return { url, ok: p.ok, httpStatus: p.status, quotes };
  });

  for (const c of cited) {
    if (!pages.get(c.sourceUrl!)!.ok) c.status = "unsure";
  }
  return { guide: g, checks };
}
