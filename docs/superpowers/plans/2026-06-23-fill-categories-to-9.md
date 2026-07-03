# Fill Categories to 9 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 24 new single-file HTML scaffolds (`31`–`54`) so every one of the six `index.html` categories holds exactly 9 cards (30 → 54 total).

**Architecture:** Each scaffold is one self-contained `.html` file (inline `<style>` + `<script>`, no deps) obeying the README contract. Built in six category batches; each scaffold is browser-verified (clean console + working interaction) before its gallery card is added. After each batch, `index.html` cards/count and `README.md` catalog are updated.

**Tech Stack:** Vanilla HTML/CSS/JS. Verification via Playwright MCP (headless Chromium). Local preview via `python3 -m http.server`.

## Global Constraints

Copied verbatim from the spec's contract — every task includes these:

- **One file, fully self-contained.** All CSS in one `<style>`, all JS in one `<script>`. No imports/CDNs/build. Must run from a bare file server.
- **Design tokens in `:root`.** Re-skin starts with `--accent`. Neutral base palette.
- **Doc header comment** at top: `PATTERN / NAV MODEL / BEST FOR / REGIONS / RE-SKIN`.
- **Responsive** — stack/collapse on small screens; state breakpoint in the header.
- **Neutral placeholder content**, no brand/domain lock-in.
- **Removable `.scaffold` badge**, fixed bottom-right: `NN · slug &nbsp;<a href="index.html">↔ gallery</a>`.
- **Numbered kebab-case filename** `NN-slug.html`.
- **No reserved globals at top-level script scope:** `top, history, name, length, status, closed, parent, location, origin, self, event, screen`. Rename or wrap in a function/IIFE.
- **Shape `<span>`/`<button>` need `display:block`** (or inline-block) + button UA reset (`appearance:none;background:none;border:0;padding:0`).
- **`view-transition-name` unique per snapshot**; dedupe heading ids for scroll-spy.
- **Structural template:** mirror the token block, base reset, `--sans`/`--mono` vars, and `.scaffold` badge CSS from an existing scaffold (e.g. `23-bento.html`). Match existing code style.

**No git repo:** the project is not under version control, so there are no commit steps. Each task's checkpoint is **browser verification**, not a commit. (Offer to `git init` separately if desired.)

**Accent palette (starting points):**
31 `#4338CA` · 32 `#0EA5A4` · 33 `#9333EA` · 34 `#0891B2` · 35 `#DB2777` · 36 `#F59E0B` · 37 `#2563EB` · 38 `#B45309` · 39 `#E11D48` · 40 `#7C3AED` · 41 `#10B981` · 42 `#EA580C` · 43 `#4F46E5` · 44 `#0D9488` · 45 `#0284C7` · 46 `#7E22CE` · 47 `#EA580C` · 48 `#DB2777` · 49 `#0F766E` · 50 `#475569` · 51 `#22D3EE` · 52 `#F97316` · 53 `#6366F1` · 54 `#EF4444`

---

## File Structure

- **Create:** `31-tabbed-workspace.html` … `54-cursor-mask.html` (24 files, numbers/slugs per the spec catalog).
- **Modify:** `index.html` — add 24 `<a class="card">` entries (4 per category section), add any new `.t-MOTIF` thumbnail CSS rules, bump the intro count 30 → 54.
- **Modify:** `README.md` — move built items from Backlog into The catalog under their category; bump `## The catalog (30)` → `(54)`; prune built backlog ideas.

Each scaffold owns one file with one responsibility (one nav paradigm). `index.html` and `README.md` are the only shared files touched, and only additively.

---

## Per-scaffold authoring recipe (applies to every Create step)

For each `NN-slug.html`:
1. Copy the skeleton from `23-bento.html`: `<!doctype html>` → `<head>` with charset/viewport/title `NN · Name — Layout scaffold`, the doc-header comment, the `:root` token block (set `--accent` to the assigned hex), base reset, and the `.scaffold` badge markup/CSS at the end of `<body>`.
2. Replace the `REGIONS`/`NAV MODEL`/`BEST FOR`/`RE-SKIN` comment lines with this scaffold's (given per task).
3. Build the regions + the signature interaction (given per task).
4. Add the responsive rule described.
5. **Verify (the test cycle):** see "Verification procedure" below. Only when clean, continue.

