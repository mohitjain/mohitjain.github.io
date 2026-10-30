---
name: review-draft
description: Editorial review of an article before it is published. Use when the user asks to review, proofread, critique or "check" a draft or post, or before publishing. Reports problems; does not rewrite the author's text unless asked.
---

# review-draft

A second pair of eyes. The author's ideas and wording stay theirs: report, don't rewrite.

## Steps

1. **Find the file:** `_drafts/<slug>.md` (or `_posts/…` for a published article). If several drafts exist and the user did not say which, ask.
2. **Run the mechanical checks** (from the repo root):
   ```sh
   source ~/.rvm/scripts/rvm && rvm use $(cat .ruby-version)
   bin/lint-content
   bin/review-checks <file>
   ```
   Treat every line it prints as a lead to verify, not a verdict.
3. **Read the whole article** and review it against the list below.
4. **Verify what can be verified:** open any external link (WebFetch) and confirm it exists and says what the article claims; for a real book, paper or talk confirm title, author and year. If something cannot be confirmed, say so; do not guess.
5. **Report** in this shape, with line references where possible:
   - **Must fix:** wrong or unverifiable facts, invented experience or results, broken or wrong links, missing front matter, a title or description that misleads.
   - **Should fix:** unclear structure, claims without support, undefined terms, long paragraphs, code that does not run or has no language tag.
   - **Consider:** tighter wording, a better example, a missing counter-argument.
   - **What works:** one or two sentences, so the author knows what to keep.
6. Offer to apply specific fixes. Apply only the ones the author agrees to, and re-run step 2 afterwards.

## What to review

- **Title and description:** is the title specific (what is the claim or the subject)? Does the description say what the article is about in one or two plain sentences? Do both match the article as written, not as planned?
- **Opening:** does the first paragraph tell the reader what they will understand by the end?
- **Structure:** does each section earn its place, in an order that builds the argument? Is the ending a plain stop, without a grand conclusion or a motivational line?
- **Claims:** for each important claim, is it established fact, a claim from a source, the author's interpretation, or a hypothesis, and does the text make that clear? Flag claims stated more strongly than the support allows.
- **Numbers and results:** any measurement, benchmark or percentage must have come from the author, or be labelled "expected" / "to be measured". Flag the rest.
- **Experience:** flag any personal history, employer, project or anecdote and ask the author to confirm they wrote it. Never suggest adding one.
- **Sources:** references use real works by well-known title and author, paraphrased, with no invented page numbers or quotes. Long quotations are not allowed.
- **Technical accuracy:** read code and explanations critically. Where possible run the code. Where unsure, say "I am not certain" and what to check.
- **Voice:** no marketing language, clickbait or filler; first person is fine, sparingly.
- **Fit:** is the single topic right, are the tags from `_data/tags.yml` and accurate, and is the slug short and specific?
- **Reader experience:** headings scan well, no `#` heading in the body, images have alt text, code blocks have a language, tables are not too wide for a phone.

## Rules
- Follow `CLAUDE.md`. Do not edit the article unless the author asks.
- Do not rate the article out of ten or praise generically; be specific.
