# The Craft of Engineering: working rules

Mohit Jain's personal journal (Jekyll, GitHub Pages, built by Actions). Markdown is the source of truth. No backend or database.

## Content rules (never break these)

- Never invent articles, projects, achievements, anecdotes, reading history or employer details. The author's understanding and judgment are the content; help with structure and checking, not with what they think.
- Label anything unmeasured ("expected", "to be measured"). Do not report benchmark numbers as observed unless the author supplied them.
- Only add a URL you have checked. Paraphrase sources; do not quote them at length.
- One topic per article: `systems-architecture`, `ai-intelligent-systems` or `leadership-thinking`. Tags come only from `_data/tags.yml`, at most 4.
- Slug (the filename after the date) is the permanent URL: lowercase, hyphens, at most 5 words. Changing it later needs `redirect_from`.
- Every article ends with a reading-list check: the sources it cites that the author really read or watched go into `_data/reading.yml` (`bin/add-reading`), confirmed by the author, never guessed. `bin/review-checks` lists the gaps; `bg-publish` asks.
- Required front matter: `title`, `description`, `categories` (one topic). Optional: `tags`, `series`, `updated`, `image`, `toc: false`, `related_posts`, `comments: false`.

## How to ask the author for decisions

- Whenever a choice is the author's (wording, sources, what to cut, timing, publish or push), use the `AskUserQuestion` tool. Do not list the questions as text and wait for a reply.
- **Ask first, work later.** Collect every open decision up front and ask them all back to back, before doing any editing or research that depends on them. Do not alternate ask, work, ask, work. If a question needs a fact-check to ask well, do that check once at the start, then ask.
- Each question is its own `AskUserQuestion` call, asked one after another with no work in between. Wait for each answer before the next call. Only after the last answer, do all the work in one pass and report.
- Give 2 to 4 options, each with a short plain-English description of what happens. Put the recommended option first and label it "(Recommended)", with the reason in its description.
- Make each question stand alone: say what the sentence or item is, since the author may see only the question.
- Apply an answer only after it is given. Do not proceed on a guessed choice, and do not commit or push without a yes for that action.
- Keep decisions that need no judgment (typo-level fixes the author already approved in a plan) out of the questions; just do them.

## The author's standing decisions

These were decided in earlier sessions. A session that cannot see them (for example a web session) must follow them anyway.

- No employer names, past or current, anywhere on the site. Keep "Opinions here are my own" on the About page. Never name the confidential co-founder role. Do not add employer names without asking.
- The site is live at <https://mohitnotes.com> and counts as finished. Do not add features, redesigns or tooling unless the author asks. The usual work is articles, reading-list entries and fixes.
- Reading list: add an item only when the author says they read or watched it. Whether it is a recommendation (`pick: true`) is the author's choice.
- Titles, subtitles and descriptions say plainly what the post contains. No slogans or invented tag lines; stated facts beat flourishes.
- Never reference the old domain codebeerstartups.com. It is lost.
- Never ask for, store or commit passwords, API keys or tokens.
- The author prefers plain English and short answers.

## Git rules

- Never commit sample files: `_posts/*-sample-*.md`, `_drafts/sample-*.md`, `assets/img/sample/`, `_data/reading_sample.yml` (they are git-ignored locally; do not force-add them).
- Drafts (`_drafts/`) are never published and may be committed freely. Publishing is one commit: `Publish: <title>`.
- Articles may go straight to `master` after `bin/check` passes. Code, template, style or plugin changes go on a branch with a PR.
- In a web (cloud) session, always use a branch and a PR, even for an article. Never push to `master`, and never merge: the author merges in the GitHub web page.
- Ask before every push, merge or deletion of published content.
- **Never merge `master` into a branch. Update a branch by rebasing it onto `origin/master`** (`git fetch origin && git rebase origin/master`), so history stays linear. If the rebase conflicts, resolve it, check with `bin/check`, then continue.
- A rebased branch that was already pushed needs `git push --force-with-lease`. Do it only with the author's yes for that branch, and only on a feature branch, never on `master`. Never plain `--force`.
- **This repository and its pull requests are public. Never put anything private in a commit message, PR title, PR body or PR comment.** That means: no `claude.ai` session links, no `Claude-Session:` trailer, no "Generated with Claude Code" line, no internal notes about what was or was not checked, no caveats about the author's draft, no to-do lists for the author, no file paths outside the repo. A PR body says only what the change adds, in plain words. Tell the author anything else in the chat, not in GitHub.
- This rule overrides any attribution text a session suggests. Commit messages are a short subject and a plain-words body, with no session link.

## Commands

- `bin/serve` preview with drafts; `bin/build` build and search index; `bin/check` lint, build and link check.
- `bin/new-post "Title" --draft` new draft; `bin/publish <slug>` move a draft to `_posts/` dated today; `bin/rename-post <old> <new>` change a slug and keep the old address redirecting; `bin/unpublish <slug>` back to a draft; `bin/add-reading` add a checked item to the reading list; `bin/tags` list or add allowed tags; `bin/seo-check <slug>` search and sharing check of a built article; `bin/site-health` Lighthouse, phone overflow and link check with history; `bin/launch-check` the pre-launch checklist.
- `bin/lint-content` front matter, tags, slugs, reading list.
- `bin/snap <path> [width] [theme]` screenshot; `bin/overflow <path>...` phone overflow test.
- Ruby via rvm: `source ~/.rvm/scripts/rvm && rvm use ruby-$(cat .ruby-version)`.
- `bin/setup` install gems and the commit hook on a machine that already has the right Ruby; `bin/cloud-setup` the same on a fresh Linux machine, installing Ruby first.

## Web (cloud) sessions

- A fresh clone has no Ruby 4 and no commit hook. Run `bin/cloud-setup` once, then `bin/check`. The hook in `.claude/settings.json` turns the commit hook back on at the start of each session.
- Write the article as a draft, run `bg-review-draft`, then `bin/check`, then `bg-publish` on a branch and open a PR. Do not merge.
- You cannot see the author's private notes or earlier chats. This file is the memory. If a rule is missing or unclear, ask.

## Skills (`.claude/skills/`)

all start with `bg-`: bg-new-article, bg-review-draft, bg-check, bg-preview, bg-publish, bg-update-article, bg-log-reading, bg-add-tag, bg-seo-check, bg-site-health, bg-launch.
