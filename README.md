# Layout Scaffold Library

A collection of **standalone HTML layout + navigation scaffolds**. Each file is a
self-contained mock of one *navigation paradigm* — fork it as the starting point
for a real build. There is no framework, no build step, and no dependencies: every
scaffold is a single `.html` file with inline `<style>` and `<script>`.

A gallery (`index.html`) links to all of them with mini wireframe thumbnails.

> **For the new project:** treat this README as the contract. Keep every new
> scaffold faithful to the **Conventions** below, and keep the gallery in sync.
> If you want it to act as agent instructions, copy it to `CLAUDE.md`.

> **Status — done (2026-07-10).** The library is complete on both tabs. **Layouts:**
> 65 → **71** with a new Slides & frames category (`66`–`71`, six 16:9 presentation
> frames — KPI slide, numbered steps, quadrant matrix, versus/comparison, roadmap,
> title + section-dividers). **Info design:** built out from zero to **36** hand-coded
> chart scaffolds (`i01`–`i36`) across 12 categories — Comparison, Trend, Part-to-whole,
> Distribution, Correlation, Ranking, Flow, Hierarchy, Table/Heatmap, Geospatial,
> Pictorial, and Dashboard. **Chooser:** `info-design/chooser.html` is a two-step
> decision-tree picker (9 insight verbs → a refining question → 2–3 recommended
> charts) plus a master picker-prompt generated from the full catalog; linked from
> a banner at the top of the gallery's info-design tab. Every scaffold and chart was
> browser-verified (clean console + working interaction). Catalog/backlog/counts
> below are current.

> **Status — Phase 2 done (2026-07-22).** The 107 scaffolds (71 layouts + 36
> info-design charts) now share one token vocabulary and one helper canon
> (`tools/canon/`), enforced by an executable contract checker
> (`node tools/check.mjs`, rules R1–R12) instead of eyeballing. `catalog.json`
> is the single source of truth for every card, README row, chooser entry, and
> facet — `node tools/build.mjs` regenerates all three from it, so nothing is
> hand-edited in more than one place. The master index (`index.html`) is
> rebuilt on the wb-base-ui design system with a cross-cutting facet filter
> across all 107 (see Facets below); the chooser (`info-design/chooser.html`)
> is re-skinned onto the same atoms, its picker logic untouched.

---

## Quick start

```bash
# from this folder
python3 -m http.server 8800
# open http://localhost:8800/index.html
```

Most files also work by double-clicking (opening `file://…`). The few that fetch
nothing but rely on JS still work offline. **Heads-up:** `http.server` caches
aggressively — after editing a file, append a cache-buster (`?v=2`) to force a
fresh load in the browser.

---

## Conventions — the contract every scaffold follows

1. **One file, fully self-contained.** All CSS in a single `<style>`, all JS in a
   single `<script>`. No imports, no CDNs, no build. It must open and run from a
   bare file server.
2. **Design tokens in `:root` — the canonical 16, in order.** From
   `tools/canon/tokens.css`: `--accent`, `--accent-ink`, `--bg`, `--surface`,
   `--ink`, `--muted`, `--line`, `--pos`, `--neg`, `--serif`, `--sans`,
   `--mono`, `--s1`, `--s2`, `--s3`, `--s4`. Names and order are the contract;
   values are yours, except the spacing scale, which is canonical (`8px 14px
   24px 40px`). Re-skinning starts with **`--accent`** (one variable changes
   the identity). Keep a neutral base palette so the structure — not the
   colour — is the point. Extra file-specific tokens may follow the 16, never
   replace one. The shared helper canon (`tools/canon/helpers.js`) is `el`,
   `hideChip`, `escHtml` — any function using one of those three names must
   match canon byte-for-byte. `xOf`/`yOf`-style scale functions and chart
   interaction helpers like `showChip`/`attachHover` are chart-specific by
   design and sit outside that canon: each chart's scale domain and hover
   behaviour genuinely differ, so forcing them to one shape would just
   relabel two dozen unrelated functions under a shared name.
3. **A documentation header comment** at the very top of `<body>`/`<head>`:
   ```html
   <!--
     PATTERN    <name>
     NAV MODEL  <how the user moves through it, in 1–2 sentences>
     BEST FOR   <use cases>
     REGIONS    <the named structural parts>
     RE-SKIN    <what to change first; responsive note>
   -->
   ```
4. **Responsive.** Stack / collapse gracefully on small screens. State the
   breakpoint behaviour in the header comment.
