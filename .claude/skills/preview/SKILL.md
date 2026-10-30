---
name: preview
description: >-
  Preview an article (or any page) in the local site and look at it on desktop, phone and dark
  mode. Use when the user asks to see, preview, view or screenshot a page, or to check how an
  article looks, before publishing.
---

# preview

Run the real site locally, look at the page, and report only what you actually saw.

## Steps

1. **Pick the URL path.** Posts and drafts live at `/<slug>/` (no date). Examples: `/retry-jitter/`, `/reading/`, `/topics/leadership-thinking/`. Drafts are served by `bin/serve`.
2. **Start the server on its own ports** so it never collides with a server the author already runs on 4000 (its live-reload port 35729 would make a second server crash):
   ```sh
   source ~/.rvm/scripts/rvm && rvm use $(cat .ruby-version)
   nohup bin/serve --port 4001 --livereload-port 35730 > /tmp/serve4001.log 2>&1 &
   ```
   Wait until `curl -s -o /dev/null -w '%{http_code}' localhost:4001<path>` prints `200` (up to about 90 seconds on a cold build). If it never does, read `/tmp/serve4001.log` and report the error; do not carry on.
3. **Phone overflow test** (fails if the page scrolls sideways or the server is down):
   ```sh
   SITE=http://localhost:4001 bin/overflow <path>
   ```
4. **Screenshots**, then open each PNG with the Read tool and look at it:
   ```sh
   SITE=http://localhost:4001 bin/snap <path> 1440 light <scratchpad>/desktop.png
   SITE=http://localhost:4001 bin/snap <path> 390 light <scratchpad>/phone.png
   SITE=http://localhost:4001 bin/snap <path> 390 dark <scratchpad>/phone-dark.png
   ```
   Use the session scratchpad directory for the PNGs, not the repo.
5. **Report what you saw**, specifically: title and meta in the rail, the lede, headings, code blocks, tables, images and their alt text, the tags line, related articles, anything cut off or too wide, contrast in dark mode. Say plainly if something looks wrong; do not say it "looks good" without having opened the images.
6. **Stop the server you started** (`pkill -f "jekyll serve.*4001"`). Never stop a server on port 4000: it is the author's. If that one serves old pages or ignores new plugins, tell the author to restart it with `bin/serve`.

## Rules
- Never commit anything from this skill. Screenshots stay out of the repo.
- Follow `CLAUDE.md`.
