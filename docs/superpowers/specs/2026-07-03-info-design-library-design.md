# Info-Design Library + Gallery Restructure + Layouts Follow-ups — Design

**Date:** 2026-07-03
**Status:** Approved (Approach 1)
**Inspiration:** https://infodesign.netlify.app/ ("Info Design for GenAI" by Vinay Thakur) — 210 image-based chart references, each with a structured spec and a copy-paste "recreate prompt". Reference copy of its `catalog.json` analysed during brainstorming.

## Goal

Grow the Layout Scaffold Library into a two-collection library:

1. **Layouts** (existing, `/layouts`) — navigation-paradigm scaffolds. Finish open follow-ups and add a new "Slides & frames" category. 60 → 71 files.
2. **Info design** (new, `/info-design`) — a collection of 36 information-design scaffolds: live, standalone, hand-coded charts. Where the inspiration site offers an *image + prompt*, we offer a *working chart + spec + prompt*.

Plus an interactive **chooser** that maps "my data + my insight" to recommended designs, and a restructured tabbed gallery.

## Decisions made during brainstorming

| Question | Decision |
|---|---|
| What is each info-design item? | **Live chart + spec + copy-prompt** in one self-contained HTML file |
| First tranche size | **36** — 3 per category across 12 categories |
| Chooser mechanism | **Both:** static interactive chooser page + copyable master picker-prompt. (Live AI picker explicitly deferred.) |
| Slide-template genre | New **"Slides & frames"** category in the *Layouts* tab (6 scaffolds), not in info-design |
| Creative direction | **Original, genre-inspired** — use the inspiration site's taxonomy/card anatomy as skeleton; design our own charts with a shared editorial aesthetic. No recreations of their images. |
| Architecture | **Approach 1** — one root gallery with two tabs; everything self-contained; catalog metadata embedded as JS (no fetch, `file://` keeps working) |

## Non-goals

- No build step, no frameworks, no CDNs, no fetch — the existing contract holds for every new file.
- No live AI integration (API-key picker) — deferred as a separate experiment.
- No recreation of the inspiration site's images or copying of its prompt text; its taxonomy (category names, card anatomy) is the only thing borrowed.
- Charting libraries (D3 etc.) are out — every chart is hand-coded SVG/CSS/JS.

## Part 1 — Gallery restructure (fixes current breakage)

The 60 layout files were moved into `/layouts` after `index.html` was written; every gallery card href (`NN-slug.html`) and every scaffold badge inside the files (`href="index.html"`) is currently broken.

- Rework root `index.html` into a **two-tab shell**: `Layouts` and `Info design`. Tabs are in-page (CSS/JS show-hide, `location.hash` deep-linking: `#layouts` / `#info-design`). No routing, no fetch.
- Rewire all 60 card hrefs to `layouts/NN-slug.html`.
- Fix the badge link in all 60 layout files: `href="index.html"` → `href="../index.html"` (mechanical sweep; same change baked into all new files).
- Info-design cards follow the same card shape; thumbnails use the existing CSS-wireframe `.tw/.t-MOTIF` system where possible, and may use a tiny inline `<svg>` where a chart shape can't reasonably be drawn in CSS. Keep thumbs abstract and lightweight.
- The Info design tab gets a prominent link card to the chooser (Part 4).
- Counts in the intro become per-collection ("71 layouts · 36 info designs").

## Part 2 — Layouts follow-ups (60 → 71)

All follow the existing README contract verbatim (header comment, `:root` tokens, `--accent`, responsive note, badge with `../index.html`, numbered kebab-case filenames continuing from `61`).

**Agentic commerce 6 → 9** (from the README backlog; picked for most-distinct nav models):
- `61` Chat + live product canvas — chat pane drives a persistent product canvas that updates as the agent works.
- `62` Human-in-the-loop approvals — agent proposes actions; nav is an approve/edit/reject queue.
- `63` Comparison-in-chat — agent assembles a growing comparison table/tray across the conversation.

