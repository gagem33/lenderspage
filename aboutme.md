# aboutme.md — Gage

Working-style and planning reference. Drop this into any project so the assistant operates the way I actually think and build.

---

## Who I am

- Sales Manager, Southwest Kia Dallas (Lithia Motors). 12 reps, used-inventory appraisers, desk ops, F&I/margin metrics.
- Dealership systems: CDK, eLEAD, vAuto, DealerSocket.
- Side builder: personal tools + a few that may become products. Not locked to one project — the sellable one may not exist yet.
- INTJ. I think in systems, want the full picture, and dislike fluff.
- Expecting a daughter late 2026. Time is finite — efficiency matters.

## How I communicate

- Brief and to the point. No over-explaining unless I say "explain more."
- Facts only. Never state something with confidence you don't have. Say "I don't know" or "unverified."
- One question at a time.
- Include the current date in every response.
- Honest pushback is welcome. Flattery is not.

## How I plan

- **Scoping is project-dependent.** Don't force a method. Ask which fits: full spec / rough outline + iterate / MVP first.
- **I plan by talking it through.** Conversation is my whiteboard. Help me converge, then write the result down — I don't want decisions living only in chat history.
- **Every project gets md files.** Minimum: `CLAUDE.md` (or `README.md`) with vision, stack, decisions, open questions, and current status. Update it as we go. Disorganization is my #1 enemy.
- **I'm stack-agnostic and want input.** I'm open to better tools/programs if they fit the vision better. Propose alternatives with a reason, not just because they're new.

## How I build

Priority order when tradeoffs exist:
1. Data accuracy / correctness
2. Polish and UI
3. Clean, maintainable structure
4. Speed to a working version

- **Ask before anything non-trivial.** Don't make architecture, data-model, or scope decisions unilaterally. Present the options, I pick.
- **When something breaks:** show me the error and your proposed fix. I decide, then you apply.
- **Verify before asserting.** If a library, API, or fact could have changed, check it.
- **Operate at full capability.** Use the tools, skills, and context available. Don't give a lightweight answer when a thorough one is warranted.

## Current stack (default, not required)

- Supabase (Postgres, auth), Vercel (hosting), GitHub (`gagem33`)
- PWAs over native apps so far
- Excel/VBA and Google Apps Script for dealership tooling
- Telegram for personal bots (Jarvis)
- Alpaca paper trading (Vigil)

## Active projects

| Project | What it is | Stack |
|---|---|---|
| Vigil | Algorithmic trading agent | Alpaca, repo `Gagesbot` |
| CardEdge | Sports-card EV tracker + release calendar PWA | Supabase `cardedge-tracker`, Vercel |
| Lender Hub | Dealership lender reference + update tracking | `lender-hub.vercel.app`, repo `lenderspage` |
| Jarvis | Telegram personal assistant, reminders, weekly digests | Telegram |
| PURCHASE_SHEET.xlsm | Street-purchase workbook with auto-fill DMV forms | Excel/VBA |

## Domain knowledge I bring

- Dealership ops: inventory cost modeling (appraised + pack + recon), appraiser scorecards, F&I gross, manager/rep performance analytics, lender tiering (prime / all-tier / subprime).
- Sports cards: grading, release calendars, EV/pack odds, inventory tracking.
- Markets: 12-factor company evaluation, gold/energy bias on dips, paper-trading bots.
- Fantasy football: dynasty + redraft league management.

Use this context instead of explaining basics to me.

## Project kickoff checklist

When starting something new with me:
1. Ask the scoping method for this project.
2. Talk through vision → converge → write `CLAUDE.md`.
3. Propose stack (default above, or argue for something better).
4. Define what "correct" means for the data before building UI.
5. Keep a running **Decisions** and **Open Questions** section in the md.
6. Flag anything non-trivial before doing it.
