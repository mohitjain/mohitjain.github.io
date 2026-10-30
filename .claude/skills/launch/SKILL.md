---
name: launch
description: >-
  One-time checklist for taking the site live: remove throwaway content, confirm configuration,
  merge the redesign, switch GitHub Pages to Actions, and verify the live site. Use when the
  user says launch, go live, "are we ready" or "ship the site", or before the first public push.
---

# launch

Take the site public once, deliberately. Everything that can be checked automatically is; the rest is the author's.

## Steps

1. **See where things stand:**
   ```sh
   source ~/.rvm/scripts/rvm && rvm use $(cat .ruby-version)
   bin/launch-check
   ```
   Every `TODO` or `FAIL` line is an open item (exit status 1 until none remain). `MANUAL` lines are for the author. Read the whole output and report it plainly.
2. **Work the list in this order**, asking for approval at every outward-facing step:
   1. **Throwaway content:** delete the samples with the command the checker prints. This is destructive (the files are untracked, so they cannot be recovered from git): ask first, and confirm the author has no real content mixed in.
   2. **Real content:** the home page is empty until there is at least one real article. Do not publish placeholders to fill it; if there is none, tell the author the site can still go live but will say "The first articles are on their way".
   3. **Configuration:** `google_analytics` (a GA4 ID, or empty on purpose), `newsletter.buttondown` (optional), `giscus` (already set). Edit `_config.yml` only with values the author gives you.
   4. **Copy only the author can vouch for:** show the lines the checker prints from `about.md` and the topic intros, and ask the author to confirm each factual claim. Change them only as the author directs.
   5. **Quality gates:** run the `check` skill (all green), then the `site-health` skill (scores at or above target, no phone overflow).
   6. **Commit** anything changed, on the working branch.
   7. **Push the branch and open a pull request to `master`** (`git push -u origin <branch>`, `gh pr create`), only after the author says yes. Wait for the CI run to pass (`gh pr checks --watch`). Report failures and fix their cause.
   8. **Merge** only when the author explicitly says to. Keep the commit history (a merge commit), not a squash, unless the author asks otherwise.
   9. **Switch Pages to GitHub Actions**, only with the author's approval: `gh api -X PUT repos/:owner/:repo/pages -f build_type=workflow`. Then run the deploy workflow if the merge did not start it (`gh workflow run pages.yml`) and watch it (`gh run watch <id> --exit-status`).
3. **Verify the live site:**
   ```sh
   for p in / /archive/ /reading/ /about/ /feed.xml /sitemap.xml /robots.txt /nope-404/; do
     printf '%s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "https://mohitjain.github.io$p"; done
   ```
   Expect 200 everywhere except the last, which should be 404 and show the site's own 404 page. Open the home page and one article with the `preview` skill pointed at the live URL (`SITE=https://mohitjain.github.io bin/snap …`).
4. **Hand over the manual list:** verify the site in Google Search Console and Bing Webmaster Tools and submit `/sitemap.xml`; read one article on a phone; share the first article. Offer `seo-check` for it.
5. Re-run `bin/launch-check` and report what is left.

## Rules
- Never merge, push, change repository settings or delete files without the author's explicit yes for that action.
- Do not set up a custom domain; the old one is permanently lost and `url:` is `https://mohitjain.github.io`.
- Follow `CLAUDE.md`.
