---
name: bg-add-tag
description: >-
  Add, rename or retire a tag in the allowed tag list (_data/tags.yml), or check which tag fits.
  Use when an article needs a tag that is not in the list, when the user asks about tags, or
  when tags look messy.
---

# bg-add-tag

The tag list is deliberately small (about 10 to 20). A tag earns its place when at least two articles use it, so tag pages are worth visiting. Tags are not a substitute for the three topics.

## Steps

1. **See what exists and how much it is used:**
   ```sh
   source ~/.rvm/scripts/rvm && rvm use $(cat .ruby-version)
   bin/tags
   ```
2. **Prefer an existing tag.** Read the descriptions. If one fits even roughly, use it and stop; explain which and why. A new tag is only for a subject the list genuinely cannot express.
3. **Test the new tag:** ask the author which two articles (published, drafted or firmly planned) will use it. If there is only one, do not add it yet; tell them to leave the article with fewer tags.
4. **Name it:** lowercase, hyphens, at most three words, a noun for the subject (`observability`, not `observing-systems`), no plurals that collide with an existing tag. `bin/tags add` rejects near-duplicates such as `llm` against `llms`.
5. **Add it with a one-line description:**
   ```sh
   bin/tags add <slug> "<what articles with this tag are about>"
   ```
6. **Use it:** put the tag in the article's `tags:` (at most 4 per article), then run `bin/lint-content`.
7. **Commit** only `_data/tags.yml` and the article(s) you changed: `Tags: add <slug>`, with the session's attribution line. Push only after the author's explicit yes (same rules as the `bg-publish` skill).

## Renaming or retiring a tag
- **Rename:** change the key in `_data/tags.yml`, replace it in every article that uses it (`grep -rl "<old>" _posts _drafts`), run `bin/lint-content`, and say that the old tag page `/tags/<old>/` and its feed will disappear (its articles move to the new tag page).
- **Retire:** remove it from `_data/tags.yml` only after removing it from every article. Retire a tag that has been used by fewer than two articles for a long time.

## Rules
- Never add a tag just to make the lint pass; fix the article's tags instead.
- Do not edit samples. Follow `CLAUDE.md`.
