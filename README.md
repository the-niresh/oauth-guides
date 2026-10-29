# OAuth App Field Guide

**Will my OAuth app take an hour, or six weeks?**

An agent builder whose users connect GitHub, Gmail or X often needs their own OAuth app with
that provider first, and sometimes the provider's approval. Composio lists 382 OAuth toolkits,
and 258 of them have no Composio-managed app, so every developer has to make their own. The
hard part is not the form. It is not knowing what is coming: a review that takes weeks, a cap of
100 users, a paid tier, a rate limit that quietly breaks the agent.

This app gives a guide per provider and lets you request a guide for any app, researched live by
an agent. Every claim shows how sure it is.

- Live: <LIVE_URL>
- Check notes: [CHECKS.md](CHECKS.md)

## What a guide answers

- **How hard is it?** easy, medium, hard or blocked, judged by what it takes for *real users*
  to connect with the read and write scopes an agent needs. Not login only.
- **How long?** Two numbers, kept apart: time to the first test login, and time until any user
  can connect. The second one is where the surprises are.
- **What can block me?** Requirements, costs, what triggers a review, and what to do when stuck.
- **Who does what?** Each step is marked "agent did this", "you do this" or "you wait". The agent
  writes the text you paste into review forms (app description, why each scope is needed).
- **Do I even need my own app on Composio?** Read from Composio's own list by code, plus when
  you still want your own (your name on the consent screen, more scopes, your own rate limit).
- **How sure is this?** Every claim is one of:
  - **quote checked**: code opened the cited page and found the quoted words
  - **source only**: a page is cited but the quote was not found (often JavaScript pages)
  - **unsure**: no source, usually a time estimate
  - **tested by hand**: a person did the setup and recorded what happened

## How it works

```
app name -> code: Composio managed or not (from Composio's list)
         -> agent: OpenAI model + web search, fills a strict guide schema, streams its steps
         -> code: opens every cited page, checks each quote, downgrades claims on dead pages
         -> saved, gets its own shareable URL
library guides additionally get: a person's corrections and hand tests (data/verification)
```

| Path | What |
|---|---|
| `lib/agent.ts` | The agent: instructions, web search, streaming steps |
| `lib/schema.ts` | The guide format the model must fill |
| `lib/check-sources.ts` | Opens cited pages and checks quotes |
| `lib/composio.ts` | Reads Composio's managed-app list |
| `data/guides/` | Library guides (agent made, then corrected) |
| `data/verification/` | Corrections and hand tests for each library guide |
| `evals/run-1/` | The first run, kept to compare against |
| `scripts/generate.ts` | Build library guides from the command line |
| `scripts/recheck.ts` | Re-check every library source without calling the model |

## Key decisions

1. **Five varied apps, not many thin ones.** GitHub (easy), LinkedIn (easy for posting, partner
   programs for more), Slack (self-serve, but rate limits hurt an agent), X (no managed app on
   Composio, paid credits, approval for AI reply bots), Gmail (hard: restricted scopes, about 6
   weeks, security assessment).
2. **"Unsure" is an answer.** A guide that admits a gap is more useful than one that guesses.
   The model may only mark a claim sourced if it quotes the page, and code checks the quote.
3. **Two times, not one.** "15 minutes" is true for almost every provider and useless. What
   developers cannot predict is the wait before real users can connect.
4. **Facts code can know are not asked of the model.** Composio's managed status comes from
   Composio's list; quotes are checked by fetching the page.
5. **Fix the instructions, not just the output.** Run 1 had the same kinds of mistakes in several
   guides, so I changed the agent's instructions and ran again. See CHECKS.md.
6. **Every guide has its own URL** so it can be shared with a teammate or a customer.

## Growing to 100 guides (the playbook)

1. Generate in batches with `scripts/generate.ts`. One guide takes about 1 to 3 minutes.
2. A person reads each new guide against a short list: difficulty, the two times, user caps,
   rate limits for unreviewed apps, Composio status. Corrections go in `data/verification`.
3. Track the numbers on the home page: guides, quote checked vs source only vs unsure,
   corrections. A rising "unsure" or "corrected" count says the instructions need work.
4. Run `scripts/recheck.ts` on a schedule. A quote that disappears means the provider changed a
   page and the guide needs a look.
5. Use every correction to improve the instructions, then rerun, as in run 1 to run 2.

## Limits

- The agent reads docs. It does not create OAuth apps itself, since that needs the developer's
  own accounts. Hand tests fill that gap for library guides.
- It misses changes announced only in changelogs (Slack's 2025 rate limit change). A next step is
  to search each provider's changelog on purpose.
- Some sites block automated reads (X's help center) or build pages with JavaScript, so their
  claims show as unsure or source only even when true.
- Time estimates are mostly unsure. Providers rarely publish them.
- Guides made live are not reviewed by a person, and the page says so.

## Run it

```bash
bun install
echo "OPENAI_API_KEY=sk-..." > .env.local
bun run dev                      # http://localhost:3000
bun test                         # parser and evidence checks
bun scripts/generate.ts "Notion" # add a library guide
bun scripts/recheck.ts           # re-check library sources
```

Optional settings:

| Variable | What |
|---|---|
| `OPENAI_MODEL` | Defaults to `gpt-5.4-mini` |
| `ACCESS_CODE` | If set, the live box asks for it, so strangers cannot spend your key |
| `BLOB_READ_WRITE_TOKEN` | Set by Vercel when a Blob store is connected. Live guides are saved there; without it they go to `data/generated/` |
| `MAX_TOOL_CALLS` | Cap on web searches per guide, default 25 |

No credentials are in this repository.
