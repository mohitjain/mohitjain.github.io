---
title: Reading
permalink: /reading/
layout: page
description: The articles, books, papers and videos I would recommend most, with links to everything I have read.
lede: The few I would recommend most. Nothing is listed until I have read it.
---

{% assign none = "" | split: "," %}
{% assign preview = site.data.reading_sample | default: none %}
{% assign reading = site.data.reading | concat: preview %}
{% if reading.size > 0 %}
{% assign picks = reading | where: "pick", true | sort: "read" | reverse %}
<p class="label">Everything I have read, by kind</p>
<ul class="chips" aria-label="Everything I have read, by kind">
  {% assign kinds = "book|paper|article|video" | split: "|" %}
  {% for kind in kinds %}
  {% assign n = reading | where: "type", kind | size %}
  {% if n > 0 %}<li><a href="/reading/{% case kind %}{% when "book" %}books{% when "paper" %}papers{% when "article" %}articles{% when "video" %}videos{% endcase %}/">{% case kind %}{% when "book" %}Books{% when "paper" %}Papers{% when "article" %}Articles{% when "video" %}Videos and talks{% endcase %} <span class="tag-count">{{ n }}</span></a></li>{% endif %}
  {% endfor %}
</ul>

<p class="label">By topic</p>
<ul class="chips" aria-label="Everything I have read, by topic">
  {% assign topics = site.topics | sort: "order" %}
  {% for t in topics %}
  {% assign n = reading | where: "topic", t.slug | size %}
  {% if n > 0 %}<li><a href="/reading/{% case t.slug %}{% when "systems-architecture" %}architecture{% when "ai-intelligent-systems" %}ai{% when "leadership-thinking" %}leadership{% endcase %}/">{{ t.nav_title }} <span class="tag-count">{{ n }}</span></a></li>{% endif %}
  {% endfor %}
</ul>

{% if picks.size > 0 %}
<h2 class="section-title" id="recommended">Recommended</h2>
<ul class="reading-list">{% for item in picks %}{% include reading-item.html item=item show_kind=true %}{% endfor %}</ul>
{% else %}
<p>I have not marked any recommendations yet. Everything I have read is in the lists above.</p>
{% endif %}
{% else %}
<p>This is where I keep a record of what I read and watch while learning: articles, books, papers and videos, with my best recommendations on this page. Each item is listed only after I have actually read it.</p>
<p>Nothing is listed yet. In the meantime, the <a href="/archive/">archive</a> has everything I have written.</p>
{% endif %}