## Verification procedure (the test cycle for every scaffold)

Run a local server once per session: `python3 -m http.server 8800` in the project root.

For each file, using Playwright MCP:
- [ ] Navigate to `http://localhost:8800/NN-slug.html?v=<n>` (bump `v` after edits to dodge the cache).
- [ ] Take a snapshot; confirm the regions render and layout isn't broken.
- [ ] Exercise the signature interaction (click/drag/type/scroll as specified) and confirm it responds.
- [ ] Read console messages; **expected: zero errors and zero warnings**. If any, fix and re-verify.
- [ ] Resize to 400px wide; confirm the responsive behaviour described (no horizontal overflow / graceful stack).

---

## Per-batch gallery + README integration (runs at the end of each Task)

After a batch's scaffolds all verify clean:

- [ ] For each new scaffold, add a card to its category `<section>` in `index.html`, in number order, using the documented shape:
  ```html
  <a class="card" href="NN-slug.html" style="--accent:#HEX"><div class="thumb"><div class="tw t-MOTIF"> … </div></div><div class="b"><p class="n">NN</p><h3>Name</h3><p class="nav"><b>Verb</b> — one line.</p><div class="tags"><span class="tag">use</span><span class="tag">use</span></div></div></a>
  ```
- [ ] Reuse an existing `.t-MOTIF` if one fits; otherwise add a lightweight `.t-<slug>` rule to the gallery `<style>` (match the existing abstract wireframe vocabulary).
- [ ] Verify in browser: `http://localhost:8800/index.html?v=<n>` — the category now shows the right number of cards, each new thumbnail renders, and each card links to a working file. Console clean.
- [ ] Update `README.md`: move the built patterns into The catalog under this category.

Defer the final count bumps (intro "N layouts", `## The catalog (NN)`, backlog prune) to Task 7.

---

### Task 1: Foundations batch (31–32)

**Files:** Create `31-tabbed-workspace.html`, `32-mobile-tabbar.html`. Modify `index.html` (Foundations section), `README.md`.

**Interfaces:** Produces two files linked from the Foundations `<section>`; brings that section to 9 cards.

- [ ] **31 — Tabbed Workspace.** Header: `NAV MODEL` browser-in-browser tab strip; click a tab to switch its pane, `×` closes, `+` opens a new tab, drag to reorder. `REGIONS` `.tabbar` (tabs + new-tab) · `.panes` (one active `.pane`). `BEST FOR` multi-doc tools, dashboards-with-contexts, editors. `RE-SKIN` `--accent` = active-tab marker; collapses tab labels to icons under ~560px. Build: an array of tab objects in JS; clicking sets active; `×` removes (keep ≥1); `+` appends; reorder via HTML5 drag (`draggable`, `dragover`, `drop`) swapping array order then re-render. Each pane shows distinct placeholder content. Responsive: tabs scroll horizontally / shrink to icons under 560px.
- [ ] Verify 31 (Verification procedure): switch tabs, close one, add one, drag-reorder; console clean.
- [ ] **32 — Mobile Tab-Bar Shell.** Header: `NAV MODEL` phone-frame app; a fixed bottom tab bar of 4 items, tap (or swipe the content) to change section, active icon highlights. `REGIONS` `.phone` frame · `.screen` (sections) · `.tabbar` (4 `.tab`). `BEST FOR` mobile apps, PWAs, content apps. `RE-SKIN` `--accent` = active tab tint; on wide screens the phone centers on a backdrop, on narrow it fills. Build: 4 sections, only the active shown; tapping a tab sets active + slides; optional left/right swipe (pointer/touch deltas) advances. Active tab gets `--accent`. Responsive: phone frame max ~390px centered ≥480px; full-bleed below.
- [ ] Verify 32: tap each tab, swipe between sections; console clean.
- [ ] **Integration:** add cards 31, 32 to the Foundations `<section>` (motifs: 31 ≈ a tab-strip wireframe — add `.t-tabs`; 32 ≈ a phone with bottom bar — add `.t-phone`). Verify gallery; Foundations now 9. Update README catalog Foundations.

### Task 2: Spatial batch (33–35)

