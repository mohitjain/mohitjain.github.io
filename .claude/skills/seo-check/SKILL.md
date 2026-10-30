---
name: seo-check
description: Check one article for search and sharing: title and description length, canonical URL, link-preview image, structured data, headings, slug, internal links, alt text. Use when the user asks about SEO, search ranking, link previews, or before publishing an article.
---

# seo-check

Make sure an article can be found and previews well. Technical checks are automatic; the rest is judgment about the writing.

## Steps

1. **Build and run the checker** (drafts need `INCLUDE_DRAFTS=1`):
   ```sh
   source ~/.rvm/scripts/rvm && rvm use $(cat .ruby-version)
   INCLUDE_DRAFTS=1 bin/build
   bin/seo-check <slug>
   ```
   It reports `ok`, `warn`, `note` or `FAIL` for the title, meta description, canonical URL, Open Graph and Twitter tags, share image, structured data, headings, slug, sitemap, feed, internal links and image alt text. Only run it on articles: other pages have no article structured data and will fail that check by design.
2. **Fix every FAIL.** Typical causes and fixes:
   - no description: add `description:` to the front matter
   - missing share image file: the default is `assets/img/ogp.png`; a post's own `image:` must exist under the site
   - image without alt text: add alt text in the Markdown
3. **Weigh each warn.** The title includes the site name, so an article title over about 35 characters pushes the whole title past the length search engines show; shorten only if the shorter title is as clear. A description under 70 or over 160 characters is cut off or thin: tighten it to one or two plain sentences that say what the article is about.
4. **Judge what the script cannot** and tell the author:
   - Is the title specific, and does it contain the words someone would search for? ("Retries need jitter, not just backoff" beats "On retries".)
   - Does the first paragraph answer what the reader came for?
   - Does the text link to the author's other relevant articles? Suggest specific ones from `_posts/` where they truly relate; internal links help readers and search more than any plugin.
   - Is the slug short, descriptive and stable (it must not change after publishing)?
5. Re-run step 1 after changes and report the final result.

## Rules
- Do not stuff keywords, and do not rewrite the author's title or description without agreement; propose alternatives.
- Do not change a published slug as an SEO tweak; use `update-article` with a redirect if it must change.
- Follow `CLAUDE.md`.