**Backlog scaffolds:**
- `64` Globe (3D points) — CSS/JS 3D-projected rotating point globe, pins as nav (**Spatial**).
- `65` Ticker / stock-board — live-updating board rows; row focus drives a detail pane (**Objects & cards**).

**New category: Slides & frames** (the "actually a layout" genre from the inspiration site's 53 slide templates):
- `66` KPI big-number slide — hero stat + two supporting bars.
- `67` Numbered-steps slide — 1-2-3 process frame.
- `68` 2×2 quadrant matrix — axes + plotted labels.
- `69` Versus / comparison slide — split A-vs-B frame.
- `70` Roadmap / timeline slide — horizontal phased lanes.
- `71` Title + section-divider system — cover, divider, closing frames with paging.

These are *presentation frames* (layout mechanics), distinct from info-design *figures* (data mechanics). Keyboard paging where a deck metaphor applies.

## Part 3 — Info-design library (36 charts in `/info-design`)

### Categories and charts (12 × 3)

Forms chosen for diversity and craft, including forms the inspiration site lacks. Numbering is independent of layouts: `i01`–`i36`, filenames `iNN-slug.html`.

| Category | Charts |
|---|---|
| Comparison | `i01` grouped bar w/ annotation layer · `i02` slope chart · `i03` dumbbell / dot-range |
| Trend / Time-series | `i04` line w/ confidence band + event markers · `i05` streamgraph · `i06` bump chart (rank over time) |
| Part-to-whole | `i07` waffle grid · `i08` treemap · `i09` stacked bar w/ leader labels |
| Distribution | `i10` histogram + summary stats · `i11` ridgeline · `i12` beeswarm / dot-strip |
| Correlation | `i13` annotated scatter w/ trendline · `i14` bubble quadrant · `i15` connected scatter (path over time) |
| Ranking | `i16` ordered bar w/ highlight · `i17` lollipop · `i18` league table w/ inline deltas |
| Flow / Process | `i19` sankey · `i20` funnel · `i21` chord diagram |
| Hierarchy / Network | `i22` radial tree · `i23` network graph · `i24` icicle / partition |
| Table / Heatmap | `i25` calendar heatmap · `i26` matrix heatmap w/ marginal totals · `i27` sparkline table |
| Geospatial / Map | `i28` tile-grid cartogram · `i29` proportional-symbol map · `i30` flow map (origin→destination arcs) |
| Pictorial / Infographic | `i31` icon-array pictograph · `i32` proportional-area shapes · `i33` annotated "big number" statistical story |
| Dashboard / Multi-chart | `i34` KPI dashboard (stat tiles + sparklines) · `i35` small multiples grid · `i36` narrative dashboard (chart + annotations rail) |

The exact 36 may be refined at planning time, but each category keeps 3 distinct *data shapes* and the collection keeps forms-beyond-the-inspiration-site.

### Anatomy of one info-design file

Single self-contained HTML, structured as:

1. **The chart** — hero of the page. Hand-coded inline SVG (or CSS where natural, e.g. waffle). Neutral, realistic placeholder data embedded as a small JS array/object at the top of the script so forkers see exactly what to replace. Light interaction where it earns its keep (hover value readouts, series toggles) — not required for every chart.
2. **Spec drawer** — collapsible panel below the chart with the inspiration site's card anatomy: **What it is · When to use it · Data shape · Visual style**. Plus tags.
3. **Copy prompt** — button that copies a recreate-prompt to the clipboard (`navigator.clipboard` with a `textarea` fallback for `file://`). The prompt describes *our* design in words so any capable LLM can rebuild it with the user's data — same philosophy as the inspiration site, but pointing at our design, in our words.
4. **Scaffold badge** — `iNN · slug ↔ gallery` linking `../index.html#info-design`.

**Documentation header comment** (adapted from the layouts contract):

```html
<!--
  CHART        <name>
  DATA SHAPE   <what the input data looks like, e.g. "2 series × N time points">
  INSIGHT      <the verb: compare / reveal change / show composition / relate /
                distribute / rank / show flow / locate>
  BEST FOR     <use cases>
  RE-SKIN      <what to change first; responsive note>
-->
```

### Shared editorial aesthetic

One tokenized chart style across all 36 so the collection reads as a designed set:

- `:root` tokens: `--accent` (single hue that re-skins the file), a restrained neutral ramp, `--font-display` (serif for titles) / `--font-body` (sans), spacing scale.
- Conventions: subtle horizontal-only gridlines, direct labelling over legends where possible, title-as-headline (the insight, not the axis names) + dek line, source line footer, generous whitespace.
- Responsive: charts scale via `viewBox`; spec drawer stacks below on small screens.

## Part 4 — The chooser (`info-design/chooser.html`)

One self-contained page, two halves:

**A. Interactive chooser** (static decision tree, FT-Visual-Vocabulary spirit):
- Step 1: pick the **insight verb** (compare · reveal change · show composition · relate · distribute · rank · show flow · locate · tell a story with one number).
- Step 2: 1–2 refinements that depend on step 1 (e.g. how many series / is time involved / few-vs-many categories).
- Output: 2–3 recommended scaffolds as cards with a one-line *why*, linking to the files. Pure JS over an embedded catalog array.

**B. Master picker-prompt:**
- A copyable mega-prompt embedding a compact one-line-per-chart catalog (id · name · data shape · insight · when-to-use). User pastes it plus their data/insight into Claude/ChatGPT; the LLM names the best 1–3 designs and can then be handed the chosen scaffold's own recreate prompt (or the file itself) to build the finished figure.
- The embedded catalog is generated once at build time and lives inline in the page (no fetch).

The catalog array (id, title, category, data shape, insight verbs, href) is defined **once** in `chooser.html`; the gallery's info-design tab does not depend on it (cards there are static HTML like the layouts tab).

## Part 5 — README + conventions

- README stays the contract; gains an **Info-design contract** section (anatomy above), the chooser description, the new catalog tables, updated counts, and a status entry.
- "Adding a new info design" checklist mirroring the layouts one (create file → browser-verify → add gallery card → add chooser catalog row → bump counts).
- Backlog section updated: built items removed; seed a new info-design backlog (e.g. Marimekko, radial calendar, horizon chart, arc timeline, voronoi treemap, isotype comparison).

## Sequencing

1. **Phase 1 — Gallery rewire.** Tab shell, 60 href fixes, 60 badge fixes. Library goes from broken to working before anything new lands.
2. **Phase 2 — Layouts follow-ups.** `61`–`71` + gallery cards + README.
3. **Phase 3 — Info-design foundations.** Conventions, shared tokens, first category (Comparison, `i01`–`i03`) built end-to-end as the template trio; gallery tab wired.
4. **Phase 4 — Remaining 33 charts**, category by category.
5. **Phase 5 — Chooser** (needs the full catalog to exist) + README/backlog finalisation.

Every file browser-verified per the README rule: open it, exercise the interaction, clean console. Phases 3–4 likely span sessions; each phase leaves the library consistent (counts, cards, catalog in sync).

## Testing / verification

- No test framework (none exists in this project). Verification = browser checks per file plus a link sweep: every gallery card href resolves, every badge resolves back, chooser recommendation links resolve.
- Known gotchas to respect (from README): reserved globals at top-level script scope; `http.server` caching (`?v=N`); unique ids for anchors; `<span>` needs `display:block` for shapes.

## Risks

- **36 hand-coded charts is the bulk of the effort.** Mitigation: Phase 3 builds a template trio first to lock conventions; later categories reuse the skeleton.
- **Complex forms (sankey, chord, network, flow map) are fiddly without a library.** Static-first: precomputed layout constants in the placeholder data are acceptable; the scaffold demonstrates the *design*, not a general-purpose layout algorithm.
- **Gallery size** — one `index.html` now carries ~107 cards + two thumbnail systems. Acceptable; it's still one static file. If it becomes unwieldy, splitting per-tab styles is a later refactor, not part of this design.