**Files:** Create `33-column-view.html`, `34-isometric.html`, `35-mind-map.html`. Modify `index.html` (Spatial), `README.md`.

**Interfaces:** Produces three files; Spatial → 9.

- [ ] **33 — Folder Column-View.** Header: `NAV MODEL` Miller columns; selecting an item reveals its children as a new column to the right; deeper selection extends the path. `REGIONS` `.columns` (scroller) · `.col` (list) · `.item` (`.has-children` chevron) · `.preview` (leaf detail). `BEST FOR` file browsers, taxonomies, nested settings. `RE-SKIN` `--accent` = selected-row highlight; under ~640px show only the deepest 1–2 columns (others collapse). Build: a nested tree object; selecting an item truncates columns to its depth, appends its children as the next column, highlights the selection path; a leaf shows a preview pane; horizontal-scroll to the newest column. Responsive: narrow → show only last two columns.
- [ ] Verify 33: drill several levels, jump back up a column, open a leaf; console clean.
- [ ] **34 — Isometric Scene.** Header: `NAV MODEL` a 2.5D plane of tiles/buildings; hover lifts a tile, click focuses/"travels" to it (camera nudges, others dim). `REGIONS` `.scene` (transformed plane) · `.tile`/`.bldg` · `.hud` (focused-zone info). `BEST FOR` playful hubs, world/level select, campus maps. `RE-SKIN` `--accent` = focused tile + HUD; on small screens reduce the isometric skew for legibility. Build: a grid of blocks on a CSS `transform: rotateX(55deg) rotateZ(45deg)` plane (or matrix); `translateZ`/box-shadow for height; clicking a tile sets focus, raises it, fills the HUD; arrow keys move focus between tiles. Responsive: shrink plane scale + flatten skew under ~560px.
- [ ] Verify 34: hover tiles, click to focus, arrow-key move; console clean.
- [ ] **35 — Mind-Map Tree.** Header: `NAV MODEL` a central node with branches; click a node to expand/collapse its children; the tree re-lays-out around it. `REGIONS` `.map` (svg/abs-positioned) · `.node` (`.root`/`.branch`/`.leaf`) · `.edge` lines. `BEST FOR` topic maps, org/site structure, brainstorms. `RE-SKIN` `--accent` = active node + its edges; on narrow screens switch to a vertical indented outline. Build: a hierarchy object; render nodes radially/branching with connector lines (SVG `<path>` or CSS); clicking toggles a node's `expanded` and re-renders edges + positions; active node highlighted. Distinct from `08` (orbit). Responsive: under ~600px render as an indented collapsible outline instead of radial.
- [ ] Verify 35: expand/collapse branches, select a node; console clean.
- [ ] **Integration:** add cards 33–35 to Spatial (motifs: 33 reuse `t-three`/add `.t-cols`; 34 add `.t-iso`; 35 add `.t-tree`). Verify; Spatial → 9. Update README catalog Spatial.

### Task 3: Sequence & story batch (36–40)

**Files:** Create `36-dial-picker.html`, `37-stepper.html`, `38-page-turn.html`, `39-story-tap.html`, `40-carousel.html`. Modify `index.html` (Sequence), `README.md`.

**Interfaces:** Produces five files; Sequence → 9.

