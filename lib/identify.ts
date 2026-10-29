import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { composioStatus } from "./composio";

// A cheap check before the full research run: is this a real app, and does it let other
// apps connect through OAuth? A full run costs many searches; this one costs one or two,
// and a name that fails it never gets a guide page.
const Identity = z.object({
  exists: z.boolean().describe("True only if search results show a real, current software product by this name or website."),
  name: z.string().nullable().describe("The product's usual name, e.g. 'Zoom' for 'zoom.us'. Null if it does not exist."),
  website: z.string().nullable(),
  oauth: z.enum(["yes", "no", "unknown"]).describe("Does it offer OAuth so other apps can act for its users?"),
  evidenceUrl: z.string().nullable().describe("A page you saw that supports the answer."),
  reason: z.string().describe("One plain sentence a developer would understand."),
});

export type IdentifyResult =
  | { ok: true; name: string; source: "composio" | "search"; composioSlug?: string | null }
  | { ok: false; message: string };

export const looksLikeAName = (s: string) => /[a-z]/i.test(s) && s.replace(/[^a-z0-9]/gi, "").length >= 2;

export async function identifyApp(input: string): Promise<IdentifyResult> {
  // Every Composio OAuth toolkit is a real app with OAuth, so no search is needed.
  // This runs first so one-letter names like "X" are found before the name filter.
  const composio = await composioStatus(input).catch(() => null);
  if (composio?.name) return { ok: true, name: composio.name, source: "composio", composioSlug: composio.slug };

  if (!looksLikeAName(input)) return { ok: false, message: "That does not look like an app name or website." };

  const res = await new OpenAI().responses.parse({
    model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
    instructions:
      "Decide if the input names a real software product, and whether it offers OAuth for third-party apps (a developer portal where you register an app and get a client ID). Use web search once or twice. If nothing real matches, say it does not exist. Do not guess.",
    input: `Input: ${input}`,
    tools: [{ type: "web_search" }],
    max_tool_calls: 2,
    reasoning: { effort: "low" },
    text: { format: zodTextFormat(Identity, "identity") },
  });
  const id = res.output_parsed;
  if (!id || !id.exists || !id.name) {
    return { ok: false, message: `I could not find an app called "${input}". Check the spelling, or try its website, like zoom.us.` };
  }
  if (id.oauth === "no") {
    return { ok: false, message: `${id.name} does not seem to offer OAuth for other apps. ${id.reason}` };
  }
  return { ok: true, name: id.name, source: "search", composioSlug: null };
}
