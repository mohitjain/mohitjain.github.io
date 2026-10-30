# Maintaining the site

How the blog is built, written in and published. For what the blog is about, see the
[README](../README.md). The site uses [Jekyll](https://jekyllrb.com) 4.4 and is deployed to GitHub
Pages with GitHub Actions.

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
bin/publish work-in-progress             # move the draft to _posts/ dated today (lints it first)
bin/rename-post old-slug new-slug        # change a published slug; the old address redirects
bin/unpublish some-slug                  # take a published article back to a draft
bin/add-reading --title ... --type book --topic ... --url ... --read 2026-10-27   # add to the reading list (checks the link)
```

`bin/snap <path> [width] [light|dark]` screenshots a page of the running site, and
`bin/overflow <path>...` tests pages for sideways scrolling at phone width. `bin/setup` also
enables the pre-commit hook (`.githooks/pre-commit`), which runs the content lint on every commit.
`CLAUDE.md` holds the working rules for Claude Code sessions, and `.claude/skills/` the skills.

`bin/serve` shows drafts and future-dated posts. Drafts never publish. CI builds drafts only to
test the templates, and never deploys them. Until the first real article exists, the article
template and the article Lighthouse check have nothing to run on; add a real article's URL to
`.lighthouserc.json` once there is one.

A post's front matter:

```yaml
---
title: "My post title"
description: One or two sentences, shown under the title, in lists, search and social previews.
categories: [ai-intelligent-systems]   # exactly one topic, see below
tags: [retrieval, evals]               # from _data/tags.yml, at most 4
---
```

Tags come from the allowed list in `_data/tags.yml`; `bin/lint-content` rejects any other tag and
more than four per post. It also checks that the filename slug (the part after the date, which
becomes the permanent URL) is lowercase with hyphens and at most five words.

`bin/lint-content` (run by `bin/check` and CI) fails the build if a published post is missing a
title, a description or a valid topic.

Topics (the `categories` values; one per post):

| Slug | Topic |
| --- | --- |
| `systems-architecture` | Systems & Architecture |
| `ai-intelligent-systems` | Artificial Intelligence & Intelligent Systems |
| `leadership-thinking` | Leadership & Thinking |

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

To move a published article to a new address, add `redirect_from: [/old-address/]` to its front
matter. GitHub Pages cannot send a server 301, so this writes a small page at the old address that
redirects and names the new one as canonical (`jekyll-redirect-from`).

Related articles are matched automatically on shared topic or tags. Images in posts get
`loading="lazy"`; add `width` and `height` to avoid layout shift. For references, use a
`## References` section or Markdown footnotes.

## Other content

| What | Where |
| --- | --- |
| Topic pages (`/topics/<slug>/`) | `_topics/*.md`: the front matter and body are the editorial text; articles are listed automatically |
| Reading (`/reading/`, `/reading/books/`, `/papers/`, `/articles/`, `/videos/`, and `/reading/architecture/`, `/ai/`, `/leadership/`) | `_data/reading.yml`, one entry per item actually read (`title`, `type`, `topic`, `url`, `read` required; optional `author`, `year`, `pick`, `comment`, `notes`, `tags`, `image`). `topic` is one of the three topic slugs. `/reading/` shows only `pick: true` items; each kind page lists everything, newest first, with a text filter and topic chips; each topic page lists everything on that topic by kind |
| Allowed `content_type` values | `_data/content_types.yml` |
| Header navigation | the three topics (short label = `nav_title` in `_topics/*.md`), then `_data/menus.yml` (Reading, Archive, About) |
| Footer links | `_includes/footer.html` (Tags, Subscribe, RSS, GitHub); the header menu is `_data/menus.yml` |
| Newsletter | set `newsletter.buttondown` in `_config.yml` to show the signup form (RSS is shown until then) |

## What's in the site

- SEO tags, a sitemap, an Atom feed (`/feed.xml`), a JSON feed (`/feed.json`) and an Atom
  feed per tag (`/feed/tags/<tag>.xml`), plus a page per tag (`/tags/<tag>/`)
- A home page with a flat list of the latest ten article titles (date and topic above each), a paginated Archive (20 per page), three topic pages, tags and a reading page
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
Cloudflare. The site runs on its own domain, `mohitnotes.com` (see "Custom domain" below).

## Troubleshooting

- **`OpenSSL is not available` or gems fail to install**: the Ruby build is linked to an
  OpenSSL that no longer exists. Reinstall it against OpenSSL 3:
  `rvm install ruby-$(cat .ruby-version) --autolibs=disable --with-openssl-dir=$(brew --prefix openssl@3)`.
- **Search page says the index is not built, or `/pagefind/...` returns 404**: run
  `bin/build`. A `jekyll serve` started before `keep_files` was added to `_config.yml`
  deletes the index on every rebuild, so restart it with `bin/serve`.
- **Port 4000 or 35729 already in use**: another `jekyll serve` is running. Stop it, or pass
  `--port` and `--livereload-port` to `bin/serve`.

## Working with Claude Code

`CLAUDE.md` holds the standing rules. `.claude/skills/` has one skill per step of the writing life
cycle; each calls the scripts in `bin/`:

| Skill | Use it to |
| --- | --- |
| `bg-new-article` | start a draft with the right front matter and an outline |
| `bg-review-draft` | get an editorial review before publishing |
| `bg-check` | run lint, build, link check and markdown lint, and read the result |
| `bg-preview` | see a page on desktop, phone and dark mode |
| `bg-publish` | move a draft live: one `Publish: <title>` commit, then push and verify (with your approval) |
| `bg-update-article` | fix, correct, rename (with a redirect) or unpublish an article |
| `bg-log-reading` | add a checked item to the Reading page |
| `bg-add-tag` | add a tag to the allowed list, or find the right one |
| `bg-seo-check` | check an article's search and sharing tags |
| `bg-site-health` | Lighthouse, phone overflow and link check, compared with the last run |
| `bg-launch` | the one-time go-live checklist |

## Project layout

| Path | What it is |
| --- | --- |
| `_posts/`, `_drafts/`, `_topics/` | Content |
| `_layouts/`, `_includes/` | Templates and partials |
| `_sass/site/` | Styles: design tokens (`_tokens.scss`), type and layout, code, components |
| `_plugins/tag_feeds.rb` | Generates the per-tag feeds |
| `assets/` | CSS entry point, JavaScript, fonts (self-hosted Source Serif 4), favicons |
| `bin/` | `setup`, `serve`, `build`, `check`, `lint-content`, `new-post` |
| `.github/` | Workflows and Dependabot config |

## Custom domain

The site runs on `mohitnotes.com` (bought at GoDaddy, set up on 2026-10-31). This is how it was
done, and what to repeat if the domain ever moves. The order matters: do not add the `CNAME` file
or change `url:` before the DNS answers and the domain is attached in the Pages settings, or the
old address would redirect to a domain that does not answer yet.

1. **Buy the domain** with auto-renew on, for several years, with the registrar lock and
   two-factor sign-in enabled.
2. **Verify it in your GitHub account** (Settings, Pages, "Add a domain") by adding the TXT record
   GitHub shows. This stops anyone else claiming the domain on their own Pages site.
3. **DNS records** at the registrar: four `A` records for the bare domain pointing to
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`, and a `CNAME`
   record for `www` pointing to `mohitjain.github.io`. Check GitHub's current Pages documentation
   before entering them.
4. **In the repo** (one commit): create a file named `CNAME` containing only `mohitnotes.com`, and
   set `url: "https://mohitnotes.com"` in `_config.yml`. The canonical links, sitemap, feeds and link
   previews all follow `url:`. Update the live address in `README.md`, and the `https://` address in
   the `bg-publish` skill's live-page check.
5. **In GitHub:** set the custom domain (Settings, Pages, or
   `gh api -X PUT repos/:owner/:repo/pages -f cname=mohitnotes.com`). When the certificate is ready,
   which can take up to an hour, enforce HTTPS (`-F https_enforced=true`).
6. **Afterwards:** `mohitjain.github.io` redirects to the new domain by itself. Add the new domain
   to Search Console and Bing Webmaster Tools, update the analytics property if one is set, and run
   `bin/launch-check`, which now checks that `CNAME` and `url:` agree.

## External links

Every link to another site opens in a new tab. You do not write anything special: the
`_plugins/external_links.rb` plugin adds `target="_blank"` and `rel="noopener"` to those links in
the final HTML, whether they come from a template, an article or the reading list. Links to this
site, `mailto:`, `#anchors` and relative links are left alone, a link that already sets `target`
keeps it, and the feeds are not changed.

## Icons

The site icon is `assets/favicons/favicon.svg` (a yellow note in the site's colours). After editing
it, run `bin/favicons` (macOS, needs Google Chrome) to regenerate `favicon.ico`, the touch icon and
the Android icons, then commit the results.
