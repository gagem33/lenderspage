# Supabase contract — OBSOLETE

**The app has no backend.** As of 2026-08-25 `index.html` is a pure static page
that makes no network request except Google Fonts. The Supabase project
`llhxiyeqroetebsrjbos` is empty: every table and function has been dropped, and
its security advisors report zero findings.

This file used to be a ~450-line contract for nine RPCs and five tables. Keeping
it would recreate exactly the problem the 2026-08-22 inventory flagged — docs
describing code that no longer exists. The full version is in git history:

```
git log --oneline -- docs/supabase-contract.md
git show c304c68:docs/supabase-contract.md    # the last complete version
```

## What was here, and where it went

| | |
|---|---|
| Sales Pace tracker — 3 tables, 6 functions | dropped 2026-08-24 · migration `20260824234700` · PR #5 |
| Lender update tracking — 2 tables, 4 functions | dropped 2026-08-25 · migration `20260825...` · this PR |

All applied migrations are in [`supabase/migrations/`](../supabase/migrations).

## Worth remembering if a backend ever comes back

Two real security findings were fixed here on 2026-08-24 before the whole thing
was removed. If this project ever grows a backend again, start from these:

- **A PIN stored as plaintext is readable by anyone.** `lender_edit_pin` had RLS
  disabled and granted `anon` full DML, and the publishable key is in the page
  source of a public repo. One `GET` returned the PIN. Hash secrets; never store
  one in a table an anonymous role can read.
- **RPCs are not a security boundary if the tables underneath are open.**
  `lender_updates` was anonymously writable and `TRUNCATE`-able, so the
  PIN-gated functions were a front door on an unlocked building. Enable RLS with
  no policies and let `SECURITY DEFINER` functions owned by the table owner be
  the only way in.
- Pin `search_path` on every `SECURITY DEFINER` function.
- If the client detects a bad secret by matching an error string, that string is
  load-bearing API. Ours was `invalid pin`; changing it would have broken the
  re-prompt silently.