- [ ] **36 — Dial / Wheel Picker.** Header: `NAV MODEL` an iOS rotating wheel; drag or scroll to spin through a sequence, the centred item is selected (snaps; edges fade in perspective). `REGIONS` `.wheel` (3D rotated list) · `.item` · `.selection` (center band) · `.readout`. `BEST FOR` value pickers, time/date, mode select. `RE-SKIN` `--accent` = selection band + readout; touch + wheel + drag all spin it. Build: items on a `rotateX` cylinder (`transform-style:preserve-3d`, each item `rotateX(i*deg) translateZ(r)`); wheel/drag changes the angle; snap to nearest item on release; centered item → readout. Guard against reserved globals. Responsive: scale wheel down under ~480px.
- [ ] Verify 36: scroll-spin, drag-spin, confirm snap + readout; console clean.
- [ ] **37 — Stepper / Wizard.** Header: `NAV MODEL` numbered linear steps along a progress rail; Next/Back move; completed steps tick. `REGIONS` `.rail` (steps) · `.step` (`.done`/`.current`) · `.panel` (step content) · `.controls`. `BEST FOR` checkout, onboarding, forms. `RE-SKIN` `--accent` = current/done step + fill; rail goes vertical under ~640px. Build: N steps; Next advances index (mark prior done), Back retreats; rail fill width tracks progress; clicking a completed step jumps back to it. Responsive: vertical rail on narrow.
- [ ] Verify 37: step forward through all, jump back via a done step; console clean.
- [ ] **38 — Page-Turn Book.** Header: `NAV MODEL` spreads flip like a book/magazine; click a page edge or use arrows to turn (3D fold). `REGIONS` `.book` (perspective) · `.page` (front/back) · `.controls`. `BEST FOR` lookbooks, reports, storybooks. `RE-SKIN` `--accent` = page accents/controls; single-page view under ~700px. Build: pages absolutely stacked; turning sets a page's `rotateY` about the spine (`transform-origin:left`, `backface-visibility`); z-index ordering keeps the stack correct; arrows/edge-click turn next/prev. Responsive: under ~700px show one page at a time (slide instead of fold).
- [ ] Verify 38: turn forward several spreads, turn back; console clean.
- [ ] **39 — Story Tap-Through.** Header: `NAV MODEL` Instagram-stories; tap the right/left half to advance/rewind, segmented timed bars auto-fill, hold to pause. `REGIONS` `.story` · `.bars` (segments) · `.slide` · `.tapzones`. `BEST FOR` mobile narratives, product tours, promos. `RE-SKIN` `--accent` = active segment fill; designed mobile-first (full-bleed). Build: slides array; a timer fills the current segment over ~4s then auto-advances; tap-right next / tap-left prev; pointer-down pauses, up resumes; clear the interval on advance (no leaks). Responsive: full-screen on mobile, centered card on desktop.
- [ ] Verify 39: watch auto-advance, tap forward/back, hold to pause; console clean (confirm no timer leaks via repeated taps).
- [ ] **40 — Carousel / Slideshow.** Header: `NAV MODEL` paged hero slides; prev/next arrows, dot indicators, autoplay, keyboard arrows. `REGIONS` `.carousel` (track) · `.slide` · `.dots` · `.arrows`. `BEST FOR` hero banners, featured galleries, testimonials. `RE-SKIN` `--accent` = active dot + arrows; full-width responsive. Build: a translateX track; arrows/dots/ArrowLeft-Right set index; autoplay interval pauses on hover; wraps at ends. Responsive: arrows shrink, dots remain tappable under ~480px.
- [ ] Verify 40: arrows, dots, keyboard, autoplay + hover-pause; console clean.
- [ ] **Integration:** add cards 36–40 to Sequence (motifs: 36 add `.t-wheel`; 37 add `.t-step`; 38 add `.t-book`; 39 add `.t-story`; 40 add `.t-carousel`). Verify; Sequence → 9. Update README catalog Sequence.

### Task 4: Command & conversation batch (41–46)

**Files:** Create `41-conversational-form.html`, `42-notebook-cells.html`, `43-keyboard-inbox.html`, `44-slash-editor.html`, `45-filter-search.html`, `46-voice-assistant.html`. Modify `index.html` (Command), `README.md`.

**Interfaces:** Produces six files; Command → 9.

