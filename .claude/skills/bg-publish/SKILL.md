---
name: bg-publish
description: >-
  Publish a finished draft as an article. Use when the user says publish, ship, "make it live"
  or "release" an article. Reviews, checks, moves the draft into _posts/ dated today, makes one
  commit, and (only after approval) pushes and verifies the live page.
---

# bg-publish

Publishing is one commit: `Publish: <title>`. Nothing is pushed without an explicit yes.

## Steps

1. **Identify the draft** (`_drafts/<slug>.md`). If unclear, list `_drafts/` and ask. Refuse anything with `sample: true`.
2. **Preconditions.** Run `git status --short` and `git branch --show-current`. Stop and tell the author if there are unrelated uncommitted changes (they must not slip into the publish commit) or if the draft is not committed or tracked in a way that confuses the move.
3. **Review:** run the `bg-review-draft` skill. Do not continue while any "Must fix" item is open.
3b. **Reading list.** Run `bin/review-checks` on the draft and look at every "not on the reading list" line. Ask the author which of those sources they actually read or watched, and which they want recommended (`--pick`). Add only those, with the `bg-log-reading` skill (`notes:` pointing at the article). Never add an item the author has not confirmed. If none, say so and continue. Reading entries go in the same pull request or commit series as the article, never forgotten for later.
4. **Move and lint:**
   ```sh
   source ~/.rvm/scripts/rvm && rvm use ruby-$(cat .ruby-version)
   bin/publish <slug>
   ```
   This moves the draft to `_posts/YYYY-MM-DD-<slug>.md` dated today and lints it; on a lint failure it puts the draft back. The slug is now the permanent URL: say so.
5. **Check:** run the `bg-check` skill. If it fails, fix the cause (with the author's agreement) before continuing. Optionally run the `bg-preview` and `bg-seo-check` skills.
6. **Stage only the article:**
   ```sh
   git add _posts/<dated-file>.md
   git add -u _drafts/            # records the draft's removal
   git add assets/img/<images used by this article>   # only if new
   git status --short
   ```
   The staged list must contain only this article, its removed draft and its images. If any sample file (`*-sample-*`, `assets/img/sample/`, `_data/reading_sample.yml`) or anything unexpected is staged, unstage it and tell the author.
7. **Commit:** `Publish: <title>` followed by the attribution line from the session. The pre-commit hook lints again.
8. **Push, only after the author says yes** to the specific push:
   - On `master`: `git push origin master`. The deploy workflow rebuilds, runs the checks and deploys.
   - On any other branch: the article goes live only when that branch is merged into `master`. Say so, and offer to open a pull request (`gh pr create`); do not merge without being asked.
9. **Verify the deploy** (master only). Find the run and wait for it:
   ```sh
   gh run list --branch master --limit 1 --json databaseId,status,conclusion,url
   gh run watch <databaseId> --exit-status
   ```
   If the workflow is not found, Pages is not yet set to deploy from Actions: report that. Then confirm the page is live (replace the base with `url:` from `_config.yml`):
   ```sh
   base=$(ruby -ryaml -e 'puts YAML.load_file("_config.yml")["url"]')
   curl -s -o /dev/null -w '%{http_code}\n' "$base/<slug>/"
   curl -s "$base/feed.xml" | grep -c '<slug>'
   ```
   Report the URL, the status code, and whether the feed lists it. Pages can take a minute to update; retry a few times before reporting failure.
10. **Report:** the commit hash, the live URL, and what to do next (share it; `bg-seo-check`; `bg-update-article` for later fixes).

## Rules
- Never push, merge or force-push without a clear yes for that action. Approval for one push does not cover another.
- Never stage or commit sample files. Never use `git add -A` or `git add .` here.
- If a step fails, stop and report; do not work around a check.
- Follow `CLAUDE.md`.
