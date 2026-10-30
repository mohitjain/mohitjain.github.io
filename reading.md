---
title: Reading
permalink: /reading/
layout: page
description: Books, papers, articles and talks I have read, with notes where I have written them.
lede: A learning archive, not a bibliography or a recommendation list.
---

{% assign reading = site.data.reading %}
{% if reading.size > 0 %}
  {% assign groups = "book|paper|article|talk" | split: "|" %}
  {% for group in groups %}
    {% assign items = reading | where: "type", group %}
    {% if items.size > 0 %}
    <h2 class="post-header">{% case group %}{% when "book" %}Books{% when "paper" %}Papers{% when "article" %}Articles{% when "talk" %}Talks and lectures{% endcase %}</h2>
    {% for item in items %}
    <article class="entry">
      <p class="label">{% if item.author %}{{ item.author }}{% endif %}{% if item.date %}{% if item.author %} &middot; {% endif %}{{ item.date | date: "%b %Y" }}{% endif %}</p>
      <h3 class="entry-title">{% if item.url %}<a href="{{ item.url }}" rel="noopener">{{ item.title }}</a>{% else %}{{ item.title }}{% endif %}</h3>
      {% if item.notes %}<p class="entry-desc"><a href="{{ item.notes }}">My notes</a></p>{% endif %}
    </article>
    {% endfor %}
    {% endif %}
  {% endfor %}
{% else %}
<p>I will add books, papers and talks here as I read them, with a link to my notes where I have written some. Nothing is listed until I have actually read it.</p>
{% endif %}
