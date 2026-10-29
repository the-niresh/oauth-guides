import { expect, test } from "bun:test";
import { parseComposioList } from "../lib/composio";
import { level } from "../lib/evidence";
import { slugify, type Guide } from "../lib/schema";
import { looksLikeAName } from "../lib/identify";

test("reads managed and bring-your-own sections of Composio's list", () => {
  const md = [
    "## Composio-managed OAuth available (1)", "| Toolkit | Slug |", "|---|---|",
    "| [GitHub](/toolkits/github.md) | `GITHUB` |",
    "## Bring your own OAuth app (1)", "| Toolkit | Slug |",
    "| [Twitter](/toolkits/twitter.md) | `TWITTER` |",
    "## Something else", "| [Ignored](/x.md) | `IGNORED` |",
  ].join("\n");
  expect(parseComposioList(md)).toEqual([
    { name: "GitHub", slug: "GITHUB", managed: true },
    { name: "Twitter", slug: "TWITTER", managed: false },
  ]);
});

test("evidence level: unsure, checked, source only", () => {
  const g = { sourceChecks: [{ url: "https://a", ok: true, httpStatus: 200, quotes: [{ quote: "yes", found: true }, { quote: "no", found: false }] }] } as unknown as Guide;
  expect(level(g, { status: "unsure", sourceUrl: null, quote: null })).toBe("unsure");
  expect(level(g, { status: "sourced", sourceUrl: "https://a", quote: "yes" })).toBe("checked");
  expect(level(g, { status: "sourced", sourceUrl: "https://a", quote: "no" })).toBe("source-only");
});

test("slugify takes names and websites", () => {
  expect(slugify("Google Drive")).toBe("google-drive");
  expect(slugify("https://www.zoom.us")).toBe("zoom-us");
  expect(slugify("notion.so")).toBe("notion-so");
  expect(slugify("x.com")).toBe("x");
});

test("rejects input that cannot be an app name (Composio names like X are checked first)", () => {
  expect(looksLikeAName("!!!")).toBe(false);
  expect(looksLikeAName("1")).toBe(false);
  expect(looksLikeAName("x.com")).toBe(true);
  expect(looksLikeAName("Notion")).toBe(true);
});
