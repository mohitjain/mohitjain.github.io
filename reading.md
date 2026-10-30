---
title: Reading
permalink: /reading/
layout: page
description: Articles, books, videos and papers I have read, with notes where I have written them.
lede: A learning archive, not a bibliography. Nothing is listed until I have read it.
---

{% assign none = "" | split: "," %}
{% assign preview = site.data.reading_sample | default: none %}
{% assign reading = site.data.reading | concat: preview %}
{% if reading.size > 0 %}
{% assign done = reading | sort: "read" | reverse %}
{% assign picks = done | where: "pick", true %}
{% assign kinds = "book|paper|article|video" | split: "|" %}

<div class="reading" id="reading">
  <p class="reading-find" id="reading-find" hidden>
    <label for="reading-q" class="visually-hidden">Filter the list</label>
    <input id="reading-q" type="search" placeholder="Filter by title, author or tag" autocomplete="off">
  </p>

  <ul class="chips" aria-label="Browse by kind">
    {% for kind in kinds %}
    {% assign n = done | where: "type", kind | size %}
    {% if n > 0 %}<li><a href="#{{ kind }}">{% case kind %}{% when "article" %}Articles{% when "book" %}Books{% when "video" %}Videos{% when "paper" %}Papers{% endcase %} <span class="tag-count">{{ n }}</span></a></li>{% endif %}
    {% endfor %}
  </ul>

  {% if picks.size > 0 %}
  <section class="reading-featured" aria-labelledby="picks">
    <h2 class="section-title" id="picks">Recommended</h2>
    <ul class="reading-list">{% for item in picks limit: 6 %}{% include reading-item.html item=item %}{% endfor %}</ul>
    {% if picks.size > 6 %}
    <details class="reading-more">
      <summary>Show {{ picks.size | minus: 6 }} more</summary>
      <ul class="reading-list">{% for item in picks offset: 6 %}{% include reading-item.html item=item %}{% endfor %}</ul>
    </details>
    {% endif %}
  </section>
  {% endif %}

  {% for kind in kinds %}
  {% assign items = done | where: "type", kind %}
  {% if items.size > 0 %}
  <section class="reading-kind" id="{{ kind }}" aria-labelledby="{{ kind }}-h">
    <h2 class="section-title" id="{{ kind }}-h">{% case kind %}{% when "article" %}Articles{% when "book" %}Books{% when "video" %}Videos and talks{% when "paper" %}Papers{% endcase %}</h2>
    <ul class="reading-list">{% for item in items limit: 8 %}{% include reading-item.html item=item %}{% endfor %}</ul>
    {% if items.size > 8 %}
    {% assign rest = items.size | minus: 8 %}
    <details class="reading-more">
      <summary>Show {{ rest }} more</summary>
      <ul class="reading-list">{% for item in items offset: 8 %}{% include reading-item.html item=item %}{% endfor %}</ul>
    </details>
    {% endif %}
  </section>
  {% endif %}
  {% endfor %}

  <p class="reading-empty" id="reading-empty" hidden>Nothing matches that.</p>
</div>
<script src="/assets/js/reading.js?v={{ site.time | date: '%s' }}" defer="defer"></script>
{% else %}
<p>This is where I keep a record of what I read and watch while learning: articles, books, videos and papers. Each item is listed only after I have actually read it, and links to my notes when I have written some.</p>
<p>Nothing is listed yet. In the meantime, the <a href="/archive/">archive</a> has everything I have written.</p>
{% endif %}