5. **Neutral placeholder content.** Enough realism to read the pattern; nothing
   tied to a specific brand or domain.
6. **A removable scaffold badge.** A small fixed pill, bottom corner:
   ```html
   <div class="scaffold">NN · slug &nbsp;<a href="index.html">↔ gallery</a></div>
   ```
   It's explicitly disposable — delete it (and its CSS) when you fork the layout.
7. **Numbered, kebab-case filenames:** `NN-short-slug.html` (e.g. `08-radial-orbit.html`).

---

## Adding a new layout

Index cards are **generated** from `catalog.json` — hand-editing a card in
`index.html`, or a row in the README catalog, is erased by the next
`node tools/build.mjs`. The catalog entry is the only thing you write.

1. Create `NN-slug.html` following the Conventions above (next free number).
2. **Verify it in a browser**, not just by reading it — open it, exercise the
   interaction, and check the console is clean.
3. Add its entry to `catalog.json`'s `items` array. A real entry
   (`layouts/01-split-panel.html`'s) looks like this:
   ```json
   {
     "id": "01",
     "group": "layouts",
     "file": "layouts/01-split-panel.html",
     "title": "Split Panel",
     "category": "foundations",
     "accent": "#4F46E5",
     "oneliner": "Nav in a <b>fixed identity panel</b>; content scrolls beside it.",
     "tags": ["landing", "portfolio"],
     "facets": ["editorial"],
     "thumb": "<div class=\"tw t-split\"><div class=\"b2 fill\"></div>…</div>"
   }
   ```
   - `category` must be an existing key in `catalog.json`'s `categories` array
     for the `layouts` group.
   - `oneliner` may carry inline HTML (e.g. `<b>`) — it becomes the card's nav
     line verbatim.
   - `tags` are flavour text for the README catalog only; they never appear
     on the card.
   - `facets` are the filter axis and DO appear on the card, as chips. They
     must come from the closed vocabulary in `tools/canon/facets.json` (see
     Facets below) — anything outside it fails checker rule R12. Give the
     item at least one.
   - `thumb` is the mini wireframe: reuse an existing `.tw`/`.t-MOTIF` pairing
     from `index.html`'s `<style>` block (search `t-split`, `t-canvas`,
     `t-bento`, etc.), or add a new `.t-yourmotif` rule. Keep it abstract and
     lightweight.
4. Run `node tools/build.mjs`, then `node tools/check.mjs`. Build regenerates
   the card — `<a class="wb-card asset-card" href="…" style="--accent:#HEX"
   data-facets="…">`, with `<span class="wb-chip" data-facet="…">` chips —
   plus the README catalog row and the facet counts, straight from the entry
   above. Check confirms the whole contract still holds.
5. Bump the count where it's still written by hand: the `71 layouts` kicker
   in `index.html`'s hero, and the `## The catalog (71)` heading below.

---

## Forking one into a real build

- Strip the `.scaffold` badge and its CSS.
- Lift the `:root` tokens into your design system; remap `--accent` and fonts.
- Replace placeholder content; wire the nav JS to real routes/data.
- The structural CSS (the layout mechanics) is the part worth keeping — that's
  what each scaffold exists to demonstrate.

---

## Tooling

- `node tools/build.mjs` — regenerates every `gen:*` marker region (README
  catalogs + facet list, `info-design/chooser.html`'s CATALOG, and the
  index.html facet bar + cards) from `catalog.json`. Idempotent: a second run
  is a no-op.
- `node tools/check.mjs` — the contract checker; enforces R1-R12 across all
  107 scaffolds plus the repo-level rules (generated regions in sync, the
  catalog<->disk bijection, the closed facet vocabulary). Exits 1 on any
  violation.
- Adding a scaffold: create the file per Conventions, add its `catalog.json`
  entry, run build then check, browser-verify. Full field-by-field walkthrough
  in **Adding a new layout** above.
- `node --test --test-concurrency=1 tools/test/*.test.mjs` — the test suite.
  **Run it serially — do not drop `--test-concurrency=1`.** `build.test.mjs`
  and `check.test.mjs` both write the real `README.md`, `index.html`, and
  `info-design/chooser.html` as part of their setup; Node runs test files as
  concurrent processes by default, and two of them writing those same
  repo-root files at once has already corrupted `info-design/chooser.html`
  once (a truncated file with an unterminated JS literal). Serial execution
  is the only thing preventing a repeat.

---

## Gotchas (hard-won — save yourself the debugging)

