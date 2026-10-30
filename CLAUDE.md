# The Craft of Engineering: working rules

Mohit Jain's personal journal (Jekyll, GitHub Pages, built by Actions). Markdown is the source of truth. No backend or database.

## Content rules (never break these)

- Never invent articles, projects, achievements, anecdotes, reading history or employer details. The author's understanding and judgment are the content; help with structure and checking, not with what they think.
- Label anything unmeasured ("expected", "to be measured"). Do not report benchmark numbers as observed unless the author supplied them.
- Only add a URL you have checked. Paraphrase sources; do not quote them at length.
- One topic per article: `systems-architecture`, `ai-intelligent-systems` or `leadership-thinking`. Tags come only from `_data/tags.yml`, at most 4.
- Slug (the filename after the date) is the permanent URL: lowercase, hyphens, at most 5 words. Changing it later needs `redirect_from`.
- Required front matter: `title`, `description`, `categories` (one topic). Optional: `tags`, `series`, `updated`, `image`, `toc: false`, `related_posts`, `comments: false`.

## Git rules

- Never commit sample files: `_posts/*-sample-*.md`, `_drafts/sample-*.md`, `assets/img/sample/`, `_data/reading_sample.yml` (they are git-ignored locally; do not force-add them).
- Drafts (`_drafts/`) are never published and may be committed freely. Publishing is one commit: `Publish: <title>`.
- Articles may go straight to `master` after `bin/check` passes. Code, template, style or plugin changes go on a branch with a PR.
- Ask before every push, merge or deletion of published content. Never force-push.
- Commits end with the attribution line given by the session.

## Commands

- `bin/serve` preview with drafts; `bin/build` build and search index; `bin/check` lint, build and link check.
- `bin/new-post "Title" --draft` new draft; `bin/publish <slug>` move a draft to `_posts/` dated today; `bin/rename-post <old> <new>` change a slug and keep the old address redirecting; `bin/unpublish <slug>` back to a draft; `bin/add-reading` add a checked item to the reading list; `bin/tags` list or add allowed tags; `bin/seo-check <slug>` search and sharing check of a built article; `bin/site-health` Lighthouse, phone overflow and link check with history; `bin/launch-check` the pre-launch checklist.
- `bin/lint-content` front matter, tags, slugs, reading list.
- `bin/snap <path> [width] [theme]` screenshot; `bin/overflow <path>...` phone overflow test.
- Ruby via rvm: `source ~/.rvm/scripts/rvm && rvm use $(cat .ruby-version)`.

## Skills (`.claude/skills/`)

new-article, review-draft, check, preview, publish, update-article, log-reading, add-tag, seo-check, site-health, launch.
