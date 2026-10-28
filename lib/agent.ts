import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { GuideDraft, slugify, type Guide } from "./schema";
import { composioStatus } from "./composio";
import { checkSources } from "./check-sources";
import { allCited } from "./evidence";

export const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

export type AgentEvent =
  | { type: "step"; text: string }
  | { type: "done"; guide: Guide }
  | { type: "error"; message: string };

const COMPOSIO_NOTE = {
  managed:
    "Composio already has a managed OAuth app for this toolkit, so a developer can test without their own app. They still need their own app for their own name on the consent screen, scopes beyond Composio's defaults, their own rate limit, or triggers faster than every 15 minutes.",
  bring_your_own:
    "Composio has NO managed OAuth app for this toolkit. Every developer must register their own OAuth app and paste its client ID and secret into Composio.",
  not_listed:
    "This app is not in Composio's OAuth toolkit list. The developer would be building the integration themselves.",
};

function instructions(app: string, composio: string) {
  return `You research how a developer sets up an OAuth app with "${app}" and gets it approved, so their AI agent's users can connect their ${app} accounts.

Composio context (checked by code, true): ${composio}
In Composio, the redirect URI to register is shown in the Composio dashboard when you create the auth config. Do not invent a redirect URI.

How to research:
- Use web search. Prefer the provider's own developer docs, policy pages and official forums. Third-party blogs only when official docs say nothing, and say so in the text.
- Find: where to create the app, account or plan needed, app types, redirect URI rules, scopes, which scopes or features need review or verification, how review works and how long it takes, costs or paid API tiers, business or domain verification, rate limits for new apps, test or development mode limits (for example a cap on test users).

Evidence rules (most important):
- status "sourced" only when a page you actually opened says it. Put that page in sourceUrl and copy a short exact sentence from it into quote, word for word. Do not paraphrase inside quote.
- If you are estimating, or the docs do not say, use status "unsure", sourceUrl null, quote null, and say it is an estimate in the text.
- Time estimates are often not in docs. It is fine to mark them unsure. Never invent a number of days and call it sourced.
- Put anything you could not confirm in openQuestions.

Steps:
- owner "agent": things you have already done for the developer in this guide (for example the drafts below).
- owner "you": anything that needs the developer's own account, payment, identity or a decision.
- owner "wait": waiting on the provider (review, approval, partner application).
- Order the steps from first to last. Keep each detail short and specific: exact page names, buttons, fields.

agentDrafts: write text the developer can paste, such as the app description, and for each scope that needs review, one or two sentences on why the app needs it. Write them for an AI agent product that acts for the user.

Difficulty: easy = self-serve in under an hour with no review for common scopes; medium = self-serve but review or limits for real use; hard = review that takes days or weeks, or business verification; blocked = needs a partner program or approval most developers will not get.

Write in plain, short sentences.`;
}

export async function runAgent(app: string, emit: (e: AgentEvent) => void): Promise<Guide> {
  const client = new OpenAI();
  emit({ type: "step", text: `Checking Composio's toolkit list for ${app}` });
  const composio = await composioStatus(app);
  emit({
    type: "step",
    text: composio.status === "managed" ? `Composio has a managed app (${composio.slug})`
      : composio.status === "bring_your_own" ? `Composio has no managed app (${composio.slug}): bring your own`
      : "Not in Composio's OAuth toolkit list",
  });

  const stream = client.responses.stream({
    model: MODEL,
    instructions: instructions(app, COMPOSIO_NOTE[composio.status]),
    input: `Write the OAuth setup guide for: ${app}`,
    tools: [{ type: "web_search" }],
    max_tool_calls: Number(process.env.MAX_TOOL_CALLS ?? 25),
    reasoning: { effort: "medium" },
    text: { format: zodTextFormat(GuideDraft, "guide") },
  });

  let writing = false;
  for await (const ev of stream) {
    if (ev.type === "response.output_item.done" && ev.item.type === "web_search_call") {
      const a = ev.item.action;
      if (a?.type === "search") emit({ type: "step", text: `Searched: ${(a.queries ?? [a.query]).filter(Boolean).join(" | ")}` });
      else if (a?.type === "open_page" && a.url) emit({ type: "step", text: `Read: ${a.url}` });
      else if (a?.type === "find_in_page") emit({ type: "step", text: `Looked for "${a.pattern}" on ${a.url}` });
    } else if (ev.type === "response.output_text.delta" && !writing) {
      writing = true;
      emit({ type: "step", text: "Writing the guide" });
    }
  }
  const draft = (await stream.finalResponse()).output_parsed;
  if (!draft) throw new Error("The model did not return a guide.");

  const cited = new Set(allCited(draft).map((c) => c.sourceUrl).filter(Boolean));
  emit({ type: "step", text: `Opening ${cited.size} cited pages to check the quotes` });
  const { guide, checks } = await checkSources(draft);
  const quotes = checks.flatMap((c) => c.quotes);
  emit({
    type: "step",
    text: `Quotes found on the page: ${quotes.filter((q) => q.found).length} of ${quotes.length}. Pages that failed to load: ${checks.filter((c) => !c.ok).length}`,
  });

  return {
    ...guide,
    slug: slugify(app),
    generatedAt: new Date().toISOString(),
    model: MODEL,
    composio,
    sourceChecks: checks,
  };
}
