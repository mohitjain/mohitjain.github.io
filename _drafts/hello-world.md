---
# Development fixture: lives in _drafts/, so it appears in bin/serve but is never published.
title: "Hello, world"
description: First post on the rebuilt blog.
categories: [building-experiments]
content_type: build-log
tags: [meta, jekyll]
series: Rebuilding the blog
featured: true
---

This blog is rebuilt on Jekyll 4.4 with a GitHub Actions deploy.

## Writing a post

Run `bin/new-post "My title"` to create a dated post, or add `--draft` to
create one in `_drafts/`.

```ruby
puts "Hello, world"
```

## Front matter

Useful keys: `tags`, `description`, `image`, `series`, `modified` and
`toc: false` to hide the table of contents.

### Series

Posts that share a `series:` value link to each other at the top.

## What's next

- Search, comments and analytics
- Better images and accessibility