- **Reserved globals at top-level script scope throw.** `let top` / `const history`
  (and `name`, `length`, `status`, `closed`, `parent`, `location`, `origin`,
  `self`, `event`, `screen`…) collide with `window.*` and error with *"Identifier
  already declared"*, killing the whole script. Rename them. (Inside a function or
  arrow body it's fine — those are block-scoped.)
- **Inline `<span>` ignores `width`/`height`.** Give shape elements `display:block`
  (or `inline-block`). A bare `<button>` also carries UA chrome — reset it:
  `appearance:none;background:none;border:0;padding:0`.
- **View Transitions: a `view-transition-name` must be unique per snapshot.** For a
  shared-element morph, don't name both source and destination up front — hand the
  name off *inside* the transition callback (source keeps it in the old snapshot,
  destination gets it in the new one).
- **Heading anchors / scroll-spy need unique ids.** When slugging headings, dedupe
  collisions (append `-1`, `-2`) or repeated names ("Outputs", "Use Cases") break
  both anchors and the active-state tracking.
- **Local server caches.** Append `?v=N` after edits to force a reload.

---

## The catalog (71)

<!-- gen:readme-layout-catalog start -->
**Foundations — app & document shells**
`01` Split Panel · `02` Centered Document · `03` Sidebar App Shell ·
`04` Three-Pane · `23` Bento Grid · `25` Accordion Spine ·
`26` Bottom-Sheet · `31` Tabbed Workspace · `32` Mobile Tab-Bar Shell

**Spatial — navigate through space**
`06` Infinite Canvas · `07` Zettelkasten Panes · `08` Radial Orbit ·
`09` Map-Pinned · `27` Elevator Floors · `28` Arrow Rooms ·
`33` Folder Column-View · `34` Isometric Scene · `35` Mind-Map Tree ·
`64` Globe (3D Points)

**Sequence & story — the axis is the nav**
`05` Scrollytelling · `10` Timeline Scrubber · `11` Horizontal Filmstrip ·
`12` Sticky-Stack Chapters · `36` Dial / Wheel Picker ·
`37` Stepper / Wizard · `38` Page-Turn Book · `39` Story Tap-Through ·
`40` Carousel / Slideshow

**Command & conversation — type, don't click**
`13` Command-Palette-First · `14` Terminal / CLI · `15` Chat-First ·
`41` Conversational Form · `42` Notebook / REPL Cells ·
`43` Keyboard Inbox · `44` Slash-Command Editor · `45` Live Filter Search ·
`46` Voice Assistant

**Objects & cards — the content is a thing**
`16` Desktop OS · `17` Card-Deck Swipe · `18` Pinboard Wall ·
`19` Split-Flap Board · `24` Cover Flow (3D) · `47` Kanban Board ·
`48` Masonry Gallery · `49` Card Wallet · `50` Data Table ·
`65` Ticker / Stock-Board

**Immersive — cinematic**
`20` Z-Axis Fly-Through · `21` Grid-to-Detail Morph ·
`22` Poster / Full-Bleed · `29` Marquee Index · `30` Spotlight Scroll ·
`56` Parallax Mouse Hero · `57` Diagonal / Skewed Editorial ·
`58` Particle Starfield Hero · `59` Cursor-Mask Reveal

**Slides & frames — presentation layouts**
`66` KPI Big-Number Slide · `67` Numbered-Steps Slide ·
`68` 2×2 Quadrant Matrix · `69` Versus / Comparison Slide ·
`70` Roadmap / Timeline Slide · `71` Title + Section-Divider System
> 16:9 slide *frames* — each renders as a centered slide stage
> (`aspect-ratio: 16/9`, scales to the viewport). These are layout mechanics
> for presentation-shaped pages; data *figures* (charts) are info-design
> territory and live in the separate info-design collection, not here.

**Agentic commerce — chat that buys**
`51` Mobile Shopping Chat · `52` Agentic Checkout Journey (deck) ·
`53` Streaming Agent Trace · `54` Multi-Agent Handoff ·
`55` ChatGPT Agentic Commerce (Shopping Research + Instant Checkout) ·
`60` ChatGPT Mobile Commerce (mobile chat + bottom-sheet checkout) ·
`61` Chat + Live Product Canvas · `62` Human-in-the-Loop Approvals ·
`63` Comparison-in-Chat
> Set of 9 (grown 6 → 9 on 2026-07-04 with `61`–`63`). `55` (desktop) and `60`
> (mobile) are illustrative ChatGPT-style homages (fictional products/merchants);
> `60` reuses `55`'s flow in a phone frame with checkout as a slide-up bottom
> sheet. `61` pairs a chat rail with a persistent product canvas, `62` is an
> approve/edit/reject proposal queue, `63` grows a comparison tray from chat
> mentions.
<!-- gen:readme-layout-catalog end -->

