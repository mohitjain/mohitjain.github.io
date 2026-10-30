---
name: new-article
description: >-
  Start a new article for the journal. Use when the user wants to begin writing a post, says
  "new article", "new post" or "draft about X". Creates the draft with correct front matter and
  an outline; does not write the article.
---

# new-article

Start a draft in `_drafts/`. The author writes the article; this skill sets it up correctly.

## Steps

1. **Gather** (ask only for what is missing, in one message):
   - the point of the article in one sentence (what should a reader understand afterwards?)
   - a working title
   - the topic: `systems-architecture`, `ai-intelligent-systems` or `leadership-thinking` (suggest one from the point; if it truly spans two, ask which is the main one)
2. **Check for overlap:** list `_posts/` and `_drafts/` and look for an existing article on the same point. If one exists, tell the author and offer `update-article` instead.
3. **Slug:** propose a short, specific slug of at most 5 words (lowercase, hyphens), e.g. `retry-jitter`, not the whole title. It becomes the permanent URL, so say so. Confirm it.
4. **Tags:** read `_data/tags.yml` and suggest up to 4 that genuinely apply. Do not invent tags. If none fits and the author wants a new one, hand off to the `add-tag` skill.
5. **Create** (from the repo root, after `source ~/.rvm/scripts/rvm && rvm use $(cat .ruby-version)`):
   ```sh
   bin/new-post "<title>" --draft --slug <slug> --topic <topic> --tags <a,b>
   ```
6. **Fill the front matter:** write a draft `description` (one or two plain sentences saying what the article is about, in the author's words from step 1) and confirm it with the author.
7. **Outline:** under the front matter add `##` headings for the sections the author described, each with a one-line `<!-- prompt -->` comment saying what belongs there. Do not write the article's content. Never invent anecdotes, experience, numbers or results.
8. Run `bin/lint-content` (drafts only warn) and report the file path.

## Finish
Tell the author the draft is at `_drafts/<slug>.md`, that nothing is published, and that the next steps are: write it, run `review-draft`, then `preview` and `publish`.

## Rules
- Never write to `_posts/`. Never set `sample: true`.
- Follow `CLAUDE.md` for the content rules.
