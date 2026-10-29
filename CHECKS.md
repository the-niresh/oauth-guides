# What I checked, what I fixed, what I could not verify

The assignment asked me to check a sample of the guidance against real sources. I checked all
five library guides. This file is the record.

## How checking works

There are three layers, and each one is shown on the guide page:

1. **Code checks the agent.** After the agent writes a guide, code opens every page it cited and
   looks for the exact words it quoted. A claim is "quote checked" only if the words are on the
   page. If the page will not load, the claim is dropped to "unsure".
2. **A person reads the result** against the provider's docs and fixes what is wrong. Each fix is
   recorded in `data/verification/<app>.json` and shown on the page as "agent said / actually".
3. **A person does the setup by hand** and records the time and what blocked them. These show as
   "tested by hand".

Composio's managed or bring-your-own status is never left to the model. Code reads it from
Composio's own list (`docs.composio.dev/toolkits/managed-auth.md`).

## Where the library stands

| App | Difficulty | Quote checked | Source only | Unsure | Pages cited |
|---|---|---|---|---|---|
| GitHub | easy | 16 | 1 | 2 | 8 |
| LinkedIn | easy | 21 | 3 | 3 | 8 |
| Slack | medium | 16 | 7 | 1 | 10 |
| X | medium | 12 | 3 | 6 | 6 |
| Gmail | hard | 24 | 0 | 1 | 10 |
| **All** | | **89** | **14** | **13** | |

Run `bun scripts/recheck.ts` to recompute this against the live pages.

## Run 1: what the agent got wrong

I ran the agent on the five apps and read every guide. Four problems:

| Guide | What the agent did | Why it matters |
|---|---|---|
| LinkedIn | Covered only "Sign in with LinkedIn" | An agent needs to act (post, read), not log in. It missed that posting (`w_member_social`) is self-serve |
| Gmail | Missed the 100 user cap for unverified apps | Google says the cap lasts for the life of the project and "cannot be reset or changed". This is the thing that bites most |
| Slack | Rated hard because of Marketplace review | You do not need the Marketplace to share a Slack app |
| GitHub | Rated medium because of org approval and Marketplace | GitHub does not review OAuth apps |
| X, Gmail | Left `([site](url))` citations inside the text | Sources already have their own field |

These were not one-off slips. They came from the instructions, so I fixed the instructions
rather than only the five files (`lib/agent.ts`):

- Research the read **and write** scopes an agent needs, not login.
- Always look for limits on unreviewed apps: user caps, test mode limits, lower rate limits.
- Difficulty is about real users connecting. Optional extras like a marketplace listing do not set it.
- No links inside text. Code also strips them now.

Run 1 is kept in `evals/run-1/` for comparison.

## Run 2: what got better, and what I fixed by hand

Better: Gmail found the 100 user cap and a checked quote that verification takes about 6 weeks.
LinkedIn covered posting and its daily rate limits. X found that AI reply bots need
written approval from X. No stray citations.

Still wrong, so I fixed them by hand (shown on each guide page):

- **GitHub** was still medium. Changed to easy.
- **Slack** was still hard, and both runs missed the change that matters most for an agent: since
  May 29, 2025, apps shared outside the Marketplace can call `conversations.history` only once a
  minute, 15 messages at a time. It is in Slack's changelog, not in the OAuth pages the agent read.
  Added it as the first blocker, changed difficulty to medium, and fixed "time until any user can
  connect" from "up to 10 weeks" to "same day" (the 10 weeks is only for a Marketplace listing).

What this tells me about the agent: it reads the setup docs well, but misses changes announced in
changelogs and policy pages. A next step would be to search each provider's changelog on purpose.

## My checker had bugs too

The first quote checker said too many true quotes were missing. I looked at each miss:

- The model writes quotes with markdown marks (`` `*:history` ``). Pages do not have backticks.
- It adds a full stop the page does not have.
- Pages write dashes and quotes as HTML codes (`&mdash;`, `&#8217;`).

After fixing these, found quotes went from 66 of 106 to 88 of 106 on the same pages, with no
new model calls.

## What I could not verify

- **X's help center blocks automated requests** (HTTP 403). The AI reply bot rule is real, but it
  shows as unsure because code could not open the page.
- **developer.x.com** builds its page with JavaScript, so its quotes show as source only.
- **Time estimates.** Providers rarely publish how long setup takes. Most "15 to 30 minutes"
  estimates are marked unsure on purpose. Only hand tests can fix that.
- **Some quotes are rebuilt from tables** (for example a rate limit row). The page is right, but
  the exact words are not on it, so they show as source only.
