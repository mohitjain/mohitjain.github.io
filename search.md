---
title: Search
permalink: /search/
layout: page
description: Search every post.
---

<link href="/pagefind/pagefind-ui.css" rel="stylesheet" />
<div id="search"><noscript>Search needs JavaScript.</noscript></div>
<script src="/pagefind/pagefind-ui.js"></script>
<script>
  window.addEventListener("DOMContentLoaded", () => {
    if (typeof PagefindUI === "undefined") {
      document.getElementById("search").textContent =
        "Search index not built. Run bin/build once, then bundle exec jekyll serve.";
      return;
    }
    new PagefindUI({ element: "#search", showSubResults: true, autofocus: true });
  });
</script>
