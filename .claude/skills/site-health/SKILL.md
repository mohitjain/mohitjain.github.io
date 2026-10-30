---
name: site-health
description: Periodic health check of the whole site: Lighthouse scores, phone-width overflow and dark mode, and optionally broken outbound links, compared with the last run. Use when the user asks how healthy or fast the site is, after template or style changes, or on a regular schedule such as monthly.
---

# site-health

Measure the real built site, then say what changed and what to fix.

## Steps

1. **Run it** (about 3 minutes for the full set, under 1 for `--quick`):
   ```sh
   source ~/.rvm/scripts/rvm && rvm use $(cat .ruby-version)
   bin/site-health            # builds, then checks the key pages and the 3 newest articles
   bin/site-health --quick    # home, Reading and the newest article only
   bin/site-health --external # also checks outbound links; slow and can be flaky
   ```
   It builds the site, serves `_site` on a free port, runs Lighthouse (performance, accessibility, best practices, SEO) on each page, runs the phone overflow test (light and dark), and compares with the previous run saved in `.site-health/` (git-ignored). Targets: 90 for each score, 95 for accessibility.
2. **Read the whole output.** A `!` after a score marks a page below its target; `(+n)` / `(-n)` is the change since the last run. Overflow lines name the page and the elements that stick out. Do not report success unless the exit status was 0 and the output shows no `!`, no overflow and no ERROR rows.
3. **Explain what changed and why it probably did.** Tie a score drop to the most recent changes (`git log --oneline -10`): a new image without dimensions, a large script, a table that does not fit a phone. Scores can vary a few points between runs; treat a change of 1 to 3 points as noise and say so.
4. **Look at the problem pages** with the `preview` skill (phone and dark screenshots) before proposing a fix.
5. **Fix with the author's agreement.** Code or template fixes go on a branch with a pull request per `CLAUDE.md`; re-run `bin/site-health` afterwards and report the new numbers.
6. For outbound-link failures list each dead link with the article it appears in, and propose a replacement only after opening it. Do not remove a link without saying so.

## Rules
- Never lower a target or skip a page to get a pass.
- `.site-health/` is local history; never commit it.
- Follow `CLAUDE.md`.