---

## Info-design contract

A second collection, `info-design/`, sits alongside `layouts/`. These are
**figures** (live hand-coded SVG charts), not navigation scaffolds — same
self-contained ethos, different anatomy. Every `info-design/iNN-slug.html`
follows this contract (full detail in `.superpowers/sdd/info-design-recipe.md`):

1. **Page anatomy:** `<main class="fig">` (kicker → serif `h1` headline that
   states the *insight*, not the axis names → sans `.dek` → `<figure>` holding
   an inline `<svg viewBox="…">` → `.source` line), then a `<details class="spec">`
   drawer (What it is / When to use it / Data shape / Visual style, tags, and a
   "Recreate prompt" box with a `#copy` button), then the `.scaffold` badge
   linking `../index.html#info-design`.
2. **Shared `:root` tokens** (identical across every file but `--accent`):
   `--bg --panel --ink --muted --line`, `--pos`/`--neg`, `--serif`/`--sans`/`--mono`,
   `--s1`–`--s4` spacing scale.
3. **Doc-header comment fields:** `CHART / DATA SHAPE / INSIGHT / BEST FOR / RE-SKIN`
   (not the layouts' PATTERN/NAV MODEL/REGIONS set).
4. **Editorial conventions:** horizontal-only hairline gridlines, direct labels
   over legend boxes, one `--accent` hue against warm neutrals, generous
   whitespace, a placeholder `const DATA = …` at the top of the script (the
   thing a forker replaces).
5. **Copy-prompt JS is identical in every file**, including the `file://`
   `execCommand('copy')` fallback (clipboard API needs a secure context, which
   `file://` is not).
6. **Body layout gotcha:** don't set `display:flex` on `<body>` — `main` and
   `details` are siblings and will lay out side-by-side. Center each block
   individually (`margin:0 auto` + `width:min(…, 94vw)`).

## Info-design catalog (36)

<!-- gen:readme-info-catalog start -->
**Comparison — set side by side**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i01` | Grouped Bars with Annotation | 4 categories × 2 series | Two-series category comparisons; plan vs actual |
| `i02` | Slope Chart | 6 entities × 2 time points | Before/after across many entities; rank shifts |
| `i03` | Dumbbell / Dot-Range | 8 rows × 2 values, sorted by delta | Gap analysis; before/after by group |

**Trend / Time-series — the shape of change**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i04` | Line with Confidence Band + Events | 1 series × 36 monthly points + band | KPIs with uncertainty, forecasts, experiments |
| `i05` | Streamgraph | 5 series × 12 monthly points, stacked | Evolving share of voice/volume |
| `i06` | Bump Chart | 6 entities × 6 periods of ranks | League positions, brand rankings over time |

**Part-to-whole — composition**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i07` | Waffle Grid | 3 named segments + remainder, sum to 100 | Shares of a population, survey splits |
| `i08` | Treemap | 8 leaves across 3 groups, rects precomputed | Budgets, portfolio weights, storage |
| `i09` | Stacked Bar with Leader Labels | 5 segments of one whole | Single-total breakdowns where each part deserves a sentence |

**Distribution — the shape of the data**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i10` | Histogram with Summary Stats | ~200 values pre-binned into 20 buckets | Response times, prices, scores |
| `i11` | Ridgeline (joyplot) | 5 groups × precomputed density curves | Distributions across groups / time-of-day |
| `i12` | Beeswarm / Dot Strip | 3 categories × ~40 values, jitter precomputed | Small-n distributions where individual points matter |

**Correlation — how two things move**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i13` | Annotated Scatter with Trendline | 30 points + precomputed regression line | Two-metric relationships with exceptions worth naming |
| `i14` | Bubble Quadrant | 12 items — {label, x, y, size} | Effort/impact, risk/return, growth/share |
| `i15` | Connected Scatter | One entity × 12 yearly points | Two metrics evolving together over time |

**Ranking — order matters**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i16` | Ordered Bars with Highlight | 10 items sorted descending | "Where do we stand" rankings |
| `i17` | Lollipop with Benchmark | 12 items + a single benchmark value | Targets, SLAs, peer medians |
| `i18` | League Table with Deltas | 8 rows (name, v, prev) | Leaderboards, portfolio tables, team metrics |

**Flow & process — where things go**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i19` | Sankey | 3 sources → 4 targets | Traffic sources → outcomes, budget flows, energy |
| `i20` | Funnel | 5 stages, descending | Signup/checkout funnels, pipeline stages |
| `i21` | Chord Diagram | 5 entities, symmetric flow matrix | Migrations, trade, who-talks-to-whom |

**Hierarchy & network — structure**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i22` | Radial Tree | root + 2 levels (6 branches × 2–4 leaves) | Org/topic structures with a focal branch |
| `i23` | Network Graph | 14 nodes, 18 links, positions precomputed | Collaboration, dependencies, influence maps |
| `i24` | Icicle / Partition | 3-depth hierarchy, spans precomputed | File sizes, budget trees, taxonomy weights |

**Table & heatmap — dense and exact**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i25` | Calendar Heatmap | 52 weeks × 7 days of counts | Activity rhythms, habit/commit data |
| `i26` | Matrix Heatmap with Marginals | 8 rows × 6 cols matrix + totals | Confusion matrices, region×product, time×channel |
| `i27` | Sparkline Table | 6 rows — {name, series[12], current, prev} | Metric overviews, watchlists |

**Geospatial — where**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i28` | Tile-Grid Cartogram | 24 regions — {code, label, col, row, v} | Per-region rates where area shouldn’t dominate |
| `i29` | Proportional Symbol Map | coastline path + 10 locations | Quantities at places (sales by city, outbreaks) |
| `i30` | Flow Map | coastline path + 1 origin + 6 destinations | Shipments, migration, network traffic |

**Pictorial — data made human**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i31` | Icon-Array Pictograph | {k, n} rate + a two-group comparison pair | Risk communication, survey shares, "1 in N" |
| `i32` | Proportional-Area Shapes | 4 items + a shape flag | Magnitude gaps too big for bars |
| `i33` | Annotated Big-Number Story | 1 hero stat + 3 support facts + sparkline | Report leads, posters, exec one-pagers |

**Dashboard & multi-chart — the whole picture**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i34` | KPI Dashboard | 4 KPIs + 1 main series + breakdown | Weekly ops reviews, product health |
| `i35` | Small Multiples | 12 series × 12 points, shared y-scale | Regions/products over time without spaghetti |
| `i36` | Narrative Dashboard | 1 main series (24 points) + 4 annotations | Post-mortems, monthly narratives, board packs |
<!-- gen:readme-info-catalog end -->

---

## Facets — the cross-cutting filter

Facets are a closed 15-value vocabulary defined in `tools/canon/facets.json`;
the array order there is the on-screen chip order in `index.html`. Every one
of the 107 catalog items carries at least one facet, so no card is
unreachable through the filter. Checker rule R12 enforces four things: each
item carries ≥1 facet, every value used is in the closed set, no facet is
carried by zero items, and every facet spans ≥2 categories — a facet confined
to a single category would just duplicate the left rail, which already
partitions the library by category. `index.html?f=mobile` opens the gallery
pre-filtered to that facet; multiple values OR together, e.g.
`?f=mobile,gallery`. Facets are separate from the per-card `tags`: tags are
flavour text on the catalog listing, facets are the filter axis, and the two
vocabularies are not interchangeable.

<!-- gen:readme-facets start -->
- `mobile` — phone-shaped: sheets, tab bars, tap, swipe
- `conversational` — chat, voice or agent is the interface
- `keyboard-driven` — driven by typing or keys, not pointing
- `playful` — toy-like, game-like, characterful
- `animated` — motion carries meaning, not decoration
- `narrative` — meant to be read start-to-finish
- `dashboard` — many metrics at a glance
- `before/after` — explicit A-vs-B or then-vs-now
- `ranking` — order or leaderboard is the point
- `geospatial` — place, maps, coordinates
- `hierarchy` — nested, tree, parent-child
- `time` — a time axis is central
- `editorial` — typographic, publication-like
- `gallery` — browsing a visual collection
- `commerce` — buying, checkout, loyalty
<!-- gen:readme-facets end -->

---

## Backlog — ideas not yet built

Info-design ideas not yet built: Marimekko · radial calendar · horizon chart ·
arc timeline · voronoi treemap · isotype comparison.

Agentic-commerce ideas not yet built: chat-assembled cart drawer ·
voice + chat commerce.
