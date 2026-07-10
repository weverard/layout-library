# Layout Scaffold Library

A collection of **standalone HTML layout + navigation scaffolds**. Each file is a
self-contained mock of one *navigation paradigm* — fork it as the starting point
for a real build. There is no framework, no build step, and no dependencies: every
scaffold is a single `.html` file with inline `<style>` and `<script>`.

A gallery (`index.html`) links to all of them with mini wireframe thumbnails.

> **For the new project:** treat this README as the contract. Keep every new
> scaffold faithful to the **Conventions** below, and keep the gallery in sync.
> If you want it to act as agent instructions, copy it to `CLAUDE.md`.

> **Status — done for the day (2026-06-23).** Grew the library 30 → **60 scaffolds**
> across **7 categories**. Filled the six original categories to 9 each (`31`–`50`,
> `56`–`59`) and added a new **Agentic commerce** category of 6 (`51`–`55`, `60`),
> including two ChatGPT-style homages: `55` (desktop, Shopping Research + Instant
> Checkout) and `60` (mobile, bottom-sheet checkout). Every scaffold was
> browser-verified (clean console + working interaction). Catalog/backlog/counts
> below are current. **Update 2026-07-04:** Agentic commerce grown 6 → **9**
> (`61` Chat + Live Product Canvas, `62` Human-in-the-Loop Approvals,
> `63` Comparison-in-Chat). **Update 2026-07-04 (later):** cleared the two
> non-agentic backlog items — `64` Globe (3D Points, Spatial) and `65`
> Ticker / Stock-Board (Objects & cards) — library now **65 scaffolds**.

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
2. **Design tokens in `:root`.** Color, type, and spacing live as CSS custom
   properties at the top. Re-skinning starts with **`--accent`** (one variable
   changes the identity). Keep a neutral base palette so the structure — not the
   colour — is the point.
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

1. Create `NN-slug.html` following the contract above (next free number).
2. **Verify it in a browser**, not just by reading it — open it, exercise the
   interaction, and check the console is clean.
3. Add a card to `index.html` in the most fitting category section. Card shape:
   ```html
   <a class="card" href="NN-slug.html" style="--accent:#HEX">
     <div class="thumb"><div class="tw t-MOTIF"> … </div></div>
     <div class="b">
       <p class="n">NN</p>
       <h3>Name</h3>
       <p class="nav"><b>Key verb</b> — one line on how you navigate.</p>
       <div class="tags"><span class="tag">use</span><span class="tag">use</span></div>
     </div>
   </a>
   ```
4. **Thumbnail:** the gallery draws mini wireframes purely in CSS via a `.tw`
   container plus a `t-MOTIF` modifier class (see the `<style>` block — search
   `t-split`, `t-canvas`, `t-bento`, etc.). Either reuse an existing motif or add
   a new `.t-yourmotif` rule. Keep thumbnails abstract and lightweight.
5. Bump the count in the intro (`N layouts` / heading).

---

## Forking one into a real build

- Strip the `.scaffold` badge and its CSS.
- Lift the `:root` tokens into your design system; remap `--accent` and fonts.
- Replace placeholder content; wire the nav JS to real routes/data.
- The structural CSS (the layout mechanics) is the part worth keeping — that's
  what each scaffold exists to demonstrate.

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

## The catalog (65)

**Foundations — app & document shells**
`01` Split Panel · `02` Centered Document · `03` Sidebar App Shell ·
`04` Three-Pane · `23` Bento Grid · `25` Accordion Spine · `26` Bottom-Sheet ·
`31` Tabbed Workspace · `32` Mobile Tab-Bar Shell

**Spatial — navigate through space**
`06` Infinite Canvas · `07` Zettelkasten Panes · `08` Radial Orbit ·
`09` Map-Pinned · `27` Elevator Floors · `28` Arrow Rooms ·
`33` Folder Column-View · `34` Isometric Scene · `35` Mind-Map Tree ·
`64` Globe (3D Points)

**Sequence & story — the axis is the nav**
`05` Scrollytelling · `10` Timeline Scrubber · `11` Horizontal Filmstrip ·
`12` Sticky-Stack Chapters · `36` Dial / Wheel Picker · `37` Stepper / Wizard ·
`38` Page-Turn Book · `39` Story Tap-Through · `40` Carousel / Slideshow

