---
title: Tags
permalink: /tags/
layout: page
description: Every tag, most used first.
lede: Every tag, most used first.
---

{% if site.tag_list.size > 0 %}
{% assign shared = site.tag_list | where_exp: "t", "t.count > 1" %}
{% assign single = site.tag_list | where_exp: "t", "t.count == 1" %}
{% if shared.size > 0 %}
<ul class="tag-list">
  {% for tag in shared %}
  <li class="tag-size-{% if tag.count >= 6 %}4{% elsif tag.count >= 4 %}3{% elsif tag.count >= 3 %}2{% else %}1{% endif %}">
    <a href="/tags/{{ tag.slug }}/">{{ tag.name }}</a> <span class="tag-count">{{ tag.count }}</span>
  </li>
  {% endfor %}
</ul>
{% endif %}
{% if single.size > 0 %}
<h2 class="post-header">Used once</h2>
<ul class="tag-list tag-list-quiet">
  {% for tag in single %}
  <li><a href="/tags/{{ tag.slug }}/">{{ tag.name }}</a></li>
  {% endfor %}
</ul>
{% endif %}
{% else %}
<p>Tags will appear here once articles use them.</p>
{% endif %}
