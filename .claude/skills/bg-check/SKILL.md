---
name: bg-check
description: >-
  Run every check on the site (content lint, build, link and image check, markdown lint) and
  explain any failure in plain words. Use before committing or publishing, when the user says
  "check", "run the tests", "is it ready", or when CI failed.
---

# bg-check

Run the checks, read the real output, say what it means.

## Steps

1. From the repo root:
   ```sh
   source ~/.rvm/scripts/rvm && rvm use ruby-$(cat .ruby-version)
   INCLUDE_DRAFTS=1 bin/check
   npx --yes markdownlint-cli2@0.24.0 2>&1 | grep -v "sample"
   ```
   `bin/check` runs the content lint, builds the site with the search index, and checks every internal link, image and script. Drafts are included so templates are exercised, exactly as CI does. The `grep -v sample` drops the local throwaway sample articles, which are never committed. Add `--external` to `bin/check` only when asked: it also checks outbound links, is slow and can be flaky.
2. **Read the output before reporting.** Do not say "passed" unless `HTML-Proofer finished successfully` and `Content front matter OK` both appear and markdownlint printed no errors for real files.
3. **Explain each failure** in one or two plain sentences: which file, what is wrong, how to fix it. Group repeated failures (for example the same broken link on many pages is one problem).
4. Offer to fix. Fix only with the author's agreement, then re-run the same commands and report the new result.

## Common failures

| Output | Meaning | Fix |
| --- | --- | --- |
| `categories must contain one of…` | the article's topic is missing or misspelled | use one of the three topic slugs |
| `tags not in _data/tags.yml` | a tag outside the allowed list | use an allowed tag, or the `bg-add-tag` skill |
| `filename slug … words` | the slug is longer than 5 words or has capitals | rename the file; add `redirect_from` if it was already published |
| `internally linking to #x … hash does not exist` | a link to a heading that is not there | fix the link or the heading |
| `image … does not exist` | wrong image path | check `assets/img/` |
| `MD0xx` | markdown style problem | fix the line shown |
| `url is required` (reading list) | a reading entry has no source link | add a checked URL |

## Rules
- Never skip, weaken or delete a check to make it pass; fix the cause.
- Do not commit as part of this skill.
- Follow `CLAUDE.md`.
