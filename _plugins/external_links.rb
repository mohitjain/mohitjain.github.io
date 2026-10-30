# Open every external link in a new tab.
#
# After a page or post is fully rendered, each <a> that points at another site gets
# target="_blank" and rel="noopener". Links to this site, mailto:, tel:, #anchors and
# relative links are left alone, and a link that already sets target is not touched.
# It runs on the final HTML only, so the feeds (which are built from post content) are unaffected.
# rel="noopener" is added without "noreferrer" so other sites can still see where visits come from.
require "uri"

module ExternalLinks
  OPENING_TAG = /<a\b([^>]*)>/m
  HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/m
  REL = /\brel\s*=\s*(?:"([^"]*)"|'([^']*)')/m

  def self.external?(href, own_hosts)
    return false unless href =~ %r{\A(?:https?:)?//}i
    host = URI.parse(href.sub(%r{\A//}, "https://")).host.to_s.downcase
    !host.empty? && !own_hosts.include?(host)
  rescue URI::InvalidURIError
    false
  end

  def self.rewrite(html, own_hosts)
    html.gsub(OPENING_TAG) do |tag|
      attrs = Regexp.last_match(1)
      m = attrs.match(HREF)
      href = m && (m[1] || m[2])
      next tag unless href && external?(href.strip, own_hosts)
      next tag if attrs =~ /\btarget\s*=/

      attrs = if (r = attrs.match(REL))
                tokens = (r[1] || r[2]).split
                tokens << "noopener" unless tokens.include?("noopener")
                attrs.sub(REL, %(rel="#{tokens.join(' ')}"))
              else
                attrs + ' rel="noopener"'
              end
      %(<a#{attrs} target="_blank">)
    end
  end
end

Jekyll::Hooks.register [:pages, :documents], :post_render do |doc|
  next unless doc.output_ext == ".html" && doc.output

  host = URI.parse(doc.site.config["url"].to_s).host.to_s.downcase
  own_hosts = [host, "www.#{host}"].reject { |h| h == "www." }
  doc.output = ExternalLinks.rewrite(doc.output, own_hosts)
end
