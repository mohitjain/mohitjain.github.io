---
name: bg-update-article
description: >-
  Change an article that is already published: fix a typo, correct or extend it, rename its URL
  slug, or take it down. Use when the user asks to edit, fix, update, correct, rename, retitle
  or unpublish an existing post.
---

# bg-update-article

Published addresses are permanent. Changes must not break links or hide that an article changed.

## First: what kind of change?

| Change | What to do |
| --- | --- |
| **Typo, wording, formatting** | Edit the file. No `updated:` date. Commit `Fix: <title>: <what>`. |
| **Substantive** (a corrected claim, a new section, new information) | Edit the file, set `updated: YYYY-MM-DD` (today) in the front matter, and for a correction add a short visible note in the text saying what changed and when. Commit `Update: <title>: <what>`. |
| **New URL slug** | `bin/rename-post <old-slug> <new-slug>` (moves the file, keeps its date, adds the old address to `redirect_from`). Commit `Rename: <old> to <new>`. |
| **Take it down** | Confirm with the author first. `bin/unpublish <slug>` moves it to `_drafts/`. Its address will then be a 404; say so. Commit `Unpublish: <title>`. |

## Steps

1. Find the article in `_posts/` by slug or title. Never change its `date:` or the date in its filename.
2. Make the change from the table. Do not rewrite the author's prose beyond what they asked. Do not add experience or results they did not give you.
3. Run `bin/lint-content` (after `source ~/.rvm/scripts/rvm && rvm use ruby-$(cat .ruby-version)`), then the `bg-check` skill. For a rename, also confirm the old address redirects: build and look for `/_site/<old-slug>/index.html` containing `url=…<new-slug>/`.
4. For a substantive change or a rename, run `bg-review-draft` on the changed article.
5. Stage only the files you changed (`git add <paths>`, never `-A`), review `git status --short`, then commit with the message from the table and the session's attribution line.
6. Push only after the author's explicit yes, using the same rules as the `bg-publish` skill (master pushes deploy; other branches need a PR). After a deploy, check the live URL and, for a rename, the old URL.

## Rules
- Renames: never rename a slug just for style. If the old address was ever shared, it must stay in `redirect_from` for good.
- Never delete a published article's file; unpublishing moves it to `_drafts/`, so history and content are kept.
- Follow `CLAUDE.md`.
