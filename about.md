---
title: About
permalink: /about/
layout: page
description: What this publication is, who writes it, and what to expect.
lede: What this is, who writes it, and what to expect.
---

This is my personal knowledge journal about engineering, technology, and the ideas that shape how we think and build.

I write about distributed systems, software architecture, artificial intelligence, and the evolving discipline of building intelligent software systems. I also explore engineering leadership, strategy, decision-making, and systems thinking through books, research papers, technical talks, and practical experience.

Some articles document concepts I'm learning. Others explore ideas in depth or share experiments and things I've built. It is a continuous record of learning, questioning, experimenting, and refining how I think about engineering.

## Who writes here

I'm Mohit Jain, a Principal Engineer with about sixteen years of experience building software. Most of it has gone into distributed systems, enterprise data platforms and software architecture, and into the quieter work that makes large systems dependable: reliability, operations and careful technical decisions.

Right now much of my learning time goes into artificial intelligence: how foundation models work, how to give them the right context, how agents are built and run, and how to tell whether any of it is reliable. I study the field through books, papers and lectures, and by building things myself.

I see the leadership, strategy and systems-thinking side of engineering as one subject with the technical work: how complex things are understood, designed and led.

## What I write about

Three connected areas, not three separate blogs.

{% assign topic_list = site.topics | sort: "order" %}
{% for topic in topic_list %}
<article class="entry">
  <h3 class="entry-title"><a href="{{ topic.url }}">{{ topic.title }}</a></h3>
  <p class="entry-desc">{{ topic.description }}</p>
  {% if topic.covers %}<p class="entry-desc entry-covers">{{ topic.covers | join: " &middot; " }}</p>{% endif %}
</article>
{% endfor %}

## What to expect

- Plain, careful writing. I'll try to separate what is established, what I read in a source, what I interpret, and what I'm only guessing.
- Not every article is original research, and not every article is long.
- No publishing schedule.
- A site that wanders as my interests do.

## How I write

I use AI tools to help organize notes and improve clarity. The understanding, the judgment and the mistakes are mine. Opinions here are my own.

Find the code and experiments on [GitHub](https://github.com/mohitjain), [follow new articles](/subscribe/), or write to me at [hello@mohitnotes.com](mailto:hello@mohitnotes.com).

<p class="label motto">Learn deeply &middot; Think clearly &middot; Build thoughtfully</p>