- [ ] **41 — Conversational Form.** Header: `NAV MODEL` one question on screen at a time; Enter (or a button) advances; a progress bar tracks completion; a recap at the end. `REGIONS` `.flow` · `.q` (question card) · `.progress` · `.recap`. `BEST FOR` surveys, lead capture, onboarding. `RE-SKIN` `--accent` = progress fill + focus ring; full-width. Build: questions array; Enter/Next validates non-empty then transitions to the next (fade/slide); progress = answered/total; final screen lists answers; Back edits. Responsive: comfortable single column.
- [ ] Verify 41: answer through to recap, go back to edit one; console clean.
- [ ] **42 — Notebook / REPL Cells.** Header: `NAV MODEL` Jupyter-style cells; type into a cell, run (⇧⏎ or ▶) to render mock output below; add/clear cells. `REGIONS` `.nb` · `.cell` (`.in`/`.out`) · `.toolbar`. `BEST FOR` data tools, docs-with-runnable-bits, tutorials. `RE-SKIN` `--accent` = run button + active-cell bar; stacks naturally. Build: cells array; running a cell produces a deterministic mock output (e.g. echo, a tiny computed table/number) shown beneath; `+` adds a cell, clear empties output; ⇧⏎ runs + focuses next. Responsive: full-width cells.
- [ ] Verify 42: run a cell, add a cell, ⇧⏎ chains focus; console clean.
- [ ] **43 — Keyboard Inbox.** Header: `NAV MODEL` Superhuman-style list driven by keys: j/k move, Enter opens, e archives, ? toggles a shortcut cheatsheet. `REGIONS` `.list` (`.row`, `.sel`) · `.reader` · `.cheats` overlay. `BEST FOR` power-user mail/tasks, triage tools. `RE-SKIN` `--accent` = selected row + cheats key chips; reader collapses under the list on narrow. Build: rows array; j/k move the selection (scroll into view), Enter opens the reader, e removes/archives the selected row, ? opens/closes the cheatsheet; mouse click also selects. Guard reserved globals. Responsive: under ~720px reader becomes a full overlay.
- [ ] Verify 43: j/k navigate, Enter opens, e archives, ? toggles; console clean.
- [ ] **44 — Slash-Command Editor.** Header: `NAV MODEL` Notion-style document; typing "/" at line start opens a block-type menu; choosing inserts that block inline. `REGIONS` `.doc` (contenteditable blocks) · `.slashmenu` · `.block` variants. `BEST FOR` editors, CMS, note apps. `RE-SKIN` `--accent` = menu highlight + block markers; full-width column. Build: an editable area of blocks; detecting "/" shows a menu anchored at the caret; arrow/Enter or click picks a block type (heading, todo, quote, divider, callout) which replaces the current block; Esc dismisses. Keep it a small contenteditable or input-per-block model. Responsive: single column, menu repositions within viewport.
- [ ] Verify 44: type "/", pick a few block types, Esc dismiss; console clean.
- [ ] **45 — Live Filter Search.** Header: `NAV MODEL` search-as-you-type over a list with facet chips; results filter instantly, count updates, clear resets. `REGIONS` `.searchbar` · `.facets` (chips) · `.results` · `.count`. `BEST FOR` directories, catalogs, docs search. `RE-SKIN` `--accent` = active facet + match highlight; results stack responsively. Build: a dataset array; input filters by substring (optionally highlight match), facet chips toggle category filters (AND with query), live count, empty-state message, clear button. Debounce optional. Responsive: facets wrap, results 1-col on narrow.
- [ ] Verify 45: type to filter, toggle facets, clear, hit empty state; console clean.
- [ ] **46 — Voice Assistant.** Header: `NAV MODEL` a mic button with an animated waveform; "speak" plays a scripted transcription that resolves into an answer card. `REGIONS` `.assistant` · `.mic` · `.wave` · `.transcript` · `.answer`. `BEST FOR` voice UIs, kiosks, accessibility demos. `RE-SKIN` `--accent` = mic active + waveform; centered, mobile-friendly. Build: clicking mic toggles "listening" (animated bars via CSS/rAF), types out a scripted query word-by-word into the transcript, then reveals a mock answer card; clicking again resets. No real mic/Web Speech needed — scripted. Clear timers on stop. Responsive: single column.
- [ ] Verify 46: start listening, watch transcript + answer, reset; console clean (no leaked rAF/timers).
- [ ] **Integration:** add cards 41–46 to Command (motifs: 41 add `.t-form`; 42 add `.t-cells`; 43 reuse `t-three`/add `.t-inbox`; 44 add `.t-slash`; 45 add `.t-filter`; 46 add `.t-voice`). Verify; Command → 9. Update README catalog Command.

### Task 5: Objects & cards batch (47–50)

**Files:** Create `47-kanban.html`, `48-masonry.html`, `49-card-wallet.html`, `50-data-table.html`. Modify `index.html` (Objects), `README.md`.

**Interfaces:** Produces four files; Objects → 9.

