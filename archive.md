---
title: Archive
permalink: /archive/
layout: page
description: Every post, grouped by year.
---

{% assign postsByYear = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year in postsByYear %}
<h2 class="post-header" id="{{ year.name }}">{{ year.name }}</h2>
{% for post in year.items %}
<article class="posts">
  <span class="posts-date">{{ post.date | date: "%b %d" }}</span>
  <header class="posts-header">
    <h3 class="posts-title">
      <a href="{{ post.url }}">{{ post.title | escape }}</a>
    </h3>
  </header>
</article>
{% endfor %}
{% endfor %}
