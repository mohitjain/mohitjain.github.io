---
title: Experiments
permalink: /experiments/
layout: page
description: Systems and prototypes I build to understand how things work.
lede: A record of engineering exploration, not a portfolio of finished products.
---

{% if site.experiments.size > 0 %}
{% assign items = site.experiments | sort: "started" | reverse %}
{% for item in items %}
<article class="entry">
  <p class="label">{{ item.status | default: "idea" }}{% if item.started %} &middot; started {{ item.started | date: "%b %Y" }}{% endif %}</p>
  <h2 class="entry-title"><a href="{{ item.url }}">{{ item.title }}</a></h2>
  <p class="entry-desc">{{ item.description }}</p>
</article>
{% endfor %}
{% else %}
<p>Experiments will be documented here as I build them.</p>
{% endif %}