- [ ] **47 — Kanban Board.** Header: `NAV MODEL` columns (To-do / Doing / Done) of cards; drag a card across columns; per-column counts update. `REGIONS` `.board` · `.column` (`.col-head` count) · `.card` (draggable). `BEST FOR` task tracking, pipelines, triage. `RE-SKIN` `--accent` = column headers / drag affordance; columns scroll horizontally on narrow. Build: HTML5 DnD — cards `draggable`; columns handle `dragover`(preventDefault) + `drop` to move the card DOM + update both counts; dragging adds a `.dragging` style. Responsive: columns become horizontally scrollable under ~720px.
- [ ] Verify 47: drag a card between all three columns, counts update; console clean.
- [ ] **48 — Masonry Gallery.** Header: `NAV MODEL` a Pinterest staggered-height grid; click a tile to open a lightbox; arrow through; Esc closes. `REGIONS` `.masonry` (columns) · `.tile` · `.lightbox` (`.lb-img`, arrows, close). `BEST FOR` galleries, moodboards, portfolios. `RE-SKIN` `--accent` = lightbox chrome/active; column count drops with width. Build: CSS `columns` layout (or grid with row-span) for staggered tiles using gradient placeholders of varied heights; click opens a lightbox with that item; ←/→ move within set; Esc/backdrop close. Responsive: `columns` 4→2→1 by breakpoint.
- [ ] Verify 48: open a tile, arrow through, Esc; console clean.
- [ ] **49 — Card Wallet.** Header: `NAV MODEL` a fanned stack of passes; tap one to bring it forward, tap again to flip for detail (the fan persists). `REGIONS` `.wallet` · `.pass` (front/back faces) · `.detail`. `BEST FOR` passes/tickets, accounts, loyalty. `RE-SKIN` `--accent` = active pass glow; fan tightens on narrow. Build: passes overlapped with descending `translateY`/scale (a fan); clicking a pass raises it (z + translate) and dims others; clicking the raised pass flips it (`rotateY` 3D, backface) to show details; click away restores the fan. Distinct from `17` (no discard). Responsive: reduce fan offset + scale under ~480px.
- [ ] Verify 49: tap a pass to raise, tap to flip, tap away to restore; console clean.
- [ ] **50 — Data Table.** Header: `NAV MODEL` a sortable spreadsheet; rows are objects; click a header to sort, a row to open a detail drawer. `REGIONS` `.table` (`thead` sortable, `tbody` rows) · `.drawer`. `BEST FOR` admin, dashboards, records. `RE-SKIN` `--accent` = sort indicator + selected row; table scrolls/condenses on narrow. Build: data array; clicking a header sorts asc/desc (toggle, show ▲▼), stable; clicking a row opens a side drawer with that record; sticky header. Responsive: under ~720px hide low-priority columns or horizontal-scroll; drawer becomes full overlay.
- [ ] Verify 50: sort by two columns asc/desc, open a row drawer; console clean.
- [ ] **Integration:** add cards 47–50 to Objects (motifs: 47 add `.t-kanban`; 48 add `.t-masonry`; 49 reuse `t-stack`/add `.t-wallet`; 50 add `.t-table`). Verify; Objects → 9. Update README catalog Objects.

### Task 6: Immersive batch (51–54)

**Files:** Create `51-parallax-hero.html`, `52-diagonal-editorial.html`, `53-starfield.html`, `54-cursor-mask.html`. Modify `index.html` (Immersive), `README.md`.

**Interfaces:** Produces four files; Immersive → 9.