**Command & conversation — type, don't click**
`13` Command-Palette-First · `14` Terminal / CLI · `15` Chat-First ·
`41` Conversational Form · `42` Notebook / REPL Cells · `43` Keyboard Inbox ·
`44` Slash-Command Editor · `45` Live Filter Search · `46` Voice Assistant

**Objects & cards — the content is a thing**
`16` Desktop OS · `17` Card-Deck Swipe · `18` Pinboard Wall ·
`19` Split-Flap Board · `24` Cover Flow (3D) · `47` Kanban Board ·
`48` Masonry Gallery · `49` Card Wallet · `50` Data Table ·
`65` Ticker / Stock-Board

**Immersive — cinematic**
`20` Z-Axis Fly-Through · `21` Grid-to-Detail Morph · `22` Poster / Full-Bleed ·
`29` Marquee Index · `30` Spotlight Scroll · `56` Parallax Mouse Hero ·
`57` Diagonal / Skewed Editorial · `58` Particle Starfield Hero · `59` Cursor-Mask Reveal

**Slides & frames — presentation layouts**
`66` KPI Big-Number Slide · `67` Numbered-Steps Slide · `68` 2×2 Quadrant Matrix ·
`69` Versus / Comparison Slide · `70` Roadmap / Timeline Slide ·
`71` Title + Section-Divider System
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

## Info-design catalog

**Comparison — set side by side**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i01` | Grouped Bars with Annotation | 4 categories x 2 series | Two-series comparisons, plan-vs-actual |
| `i02` | Slope Chart | 6 entities x 2 time points | Before/after across many entities, rank shifts |
| `i03` | Dumbbell / Dot-Range | 8 rows x 2 values, sorted by delta | Gap analysis, before/after by group |

**Trend / Time-series — the shape of change**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i04` | Line with Confidence Band + Events | 36 monthly points + band, 2 events | KPIs with uncertainty, forecasts, experiments |
| `i05` | Streamgraph | 5 series x 12 points, stacked offsets | Evolving share of voice/volume |
| `i06` | Bump Chart | 6 entities x 6 periods of ranks | League positions, brand rankings |

**Part-to-whole — composition**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i07` | Waffle Grid | 3 named segments + remainder, sum to 100 | Shares of a population, survey splits |
| `i08` | Treemap | 8 leaves x 3 groups, precomputed rects | Budgets, portfolio weights, storage |
| `i09` | Stacked Bar with Leader Labels | 5 segments of one whole | Single-total breakdowns where each part deserves a sentence |

**Distribution — the shape of the data**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i10` | Histogram with Summary Stats | ~200 values pre-binned into 20 buckets + n/mean/median/p90 | Response times, prices, scores |
| `i11` | Ridgeline | 5 groups x 24 precomputed density points | Distributions across groups / time-of-day |
| `i12` | Beeswarm / Dot Strip | 3 categories x ~40 values, jitter precomputed | Small-n distributions where individual points matter |

**Correlation — how two things move**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i13` | Annotated Scatter with Trendline | 30 points (x,y) + precomputed regression (m,b,r²) | Two-metric relationships with named exceptions |
| `i14` | Bubble Quadrant | 12 items (label, x, y, size), x/y in [0,1] | Effort/impact, risk/return, growth/share |
| `i15` | Connected Scatter | One entity x 12 yearly points (year, x, y) | Two metrics evolving together over time |

**Ranking — order matters**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i16` | Ordered Bars with Highlight | 10 items (label, v, focal) sorted desc | "Where do we stand" rankings |
| `i17` | Lollipop with Benchmark | 12 items (label, v) + a benchmark value | Targets, SLAs, peer medians |
| `i18` | League Table with Deltas | 8 rows (name, v, prev) | Leaderboards, portfolios, team metrics |

**Flow & process — where things go**

| # | Chart | Data shape | Best for |
|---|---|---|---|
| `i19` | Sankey | 3 sources → 4 targets, node y-extents + ribbon bands precomputed | Traffic sources → outcomes, budget/energy flows |
| `i20` | Funnel | 5 stages (label, n) descending | Signup/checkout funnels, pipeline stages |
| `i21` | Chord Diagram | 5 entities, symmetric flow matrix, arc angles precomputed | Migrations, trade, who-talks-to-whom |

---

## Backlog — ideas not yet built

Agentic-commerce ideas not yet built: chat-assembled cart drawer ·
voice + chat commerce.
