---
title: Topics
permalink: /topics/
layout: page
description: The five areas this publication explores.
lede: Five connected areas, not five separate blogs.
---

{% assign topic_list = site.topics | sort: "order" %}
{% for topic in topic_list %}
{% assign topic_posts = site.posts | where_exp: "p", "p.categories contains topic.slug" %}
<article class="entry">
  <p class="label">{% if topic_posts.size > 0 %}{{ topic_posts.size }} article{% if topic_posts.size != 1 %}s{% endif %}{% else %}Writing will appear over time{% endif %}</p>
  <h2 class="entry-title"><a href="{{ topic.url }}">{{ topic.title }}</a></h2>
  <p class="entry-desc">{{ topic.description }}</p>
</article>
{% endfor %}
