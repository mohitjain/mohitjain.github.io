# frozen_string_literal: true

module Jekyll
  # For every tag, writes
  #   /tags/<slug>/            a page listing its articles (layout: tag)
  #   /feed/tags/<slug>.xml    an Atom feed
  # and exposes site.tag_list (name, slug, count; most-used first) to templates.
  # Every tag on an article therefore links to a real page.
  class TagFeedGenerator < Generator
    safe true
    priority :low

    LIMIT = 20

    TEMPLATE = <<~'LIQUID'
      <?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>{{ site.title | xml_escape }} - {{ page.tag_name | xml_escape }}</title>
        <id>{{ page.url | absolute_url }}</id>
        <link rel="self" type="application/atom+xml" href="{{ page.url | absolute_url }}" />
        <link rel="alternate" type="text/html" href="{{ '/tags/' | append: page.tag_name | slugify | append: '/' | absolute_url }}" />
        <updated>{{ page.tag_posts.first.date | date_to_xmlschema }}</updated>
        <author><name>{{ site.author.name | xml_escape }}</name></author>
      {% for post in page.tag_posts %}
        <entry>
          <title>{{ post.title | xml_escape }}</title>
          <id>{{ post.url | absolute_url }}</id>
          <link rel="alternate" type="text/html" href="{{ post.url | absolute_url }}" />
          <published>{{ post.date | date_to_xmlschema }}</published>
          <updated>{{ post.modified | default: post.date | date_to_xmlschema }}</updated>
          <summary>{{ post.description | default: post.excerpt | strip_html | normalize_whitespace | xml_escape }}</summary>
          <content type="html">{{ post.content | xml_escape }}</content>
        </entry>
      {% endfor %}
      </feed>
    LIQUID

    def generate(site)
      tags = site.tags
      site.config["tag_list"] = tags
        .map { |name, posts| { "name" => name, "slug" => Utils.slugify(name), "count" => posts.size } }
        .sort_by { |t| [-t["count"], t["name"].downcase] }

      tags.each do |tag, posts|
        slug = Utils.slugify(tag)

        feed = PageWithoutAFile.new(site, site.source, "feed/tags", "#{slug}.xml")
        feed.content = TEMPLATE
        feed.data.merge!(
          "layout" => nil,
          "sitemap" => false,
          "tag_name" => tag,
          "tag_posts" => posts.first(LIMIT)
        )
        site.pages << feed

        page = PageWithoutAFile.new(site, site.source, "tags/#{slug}", "index.html")
        page.content = ""
        page.data.merge!(
          "layout" => "tag",
          "title" => tag,
          "tag_name" => tag,
          "tag_slug" => slug,
          "description" => "Articles tagged #{tag}."
        )
        site.pages << page
      end
    end
  end
end
