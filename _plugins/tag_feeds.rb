# frozen_string_literal: true

module Jekyll
  # Writes an Atom feed for every tag at /feed/tags/<slug>.xml
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
        <link rel="alternate" type="text/html" href="{{ '/tags/' | absolute_url }}#{{ page.tag_name | slugify }}" />
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
      site.tags.each do |tag, posts|
        page = PageWithoutAFile.new(site, site.source, "feed/tags", "#{Utils.slugify(tag)}.xml")
        page.content = TEMPLATE
        page.data.merge!(
          "layout" => nil,
          "sitemap" => false,
          "tag_name" => tag,
          "tag_posts" => posts.first(LIMIT)
        )
        site.pages << page
      end
    end
  end
end
