# mohitjain.github.io

Mohit Jain's blog, built with [Jekyll](https://jekyllrb.com) 4.4 and deployed to GitHub
Pages with GitHub Actions. The design is a clean, large-type serif layout.

## Quick start

You need Ruby (the version in `.ruby-version`, managed with rvm) and Node.js (only for the
[Pagefind](https://pagefind.app) search index).

```sh
bin/setup   # check Ruby and Node, then bundle install
bin/serve   # build the search index, then serve at http://localhost:4000
```

`make setup`, `make serve`, `make build`, `make check`, `make post` and `make draft` are
shortcuts for the same scripts. `make clean` removes build output.

## Writing

```sh
bin/new-post "My post title"            # _posts/YYYY-MM-DD-my-post-title.md
bin/new-post "Work in progress" --draft  # _drafts/work-in-progress.md
```

`bin/serve` shows drafts and future-dated posts. Drafts never publish. The two sample files in
`_drafts/` are development fixtures that exercise every template; delete them whenever you like
(CI builds drafts only to test the templates, and never deploys them).

A post's front matter:

```yaml
---
title: "My post title"
description: One or two sentences, shown under the title, in lists, search and social previews.
categories: [ai-intelligent-systems]   # exactly one topic, see below
tags: [retrieval, evals]
---
```

`bin/lint-content` (run by `bin/check` and CI) fails the build if a published post is missing a
title, a description or a valid topic.

Topics (the `categories` values; one per post):

| Slug | Topic |
| --- | --- |
| `systems-architecture` | Systems & Architecture |
| `ai-intelligent-systems` | Artificial Intelligence & Intelligent Systems |
| `building-experiments` | Building & Experimentation |
| `leadership-strategy` | Engineering Leadership & Strategy |
| `thinking-learning` | Thinking, Learning & Mental Models |

Optional front matter:

| Key | Effect |
| --- | --- |
| `content_type` | Optional label for your own use (`til`, `deep-dive`, `build-log`, `reading-note`, `reflection`); not shown on the site, validated if set |
| `updated` | "Updated" date (`modified` also works) |
| `series` | Posts with the same value link to each other |
| `related_posts` | List of post URL fragments to show as related, instead of the automatic matches |
| `image` | Social preview image (falls back to `assets/img/ogp.png`) |
| `toc: false` | Hide the table of contents (shown when a post has 3+ `h2`/`h3` headings) |
| `comments: false` | Turn off comments for one post |

Related articles are matched automatically on shared topic or tags. Images in posts get
`loading="lazy"`; add `width` and `height` to avoid layout shift. For references, use a
`## References` section or Markdown footnotes.

## Other content

| What | Where |
| --- | --- |
| Topic pages (`/topics/<slug>/`) | `_topics/*.md`: the front matter and body are the editorial text; articles are listed automatically |
| Experiments (`/experiments/<name>/`) | `_experiments/*.md` with `status` and `started`; only list real projects |
| Reading (`/reading/`) | `_data/reading.yml`, one entry per item actually read; it starts empty |
| Allowed `content_type` values | `_data/content_types.yml` |
| Header navigation | the five topics (short label = `nav_title` in `_topics/*.md`), then `_data/menus.yml` (Archive, About) |
| Footer links | `_includes/footer.html` (Experiments, Reading, Tags, Subscribe, RSS, GitHub) |
| Newsletter | set `newsletter.buttondown` in `_config.yml` to show the signup form (RSS is shown until then) |

## What's in the site

- SEO tags, a sitemap, an Atom feed (`/feed.xml`), a JSON feed (`/feed.json`) and an Atom
  feed per tag (`/feed/tags/<tag>.xml`), plus a page per tag (`/tags/<tag>/`)
- A home page with a flat list of the latest ten article titles (date and topic above each), a paginated Archive (20 per page), five topic pages, tags, experiments and reading pages
- Reading time, table of contents, related posts, series and code-copy buttons
- Search at `/search/` (Pagefind; press `/` or Ctrl/Cmd+K on any page)
- Comments with [giscus](https://giscus.app), backed by GitHub Discussions
- Light and dark themes that follow the visitor's system setting (with a toggle), a skip
  link, and print styles

## Configuration

Everything lives in `_config.yml`:

| Setting | Notes |
| --- | --- |
| `url` | Public site URL, used for canonical links and feeds |
| `mode` | Default theme: `light` (ink on white), `dark` (black) or `auto` (follow the visitor's system). A visitor's own toggle choice is remembered |
| `google_analytics` | GA4 measurement ID (`G-XXXXXXXXXX`). Empty means nothing loads, and it only loads in production builds |
| `giscus.*` | Repo and category IDs for comments. Empty `repo_id` turns comments off |
| `tagline` | Shown under the title on the home page |
| `newsletter.buttondown` | Buttondown username; empty shows RSS instead of the signup form |

Local-only overrides are in `_config.dev.yml`.

## Search index

Pagefind indexes the built site, so it is generated by `bin/build` (Jekyll, then
`pagefind`). `bin/serve` runs it once at startup. After adding or editing posts while
the server is running, run `bin/build` again to refresh search results.

## Checks

`bin/check` builds the site and runs
[html-proofer](https://github.com/gjtorikian/html-proofer) for broken internal links,
images and scripts. Add `--external` to also check outbound links (slow, can be flaky).

CI runs on every pull request and on pushes to any branch except `master`:

- link and image check
- [markdownlint](https://github.com/DavidAnson/markdownlint-cli2) on posts and pages
  (`.markdownlint-cli2.jsonc`)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) on seven pages
  (`.lighthouserc.json`): at least 0.9 for performance, best practices and SEO, and 0.95
  for accessibility

Dependabot opens weekly grouped updates for gems and GitHub Actions.

## Deploying

Pushing to `master` runs `.github/workflows/pages.yml`: build with `bin/build`, run the
link check, then publish with the official Pages actions. This needs
**Settings > Pages > Source** set to **GitHub Actions**.

Caching: GitHub Pages serves files with a short cache lifetime and no CDN controls. For
longer caching or a CDN, put the site behind a custom domain and a proxy such as
Cloudflare. The site has no custom domain at the moment.

## Troubleshooting

- **`OpenSSL is not available` or gems fail to install**: the Ruby build is linked to an
  OpenSSL that no longer exists. Reinstall it against OpenSSL 3:
  `rvm install ruby-$(cat .ruby-version) --autolibs=0 --with-openssl-dir=$(brew --prefix openssl@3)`.
- **Search page says the index is not built, or `/pagefind/...` returns 404**: run
  `bin/build`. A `jekyll serve` started before `keep_files` was added to `_config.yml`
  deletes the index on every rebuild, so restart it with `bin/serve`.
- **Port 4000 or 35729 already in use**: another `jekyll serve` is running. Stop it, or pass
  `--port` and `--livereload-port` to `bin/serve`.

## Project layout

| Path | What it is |
| --- | --- |
| `_posts/`, `_drafts/`, `_topics/`, `_experiments/` | Content |
| `_layouts/`, `_includes/` | Templates and partials |
| `_sass/site/` | Styles: design tokens (`_tokens.scss`), type and layout, code, components |
| `_plugins/tag_feeds.rb` | Generates the per-tag feeds |
| `assets/` | CSS entry point, JavaScript, fonts (self-hosted Source Serif 4), favicons |
| `bin/` | `setup`, `serve`, `build`, `check`, `lint-content`, `new-post` |
| `.github/` | Workflows and Dependabot config |
