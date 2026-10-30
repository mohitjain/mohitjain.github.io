---
name: log-reading
description: >-
  Add a book, paper, article or video to the Reading page. Use when the user says they finished
  reading or watching something and wants it listed, or asks to log, add or recommend an item on
  the reading list.
---

# log-reading

The Reading page lists only what the author has actually read or watched. Every entry needs a source link that works.

## Steps

1. **Confirm it is finished.** If the author is still reading it or only plans to, do not add it. Never infer reading history from a checklist, a plan or a bookmark; the author must say they finished it. Ask for the date they finished it (`read`), not a guess.
2. **Gather** what is missing, in one message:
   - title, and kind: `book`, `paper`, `article` or `video` (talks and lectures are `video`)
   - topic: `systems-architecture`, `ai-intelligent-systems` or `leadership-thinking`
   - the source link: paper page (for example arXiv), the article, the YouTube video, or the book's publisher or author page
   - optional: author, year published, whether to recommend it (`--pick`), one sentence in the author's own words (`--comment`), a link to their own article about it (`--notes /slug/`)
3. **Find the link if the author has none.** Search the web, open the page, and confirm the title and author match. Use only an address you have opened and checked. If you cannot confirm one, ask the author for it; never guess a URL.
4. **Add it:**
   ```sh
   source ~/.rvm/scripts/rvm && rvm use $(cat .ruby-version)
   bin/add-reading --title "<title>" --type <kind> --topic <topic> --url <url> --read <YYYY-MM-DD> \
     [--author "<name>"] [--year <yyyy>] [--pick] [--comment "<one sentence>"] [--notes /<slug>/]
   ```
   The script loads the link, refuses duplicates, future dates, unknown topics and notes that point to a missing article, and writes a correctly quoted entry. If a site blocks scripts but loads in a browser, ask the author to confirm it and rerun with `--no-check`.
5. **Verify:** run `bin/lint-content`, then `preview` the `/reading/` page and the kind or topic page it appears on (`/reading/books/`, `/reading/ai/`, …). Report what you saw.
6. **Commit** only the data file: `git add _data/reading.yml`, message `Reading: <title>`, plus the session's attribution line. For several items added together, one commit: `Reading: <n> items`.
7. **Push** only after the author's explicit yes, with the same rules as the `publish` skill.

## Recommendations
`--pick` puts an item on the main `/reading/` page. Keep it for the few the author would genuinely recommend; ask, do not decide. The page shows at most the picks, so a long list of picks dilutes it.

## Rules
- Never add an item the author has not said they finished. Never invent a comment, a year or a link.
- Never touch `_data/reading_sample.yml` (local throwaway preview data, never committed).
- Follow `CLAUDE.md`.
