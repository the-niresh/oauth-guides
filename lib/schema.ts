import { z } from "zod";

// What the model may claim about its own evidence. "tested" is never in this list:
// only a person who did the setup can mark something tested (see data/verification).
const Status = z.enum(["sourced", "unsure"]);

const Fact = z.object({
  text: z.string(),
  status: Status,
  sourceUrl: z.string().nullable(),
  quote: z.string().nullable().describe("Exact words copied from sourceUrl. Null if unsure."),
});

const Step = z.object({
  owner: z.enum(["agent", "you", "wait"]),
  title: z.string(),
  detail: z.string(),
  status: Status,
  sourceUrl: z.string().nullable(),
  quote: z.string().nullable(),
});

const Blocker = z.object({
  problem: z.string(),
  whatToDo: z.string(),
  status: Status,
  sourceUrl: z.string().nullable(),
  quote: z.string().nullable(),
});

// The shape the model must return. Strict structured output, so every field is required.
export const GuideDraft = z.object({
  app: z.string(),
  website: z.string().nullable(),
  developerPortalUrl: z.string().nullable(),
  summary: z.string().describe("Two sentences: what setup involves and the main catch."),
  difficulty: z.enum(["easy", "medium", "hard", "blocked"]),
  difficultyReason: z.string(),
  timeToFirstLogin: Fact.describe("Time until a developer can log in a test user, e.g. '15 to 30 minutes'."),
  timeToProduction: Fact.describe("Time until any user can connect, including review or approval waits."),
  timeline: z.object({
    setupMinutes: z.number().nullable().describe("Upper estimate of minutes to the first test login."),
    waitDays: z.number().nullable().describe("Days after setup until any user can connect with the scopes an agent needs. 0 = same day. Null if unknown."),
    optionalPath: z.object({ label: z.string(), days: z.number() }).nullable()
      .describe("An optional longer path many developers take, e.g. a marketplace listing. Null if none."),
  }).describe("The two times as numbers, for the chart. Must agree with timeToFirstLogin and timeToProduction."),
  costs: z.array(Fact).describe("Paid plans, API tiers or fees needed. Empty if none found."),
  requirements: z.array(Fact),
  reviewTriggers: z.array(Fact).describe("Which scopes, features or user counts trigger a review."),
  steps: z.array(Step),
  blockers: z.array(Blocker),
  agentDrafts: z.array(z.object({ title: z.string(), text: z.string() }))
    .describe("Text the agent wrote for the developer to paste, e.g. app description, scope reasons."),
  openQuestions: z.array(z.string()).describe("Things you could not confirm from sources."),
});

export type GuideDraft = z.infer<typeof GuideDraft>;
export type FactT = z.infer<typeof Fact>;

export type ComposioStatus = {
  status: "managed" | "bring_your_own" | "not_listed";
  slug: string | null;
  name: string | null;
  checkedAt: string;
};

export type SourceCheck = {
  url: string;
  ok: boolean;
  httpStatus: number | null;
  // False when the page loaded but has almost no text without JavaScript, so quotes cannot be checked.
  readable?: boolean;
  // Quotes from this page, and whether each one was found in the page text.
  quotes: { quote: string; found: boolean }[];
};

export type Guide = GuideDraft & {
  slug: string;
  generatedAt: string;
  model: string;
  composio: ComposioStatus;
  sourceChecks: SourceCheck[];
  // Missing on guides made before cost logging was added.
  usage?: { searchCalls: number; inputTokens: number; cachedInputTokens: number; outputTokens: number; seconds: number };
};

// Written by a person after a real setup attempt. Shown on top of the agent's guide.
export type Verification = {
  checkedBy: string;
  tested: { what: string; result: string; minutes: number | null; date: string }[];
  corrections: { agentSaid: string; actually: string; source: string | null }[];
  notes: string[];
};

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\.(com|io|dev|org|net|ai|co)(\/.*)?$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
