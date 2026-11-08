# Chart types for bin/chart besides "cumulative": layers, timeline, drops, money, checklist, scorecard.
# Each returns an inline SVG string. Colours are CSS variables (see _sass/site/_post.scss), so the chart
# follows light and dark mode. Layout numbers were ported from the interactive charts in the author's
# original document, so the shapes match what the author chose.
require "cgi"
require "date"

module RichCharts
  MONTHS = %w[Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec].freeze

  module_function

  def esc(s) = CGI.escapeHTML(s.to_s)
  def n(x) = x.round(1).to_s.sub(/\.0\z/, "")
  def day(iso) = "#{MONTHS[iso[5, 2].to_i - 1]} #{iso[8, 2].to_i}"

  # one <text>; quiet text is the same ink at lower opacity (the site uses no greys)
  def text(x, y, s, size: nil, weight: nil, anchor: nil, quiet: false, color: nil, transform: nil)
    a = +%(x="#{n(x)}" y="#{n(y)}")
    a << %( font-size="#{size}") if size
    a << %( font-weight="#{weight}") if weight
    a << %( text-anchor="#{anchor}") if anchor
    a << %( fill-opacity=".68") if quiet
    a << %( fill="#{color}") if color
    a << %( transform="#{transform}") if transform
    %(<text #{a}>#{esc(s)}</text>)
  end

  def line(x1, y1, x2, y2, stroke: "var(--chart-grid)", width: 1, dash: nil, extra: "")
    d = dash ? %( stroke-dasharray="#{dash}") : ""
    %(<line x1="#{n(x1)}" y1="#{n(y1)}" x2="#{n(x2)}" y2="#{n(y2)}" stroke="#{stroke}" stroke-width="#{width}"#{d}#{extra}/>)
  end

  def svg(height, body, size: 12)
    %(<svg class="chart-svg rich" viewBox="0 0 760 #{height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="font-size:#{size}px">\n#{body.join("\n")}\n</svg>\n)
  end

  def heading(d)
    [text(24, 30, d["title"], size: 15, weight: 600), text(24, 50, d["subtitle"], size: 11.5, quiet: true)]
  end

  TONE = { "good" => "var(--chart-good)", "warn" => "var(--chart-warn)", "bad" => "var(--chart-bad)" }.freeze

  # ---- layers: boxes stacked top to bottom, an arrow along the left, a status badge on each -------
  def layers(d)
    o = heading(d)
    o << %(<defs><marker id="stack-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--chart-edge)"/></marker></defs>)
    o << line(80, 450, 80, 88, stroke: "var(--chart-edge)", width: 1.25, extra: ' marker-end="url(#stack-arrow)"')
    o << text(52, 268, d["arrow"], anchor: "middle", size: 11.5, quiet: true, transform: "rotate(-90 52 268)")
    o << text(76, 74, d["top_label"], anchor: "middle", size: 11.5, quiet: true)
    o << text(76, 476, d["bottom_label"], anchor: "middle", size: 11.5, quiet: true)
    y = 76
    d["layers"].each do |l|
      h = l["height"]; c = TONE.fetch(l["tone"])
      o << %(<rect x="120" y="#{y}" width="616" height="#{h}" rx="8" fill="none" stroke="var(--chart-edge)" stroke-width="1.25"/>)
      o << %(<rect x="528" y="#{y + 14}" width="192" height="26" rx="13" fill="#{c}" fill-opacity=".15" stroke="#{c}" stroke-width="1.25"/>)
      o << text(136, y + 26, l["name"], size: 14, weight: 600)
      (l["lines"] + [l["why"]]).each_with_index do |s, i|
        o << text(136, y + 46 + 16 * i, s, quiet: i == l["lines"].size)
      end
      o << text(624, y + 31, l["status"], anchor: "middle", size: 11.5)
      y += h + 16
    end
    svg(492, o, size: 12.5)
  end

  # ---- timeline: one row per event, diamonds on a month axis, the gap between two events marked ----
  def timeline(d)
    t = ->(s) { Date.parse(s).jd }
    lo, hi = t.(d["start"]), t.(d["end"])
    px = ->(s) { 340 + (t.(s) - lo).to_f / (hi - lo) * 390 }
    ev = d["events"]; row = ->(e) { 100 + 28 * ev.index(e) }
    o = heading(d)
    (6..11).each do |m|
      iso = format("2026-%02d-01", m); x = px.(iso)
      o << line(x, 84, x, 366)
      o << text(x + 4, 76, MONTHS[m - 1], size: 11.5, quiet: true)
    end
    ev.each do |e|
      y = row.(e); x = px.(e["date"]); c = e["accent"] ? "var(--chart-accent)" : "var(--chart-muted)"
      o << line(340, y, x, y)
      fill = e["plan"] ? "none" : c; dash = e["plan"] ? ' stroke-dasharray="2 2"' : ""
      diamond = "M#{n(x)} #{n(y - 7)}l7 7l-7 7l-7 -7z"
      o << %(<path d="#{diamond}" fill="var(--bg)"/>)  # solid backing so the row line does not show through
      o << %(<path d="#{diamond}" fill="#{fill}" stroke="#{c}" stroke-width="1.5"#{dash}/>)
      o << text(318, y + 4, day(e["date"]), anchor: "end", size: 11.5, quiet: true)
      o << text(24, y + 4, e["label"], weight: (e["accent"] ? 600 : nil))
    end
    a = ev.find { |e| e["key"] == d["gap_from"] }; b = ev.find { |e| e["key"] == d["gap_to"] }
    days = t.(b["date"]) - t.(a["date"])
    o << line(px.(a["date"]), row.(a) + 9, px.(a["date"]), 388, stroke: "var(--chart-accent)", dash: "3 3")
    o << line(px.(b["date"]), row.(b) + 9, px.(b["date"]), 388, stroke: "var(--chart-accent)", dash: "3 3")
    o << line(px.(a["date"]), 388, px.(b["date"]), 388, stroke: "var(--chart-accent)", width: 1.5)
    o << text((px.(a["date"]) + px.(b["date"])) / 2, 408, d["gap_label"].sub("{days}", days.to_s), anchor: "middle", weight: 600)
    svg(428, o)
  end

  # ---- drops: grouped horizontal bars of percentage falls, with reference lines ---------------------
  def drops(d)
    rows = d["rows"]; groups = rows.map { |r| r["layer"] }.uniq
    avg = ->(l) { (l.sum { |r| r["drop"] } / l.size).round }
    low = avg.(rows.select { |r| groups.index(r["layer"]) < 2 }); high = avg.(rows.select { |r| groups.index(r["layer"]) >= 2 })
    x = ->(v) { 200 + v * 7 }
    ry = ->(r) { 104 + rows.index(r) * 24 + (groups.index(r["layer"]) + 1) * 26 }
    nas, bear = d["refs"]
    o = [text(24, 30, d["title"], size: 15, weight: 600), text(24, 50, d["subtitle"].sub("{low}", low.to_s).sub("{high}", high.to_s), size: 11.5, quiet: true)]
    o << line(x.(nas["drop"]), 84, x.(nas["drop"]), 484, stroke: "var(--chart-edge)", dash: "4 3")
    o << text(x.(nas["drop"]) - 4, 78, "#{nas["label"]} −#{n(nas["drop"])}%", anchor: "end", size: 11, quiet: true)
    o << line(x.(bear["drop"]), 84, x.(bear["drop"]), 484, stroke: "var(--chart-edge)", dash: "4 3")
    o << text(x.(bear["drop"]) + 4, 78, "#{bear["label"]} −#{n(bear["drop"])}%", size: 11, quiet: true)
    o << line(200, 84, 200, 484, stroke: "var(--chart-edge)")
    groups.each { |g| o << text(24, ry.(rows.find { |r| r["layer"] == g }) - 20, g, weight: 600) }
    rows.each do |r|
      y = ry.(r); op = n(1 - groups.index(r["layer"]) * 0.2)
      o << text(40, y + 4, r["name"])
      o << %(<rect x="200" y="#{y - 8}" width="#{n(r["drop"] * 7)}" height="16" rx="3" fill="var(--chart-accent)" fill-opacity="#{op}"/>)
      o << text([x.(r["drop"]), x.(nas["drop"])].max + 6, y + 4, "−#{n(r["drop"])}%")
    end
    svg(500, o)
  end

  # ---- money: horizontal bars of dollar amounts with one reference line -----------------------------
  def money(d)
    rows = d["rows"]; x = ->(v) { 350 + v * 0.088 }; y = ->(i) { 100 + i * 30 }
    fmt = ->(v) { v >= 1000 ? format("$%.1fT", v / 1000.0) : "$#{n(v)}B" }
    o = heading(d)
    rows.each_with_index do |r, i|
      o << text(338, y.(i) + 4, r["item"], anchor: "end")
      o << %(<rect x="350" y="#{y.(i) - 9}" width="#{n(r["usd"] * 0.088)}" height="18" rx="3" fill="var(--chart-accent)"/>)
      o << text(x.(r["usd"]) + 6, y.(i) + 4, fmt.(r["usd"]))
    end
    ref = d["ref"]
    o << line(x.(ref["usd"]), 84, x.(ref["usd"]), 394, stroke: "var(--chart-edge)", width: 1.5, dash: "4 3")
    o << text(x.(ref["usd"]) + 6, 412, "#{ref["label"]}: about #{fmt.(ref["usd"])} a year", weight: 600)
    o << line(350, 84, 350, 394, stroke: "var(--chart-edge)")
    svg(440, o)
  end

  # ---- checklist: a ruled table with a tick or a half in the last column ---------------------------
  def checklist(d)
    c = d["columns"]; o = heading(d)
    o << text(48, 84, c[0], weight: 600, quiet: true) << text(256, 84, c[1], weight: 600, quiet: true)
    o << text(466, 84, c[2], weight: 600, quiet: true) << text(726, 84, c[3], anchor: "middle", weight: 600, quiet: true)
    o << line(24, 94, 744, 94, stroke: "var(--chart-edge)")
    d["rows"].each_with_index do |r, i|
      y = 116 + 32 * i
      o << text(24, y, (i + 1).to_s, quiet: true) << text(48, y, r[0], weight: 600) << text(256, y, r[1]) << text(466, y, r[2])
      o << (r[3] == "✓" ? text(726, y + 1, "✓", anchor: "middle", size: 14, weight: 600, color: "var(--chart-accent)") : text(726, y + 1, r[3], anchor: "middle", size: 13, weight: 600, quiet: true))
      o << line(24, y + 12, 744, y + 12)
    end
    svg(436, o, size: 11.5)
  end

  # ---- scorecard: a ruled table of checks, two verdict boxes underneath ----------------------------
  def scorecard(d)
    c = d["columns"]; o = heading(d)
    o << text(24, 84, c[0], weight: 600, quiet: true) << text(96, 84, c[1], weight: 600, quiet: true)
    o << %(<rect x="268" y="76" width="8" height="8" rx="4" fill="var(--chart-bad)"/>) << text(282, 84, c[2], weight: 600, quiet: true)
    o << %(<rect x="518" y="76" width="8" height="8" rx="4" fill="var(--chart-good)"/>) << text(532, 84, c[3], weight: 600, quiet: true)
    o << line(24, 94, 736, 94, stroke: "var(--chart-edge)")
    d["rows"].each_with_index do |r, i|
      y = 114 + 34 * i
      o << text(24, y, r[0], quiet: true) << text(96, y, r[1], weight: 600) << text(272, y, r[2]) << text(522, y, r[3])
      o << line(24, 126 + i * 34, 736, 126 + i * 34)
    end
    [["right", 24, "var(--chart-bad)"], ["wrong", 388, "var(--chart-good)"]].each do |k, x, col|
      o << %(<rect x="#{x}" y="392" width="348" height="64" rx="8" fill="#{col}" fill-opacity=".1" stroke="#{col}" stroke-width="1.25"/>)
      o << text(x + 16, 416, d[k]["head"], size: 12.5, weight: 600) << text(x + 16, 436, d[k]["body"])
    end
    svg(480, o, size: 11.5)
  end
end
