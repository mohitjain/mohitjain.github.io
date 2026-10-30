---
title: Reading
permalink: /reading/
layout: page
description: Books, papers, articles and talks I have read, with notes where I have written them.
lede: A learning archive, not a bibliography or a recommendation list.
---

{% assign reading = site.data.reading %}
{% if reading.size > 0 %}
{% assign now = reading | where: "status", "reading" %}
{% assign done = reading | where_exp: "i", "i.status != 'reading'" | sort: "read" | reverse %}
{% assign groups = "book|paper|article|talk" | split: "|" %}

{% assign kinds = 0 %}
{% for group in groups %}{% assign n = done | where: "type", group | size %}{% if n > 0 %}{% assign kinds = kinds | plus: 1 %}{% endif %}{% endfor %}
{% if kinds > 1 %}
<ul class="chips" aria-label="Browse by kind">
  {% for group in groups %}
  {% assign n = done | where: "type", group | size %}
  {% if n > 0 %}<li><a href="#{{ group }}">{% case group %}{% when "book" %}Books{% when "paper" %}Papers{% when "article" %}Articles{% when "talk" %}Talks{% endcase %} <span class="tag-count">{{ n }}</span></a></li>{% endif %}
  {% endfor %}
</ul>
{% endif %}

{% if now.size > 0 %}
<h2 class="section-title" id="now">Reading now</h2>
{% for item in now %}{% include reading-item.html item=item %}{% endfor %}
{% endif %}

{% for group in groups %}
  {% assign items = done | where: "type", group %}
  {% if items.size > 0 %}
  <h2 class="section-title" id="{{ group }}">{% case group %}{% when "book" %}Books{% when "paper" %}Papers{% when "article" %}Articles{% when "talk" %}Talks and lectures{% endcase %}</h2>
  {% for item in items %}{% include reading-item.html item=item %}{% endfor %}
  {% endif %}
{% endfor %}
{% else %}
<p>This is where I keep a record of what I read and watch while learning: books, papers, articles and talks. Each item is listed only after I have actually read it, and links to my notes when I have written some.</p>
<p>Nothing is listed yet. In the meantime, the <a href="/archive/">archive</a> has everything I have written.</p>
{% endif %}