- [ ] **51 — Parallax Mouse Hero.** Header: `NAV MODEL` a layered hero where foreground/mid/back shift at different rates with cursor position (depth); scroll continues the parallax. `REGIONS` `.hero` · `.layer` (`data-depth`) · `.content`. `BEST FOR` landing heroes, product reveals, agencies. `RE-SKIN` `--accent` = headline/CTA; disables pointer-parallax (keeps static) on touch/narrow. Build: on `mousemove`, translate each `.layer` by `pointer * depth` (rAF-throttled, transform-only); scroll adds Y offset to layers. Respect `prefers-reduced-motion`. Responsive/touch: skip mouse parallax, render layered static.
- [ ] Verify 51: move cursor → layers shift at different rates; scroll; console clean.
- [ ] **52 — Diagonal / Skewed Editorial.** Header: `NAV MODEL` skewed section dividers, rotated oversized type, asymmetric off-grid blocks revealed on scroll. `REGIONS` `.section` (`.skew`) · `.headline` (rotated) · `.aside`. `BEST FOR` editorial, fashion, manifestos. `RE-SKIN` `--accent` = section fills / rules; reduces skew + un-rotates type on narrow for legibility. Build: alternating sections with `clip-path` polygon diagonals (or `skewY` on a wrapper with counter-skew content); a scroll reveal (IntersectionObserver adds `.in`); large rotated headline. Responsive: flatten diagonals + straighten type under ~640px.
- [ ] Verify 52: scroll through sections, reveals fire, layout intact; console clean.
- [ ] **53 — Particle Starfield Hero.** Header: `NAV MODEL` an animated `<canvas>` star/particle field behind bold centred type; subtle drift + a gentle cursor pull. `REGIONS` `<canvas>` bg · `.content` overlay. `BEST FOR` tech/launch heroes, splash, space themes. `RE-SKIN` `--accent` = headline + particle tint; honors reduced-motion (static field). Build: a sized-to-viewport canvas, N particles with velocity, `requestAnimationFrame` loop drifting them (wrap edges), light parallax toward the cursor; resize handler re-fits; stop rAF when `prefers-reduced-motion`. Avoid reserved globals (`screen` etc.). Responsive: fewer particles + DPR-aware sizing on small screens.
- [ ] Verify 53: field animates, resize re-fits, type legible; console clean (rAF runs without errors).
- [ ] **54 — Cursor-Mask Reveal.** Header: `NAV MODEL` a shaped mask follows the cursor, revealing a *different* image/layer beneath the top one (a swap, not just dimming). `REGIONS` `.stage` · `.top` layer · `.under` layer · mask. `BEST FOR` before/after, teasers, interactive heroes. `RE-SKIN` `--accent` = under-layer theme; on touch the mask follows tap/drag. `REGIONS` distinct from `30` (which dims). Build: two stacked full-bleed layers; a radial `mask`/`clip-path` circle on the top layer positioned at the cursor reveals the under layer through the hole (rAF-throttled `mousemove`); touch uses pointer events. Responsive: on touch, mask tracks finger; larger default radius on small screens.
- [ ] Verify 54: move cursor → under-layer shows through the mask; console clean.
- [ ] **Integration:** add cards 51–54 to Immersive (motifs: 51 add `.t-parallax`; 52 add `.t-diag`; 53 reuse `t-zaxis`/add `.t-stars`; 54 add `.t-mask`). Verify; Immersive → 9. Update README catalog Immersive.

### Task 7: Final reconciliation

**Files:** Modify `index.html`, `README.md`.

- [ ] In `index.html`, bump the intro/heading count from `30` to `54` (search the intro copy for the layout count).
- [ ] In `README.md`: change `## The catalog (30)` → `## The catalog (54)`; confirm all six category lists include the new numbers in order; remove from **Backlog** the built ideas (dial/wheel picker, folder column-view, tabbed workspace, kanban, isometric/2.5D scene, magazine spread/page-turn, parallax mouse-reactive hero, diagonal/skewed editorial); keep the un-built ones (globe 3D points, ticker/stock-board, and any others not built).
- [ ] **Final verification:** load `index.html`, confirm **every category shows exactly 9 cards** (6×9 = 54), all thumbnails render, no broken links, console clean. Spot-load 3–4 of the new scaffolds to confirm they still serve.
- [ ] Confirm success criteria from the spec are all met.

---

## Self-Review

**Spec coverage:** All 24 scaffolds from the spec catalog appear as Create steps across Tasks 1–6 with their exact headers/interactions; gallery integration and README updates are in each task; count bumps + backlog prune + final verification in Task 7. Contract constraints captured in Global Constraints. ✓

**Placeholder scan:** No "TBD"/"implement later". Each scaffold names concrete regions + interaction mechanics + responsive rule + a specific verification action. Mock data is described per scaffold rather than left vague. ✓

**Type/name consistency:** File numbers↔slugs↔accents match the spec catalog table; motif class names introduced once per card; verification procedure referenced uniformly. ✓

**Note on granularity:** Per the chosen "category batches, verified" workflow, each Task is a category (a natural review checkpoint); within it, every scaffold is independently authored AND browser-verified before its card is added — so a reviewer can still accept/reject individual scaffolds at their verify step.
