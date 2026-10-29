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
- The developer's AI agent will act inside ${app} for each user: read their data and write to it (send, post, create, update). Research the scopes an agent like that needs, both read and write. Do not stop at "sign in with ${app}"; login-only scopes are not the use case.
- Find: where to create the app, account or plan needed, app types, redirect URI rules, the read and write scopes, which scopes or features need review or verification, how review works and how long it takes, costs or paid API tiers, business or domain verification.
- Always look for limits on apps that are not yet reviewed or approved: user caps (for example a maximum number of users before verification), test mode limits, token expiry in test mode, and lower rate limits for unreviewed or unlisted apps. These are what surprise developers most.

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

Difficulty is about what it takes before real users (not only the developer) can connect with the read and write scopes an agent needs. Optional extras, like a public marketplace listing, do not set the difficulty; mention them as steps.
- easy: self-serve, under an hour, no review and no user cap for those scopes.
- medium: self-serve, but real use hits a review, a user cap, a paid tier, or rate limits that hurt an agent.
- hard: a review or verification that takes days or weeks, a security assessment, or business verification, before real users can connect.
- blocked: needs a partner program or approval most developers will not get.

Write in plain, short sentences. Do not put links or markdown inside text fields; sources go only in sourceUrl.`;
}

// The web search tool adds " ([site](url))" citations inside text. Sources already have
// their own field, so these are removed everywhere except sourceUrl and quote.
const CITE = /\s*\(\[[^\]]*\]\([^)]*\)\)/g;
function stripCitations<T>(v: T, key = ""): T {
  if (typeof v === "string") return (key === "sourceUrl" || key === "quote" ? v : v.replace(CITE, "").trim()) as T;
  if (Array.isArray(v)) return v.map((x) => stripCitations(x)) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stripCitations(x, k)])) as T;
  return v;
}

export async function runAgent(app: string, emit: (e: AgentEvent) => void): Promise<Guide> {
  const client = new OpenAI();
  const started = Date.now();
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
  let searchCalls = 0;
  for await (const ev of stream) {
    if (ev.type === "response.output_item.done" && ev.item.type === "web_search_call") {
      searchCalls++;
      const a = ev.item.action;
      if (a?.type === "search") emit({ type: "step", text: `Searched: ${(a.queries ?? [a.query]).filter(Boolean).join(" | ")}` });
      else if (a?.type === "open_page" && a.url) emit({ type: "step", text: `Read: ${a.url}` });
      else if (a?.type === "find_in_page") emit({ type: "step", text: `Looked for "${a.pattern}" on ${a.url}` });
    } else if (ev.type === "response.output_text.delta" && !writing) {
      writing = true;
      emit({ type: "step", text: "Writing the guide" });
    }
  }
  const final = await stream.finalResponse();
  const parsed = final.output_parsed;
  if (!parsed) throw new Error("The model did not return a guide.");
  // Web search calls and the page text they pull in are most of the cost of a run.
  const usage = {
    searchCalls,
    inputTokens: final.usage?.input_tokens ?? 0,
    cachedInputTokens: final.usage?.input_tokens_details?.cached_tokens ?? 0,
    outputTokens: final.usage?.output_tokens ?? 0,
    seconds: Math.round((Date.now() - started) / 1000),
  };
  emit({ type: "step", text: `Used ${usage.searchCalls} web searches, ${usage.inputTokens.toLocaleString()} input and ${usage.outputTokens.toLocaleString()} output tokens` });
  const draft = stripCitations(parsed);

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
    usage,
  };
}
