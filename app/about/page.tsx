import type { Metadata } from "next";
import Link from "next/link";
import { generatedGuides, getVerification, libraryGuides } from "@/lib/store";
import { composioCounts } from "@/lib/composio";
import { libraryStats } from "@/lib/stats";
import { Toc } from "@/components/Toc";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "How I built the OAuth App Field Guide",
  description: "The problem, the scope I chose and why, how the agent and the checks fit together, and what checking taught me.",
};

const REPO = "https://github.com/the-niresh/oauth-guides";

function H2({ id, n, children }: { id: string; n: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-8 font-serif text-4xl">
      <span className="mr-3 font-mono text-sm text-muted">{n}</span>
      {children}
    </h2>
  );
}

function Insight({ title, children, source }: { title: string; children: React.ReactNode; source?: string }) {
  return (
    <li className="border-t border-line py-5 first:border-t-0">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-1 text-muted">{children}</p>
      {source && <a href={source} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all font-mono text-xs underline">{source}</a>}
    </li>
  );
}

export default async function About() {
  const [lib, gen, cc] = await Promise.all([libraryGuides(), generatedGuides(), composioCounts().catch(() => null)]);
  const live = gen.filter((g) => !lib.some((l) => l.slug === g.slug));
  const stats = libraryStats(lib, live, await Promise.all(lib.map((g) => getVerification(g.slug))));
  const toc = [
    ["problem", "The problem"], ["learned", "What I found"], ["scope", "Scope and why"], ["how", "How it works"],
    ["quality", "What checking caught"], ["metrics", "What I would measure"], ["playbook", "Getting to 100"],
    ["composio", "Where it fits in Composio"], ["limits", "Limits"], ["brief", "The brief, ticked"],
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <nav className="hidden lg:block" aria-label="Sections">
        <Toc items={toc as [string, string][]} />
      </nav>

      <article className="min-w-0 max-w-3xl space-y-20">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">The product case · APM Integrations take-home</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] sm:text-6xl">The form takes an hour. The surprise is what comes after.</h1>
          <p className="mt-5 text-lg">
            I set out to answer one question for a developer before launch: how long until my users can actually
            connect this app to my agent, and what will stop them? This page explains what I found, what I chose to
            build, and how I know the guides are right. The <Link href="/" className="underline">guides</Link> and
            the <a href={REPO} className="underline">source</a> are linked throughout.
          </p>
        </header>

        <section className="space-y-4">
          <H2 id="problem" n="01">The problem</H2>
          <p>
            A developer building an agent on Composio wants their users to connect, say, Gmail. Composio may already
            have its own OAuth app for that provider, which is enough to build and test. But the consent screen then
            says Composio, the rate limit is shared with every other Composio customer, and only the default scopes
            are there. So before launch, most teams need <strong>their own OAuth app</strong>, registered with the
            provider and sometimes approved by them.
          </p>
          <p>
            {cc
              ? `For ${cc.bringYourOwn} of the ${cc.managed + cc.bringYourOwn} OAuth toolkits Composio lists, there is no managed app at all, so this step comes first, not last.`
              : "For many toolkits there is no managed app at all, so this step comes first, not last."}{" "}
            The developer&apos;s real questions are not about the form. They are: <em>is this an hour or six
            weeks? Will something cap me at 100 users? What do I need to have ready? What can I hand off?</em>
          </p>
        </section>

        <section>
          <H2 id="learned" n="02">What I found</H2>
          <p className="mt-3">Researching five providers properly changed what I thought the product was.</p>
          <ul className="mt-4">
            <Insight title="The wait matters more than the setup." >
              For every app in the library, the first test login is estimated at under an hour. They differ by weeks
              in when real users can connect. So each guide gives two times, never one, and the home page charts both.
            </Insight>
            <Insight title="Limits on unreviewed apps are the real trap." source="https://support.google.com/cloud/answer/15549945">
              Gmail lets an unverified app reach 100 users in its lifetime, and Google says that cap cannot be reset.
              A team can ship, hit the cap, and only then learn that verification takes weeks.
            </Insight>
            <Insight title="The rules that hurt agents hide in changelogs." source="https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps">
              Since May 29, 2025, Slack apps shared outside the Marketplace can read message history once a minute,
              15 messages at a time. Setup docs do not mention it. My agent missed it twice; I found it by checking.
            </Insight>
            <Insight title="The scope you need decides the difficulty." source="https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access">
              LinkedIn is easy if your agent posts as the user (that permission is open to every developer) and
              hard if it needs ads or sales data (partner programs). A guide written for &quot;sign in&quot; gets the
              difficulty wrong for an agent, which is exactly what my first run did.
            </Insight>
            <Insight title="Cost and policy are setup steps too.">
              X has no managed app on Composio, charges per request from prepaid credits, and its automation rules
              say AI reply bots need written approval from X. None of that is in the OAuth form.
            </Insight>
          </ul>
        </section>

        <section className="space-y-4">
          <H2 id="scope" n="03">Scope and why</H2>
          <p>
            <strong>Five apps, each hard in a different way</strong>, instead of many thin guides: GitHub (no review at
            all), LinkedIn (easy for posting, gated beyond it), Slack (self-serve, but limits that hurt an agent), X (no
            managed app, paid credits, policy approval) and Gmail (verification of about six weeks and a 100 user cap).
            Together they cover the kinds of blockers a guide has to explain.
          </p>
          <p><strong>What a guide answers</strong>, in the order a developer asks:</p>
          <ol className="list-decimal space-y-1 pl-6">
            <li>How hard is it, and why, for the read and write scopes an agent needs?</li>
            <li>Two times: first test login, and when any user can connect.</li>
            <li>What I need ready, what triggers a review, and what to do when stuck.</li>
            <li>Which steps the agent already did (including the text to paste into review forms), which are mine, and where I wait.</li>
            <li>Do I need my own app on Composio, and when?</li>
          </ol>
          <p><strong>What I chose not to build</strong>, and why:</p>
          <ul className="list-disc space-y-1 pl-6 text-muted">
            <li>An agent that creates OAuth apps in provider consoles. It needs the developer&apos;s own logins and identity checks, and a wrong click there is hard to undo.</li>
            <li>All 100 guides. A small library I checked by hand says more about quality than a large one I did not.</li>
            <li>Accounts and saved lists. Every guide already has its own link to share.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <H2 id="how" n="04">How it works</H2>
          <p>
            It is a workflow with one agent step. Research is the agent, because I cannot predict where each
            provider keeps its rules. Everything that can be known for sure is plain code around it.
          </p>
          <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {[
              ["Code", "Finds the app in Composio's list, or runs a small search to confirm it is real and offers OAuth. Made-up names stop here", "no guide, no full run"],
              ["Agent", "Searches and reads provider docs, decides what to open next, fills a strict guide format", "up to 25 searches"],
              ["Code", "Opens every cited page and looks for each quoted sentence; dead links become unsure", "the gate"],
              ["Person", "Reads the guide against the docs, corrects it, does the setup by hand", "library guides only"],
            ].map(([who, what, note], i) => (
              <li key={i} className={`p-4 ${who === "Agent" ? "bg-ink text-paper" : "bg-card"}`}>
                <div className="font-mono text-xs uppercase tracking-wide opacity-70">{i + 1} · {who}</div>
                <p className="mt-2 text-sm">{what}</p>
                <p className="mt-2 font-mono text-xs opacity-60">{note}</p>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted">
            Every claim ends up as one of: <span className="text-checked">quote checked</span>,{" "}
            <span className="text-source">source only</span> (cited, but the page needs JavaScript or the words differ),{" "}
            <span className="text-unsure">unsure</span>, or <span className="text-tested">tested by hand</span>.
            The model is never allowed to say &quot;tested&quot;.
          </p>
        </section>

        <section className="space-y-4">
          <H2 id="quality" n="05">What checking caught</H2>
          <p>I read every library guide against the providers&apos; docs. The first run had the same kinds of mistakes across several apps:</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="font-mono text-xs uppercase tracking-wide text-muted">
                <tr><th className="py-2 pr-3">Run 1 said</th><th className="py-2 pr-3">Actually</th><th className="py-2">Fixed by</th></tr>
              </thead>
              <tbody>
                {[
                  ["LinkedIn: covered only sign in", "Agents post; posting is open to all developers", "instructions"],
                  ["Gmail: no user cap mentioned", "100 users for life until verified", "instructions"],
                  ["Slack: hard, because of Marketplace review", "Medium; the Marketplace is optional, the history rate limit is not", "hand correction"],
                  ["GitHub: medium", "Easy; GitHub does not review OAuth apps", "hand correction"],
                ].map(([a, b, c]) => (
                  <tr key={a} className="border-t border-line align-top">
                    <td className="py-2 pr-3 text-muted">{a}</td><td className="py-2 pr-3">{b}</td><td className="py-2 font-mono text-xs">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Where the same mistake showed up in several guides, I changed the agent&apos;s instructions instead of the
            files (ask for read and write scopes; always look for user caps and limits on unreviewed apps), then ran
            all five again. What was still wrong I corrected by hand, and each correction is shown on its guide.
          </p>
          <p>
            My own checker was wrong too: it missed true quotes because the model adds markdown marks and full stops
            and pages encode dashes. Fixing that moved found quotes from 66 to 88 of 106 with no new model calls.
            Today <strong>{stats.checkedShare}%</strong> of {stats.claims} claims are quote checked, {stats.unsure} are
            honestly marked unsure, and a person has made <strong>{stats.corrections}</strong> corrections.
          </p>
          <p className="text-sm">
            Full record: <a href={`${REPO}/blob/main/CHECKS.md`} className="underline">CHECKS.md</a> · first run kept
            in <a href={`${REPO}/tree/main/evals/run-1`} className="underline">evals/run-1</a>
          </p>
        </section>

        <section className="space-y-4">
          <H2 id="metrics" n="06">What I would measure</H2>
          <p>If I owned this, three numbers would tell me if it is working. The ones I can measure today are live:</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Supply", [`${stats.library} library guides, ${stats.live} made live`, cc ? `of ${cc.managed + cc.bringYourOwn} OAuth toolkits on Composio` : "", "Would add: requested apps still waiting"]],
              ["Health", [`${stats.checkedShare}% of claims quote checked`, `${stats.corrections} corrections, ${stats.tested} hand tests`, "Would add: guides not rechecked in 30 days"]],
              ["Cost and speed", [stats.avgSeconds ? `${stats.avgSeconds} s and ${stats.avgSearches} searches per live guide` : "not measured yet", stats.avgInputTokens ? `${stats.avgInputTokens.toLocaleString("en")} input tokens per run` : "", "Would add: cost per guide in dollars"]],
            ].map(([title, lines]) => (
              <div key={title as string} className="rounded-xl border border-line bg-card p-4">
                <h3 className="font-mono text-xs uppercase tracking-wide text-muted">{title as string}</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {(lines as string[]).filter(Boolean).map((l) => <li key={l} className={l.startsWith("Would add") ? "text-muted" : ""}>{l}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted">
            The outcome I would watch past these: how many developers who open a guide go on to connect a real user.
            That needs Composio&apos;s data, so it is out of reach here.
          </p>
        </section>

        <section className="space-y-4">
          <H2 id="playbook" n="07">Getting to 100</H2>
          <ol className="space-y-3">
            {[
              ["Generate in batches", "One command per app list. A guide takes one to three minutes."],
              ["Read against a short list", "Difficulty, the two times, user caps, limits on unreviewed apps, Composio status. Corrections are saved and shown."],
              ["Fix causes, not files", "When the same mistake appears twice, change the instructions and rerun, as from run 1 to run 2."],
              ["Recheck on a schedule", "A script reopens every cited page without calling the model. A quote that disappears means the provider changed something."],
              ["Hand-test the hard ones", "Do the setup for every app marked hard, and record the real minutes and blockers."],
            ].map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[2rem_minmax(0,1fr)]">
                <span className="font-mono text-muted">{i + 1}</span>
                <div><span className="font-medium">{t}.</span> <span className="text-muted">{d}</span></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4">
          <H2 id="composio" n="08">Where it fits in Composio</H2>
          <p className="text-muted">These are proposals, not things I built.</p>
          <ul className="space-y-3">
            <li><strong>On each toolkit page and in the create-auth-config screen:</strong> the difficulty, the two times, and &quot;you will need your own app before launch because...&quot;, at the moment the developer decides.</li>
            <li><strong>As a tool for coding agents:</strong> &quot;what does it take to ship with Xero?&quot; answered inside Cursor or Claude Code through MCP, since Composio&apos;s users are agent builders.</li>
            <li><strong>For the integrations team itself:</strong> the same research step, run before a new toolkit is built, and the recheck flagging when a provider changes its rules for toolkits already live.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <H2 id="limits" n="09">Limits</H2>
          <ul className="list-disc space-y-1 pl-6 text-muted">
            <li>The agent reads docs; it does not create apps. Hand tests cover that for library guides.</li>
            <li>It misses rules announced only in changelogs. Next step: search each provider&apos;s changelog on purpose.</li>
            <li>Pages that need JavaScript (Xero) or block automated reads (X&apos;s help center) cannot be quote checked, and say so.</li>
            <li>Time estimates are mostly unsure. Providers rarely publish them.</li>
            <li>Guides made live are checked by code but not read by a person, and are labelled that way.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <H2 id="brief" n="10">The brief, ticked</H2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <tbody>
                {[
                  ["Look up an app and get a guide you can use and share", "Library on the home page; every guide has its own link", true],
                  ["Submit any app; an agent generates a guide in real time", `The box on the home page; ${stats.live} made live so far`, true],
                  ["How easy or difficult", "Difficulty and the reason, at the top of each guide", true],
                  ["Time and effort, including approval waits", "Two times per guide, and the chart on the home page", true],
                  ["Requirements and nuances", "What you need, what triggers a review, if you get stuck", true],
                  ["What an agent can do and where you take over", "Every step marked agent, you, or wait; drafts to paste", true],
                  ["Use agents to investigate and attempt setup", stats.tested ? `Agent research, plus ${stats.tested} parts tested by hand` : "Agent research and drafts; hand tests of setup are being added", stats.tested > 0],
                  ["Be clear about tested, sourced and uncertain", "Evidence label on every claim", true],
                  ["Check a sample against real sources", "Section 05 and CHECKS.md", true],
                  ["Working link, repo, README", "This site, GitHub, README with decisions and limits", true],
                ].map(([ask, where, done]) => (
                  <tr key={ask as string} className="border-t border-line align-top">
                    <td className="py-2 pr-2 font-mono">{done ? <span className="text-checked">✓</span> : <span className="text-source">…</span>}</td>
                    <td className="py-2 pr-3">{ask as string}</td>
                    <td className="py-2 text-muted">{where as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </article>
    </div>
  );
}
