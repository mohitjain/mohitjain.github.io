---
title: Archive
permalink: /archive/
layout: page
description: Every article, newest first.
lede: Every article, newest first.
pagination:
  enabled: true
  per_page: 20
  permalink: /page/:num/
  sort_field: date
  sort_reverse: true
---

<ul class="chips" aria-label="Browse by topic">
  {% assign topic_list = site.topics | sort: "order" %}
  {% for topic in topic_list %}<li><a href="{{ topic.url }}">{{ topic.title }}</a></li>{% endfor %}
  <li><a href="/tags/">All tags</a></li>
</ul>

{% if paginator.posts.size > 0 %}
  {% for post in paginator.posts %}{% include entry.html post=post tag="h2" show_topic=true %}{% endfor %}
  {% include pagination.html %}
{% else %}
  <p>Nothing has been published yet. <a href="/subscribe/">Follow along</a> and the first articles will appear here.</p>
{% endif %}
