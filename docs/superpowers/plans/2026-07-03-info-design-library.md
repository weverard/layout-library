# Info-Design Library + Gallery Restructure + Layouts Follow-ups — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the gallery into a two-tab shell (fixing the currently-broken links), grow layouts 60 → 71, build a new 36-chart info-design collection in `/info-design`, and ship a chooser page that maps "data + insight" to recommended designs.

**Architecture:** Everything stays single-file self-contained HTML (inline `<style>`/`<script>`, no deps, works from `file://`). Root `index.html` gains in-page tabs (`#layouts` / `#info-design`). Info-design scaffolds share one editorial token set and a fixed page anatomy: live hand-coded SVG chart → spec drawer → copy-prompt → badge. The chooser embeds the catalog as a JS array (single source for both the decision tree and the master picker-prompt).

**Tech Stack:** Vanilla HTML/CSS/JS + inline SVG. Verification via Playwright MCP (headless Chromium). Local preview `python3 -m http.server 8800`. Git on `main`, push after each task.

**Spec:** `docs/superpowers/specs/2026-07-03-info-design-library-design.md`

## Global Constraints

Copied from the spec / README contract — every task includes these:

- **One file, fully self-contained.** All CSS in one `<style>`, all JS in one `<script>`. No imports/CDNs/build/fetch. Must run from `file://` and a bare file server.
- **Design tokens in `:root`.** Re-skin starts with `--accent`.
- **Layouts doc header:** `PATTERN / NAV MODEL / BEST FOR / REGIONS / RE-SKIN`.
- **Info-design doc header:** `CHART / DATA SHAPE / INSIGHT / BEST FOR / RE-SKIN`.
- **Responsive** — stack/collapse on small screens; state the breakpoint in the header comment. Charts scale via `viewBox`.
- **Neutral placeholder content**, no brand/domain lock-in. No recreations of the inspiration site's images; no copying its prompt text.
- **Removable `.scaffold` badge**, fixed bottom-right. Layouts: `NN · slug &nbsp;<a href="../index.html">↔ gallery</a>`. Info-design: `iNN · slug &nbsp;<a href="../index.html#info-design">↔ gallery</a>`.
- **Filenames:** layouts `NN-slug.html` in `/layouts`; info-design `iNN-slug.html` in `/info-design`.
- **No reserved globals at top-level script scope:** `top, history, name, length, status, closed, parent, location, origin, self, event, screen`. Rename or wrap in an IIFE.
- **Shape `<span>`/`<button>` need `display:block`** (or inline-block) + button UA reset.
- **Charting libraries are out** — every chart is hand-coded SVG/CSS/JS. Precomputed layout constants in the placeholder data are fine for hard forms (sankey, chord, treemap, network); the scaffold demonstrates the *design*, not a layout algorithm.
- **Commit after every task** (repo: `weverard/layout-library`, branch `main`); `git push` at each task end. Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- **`http.server` caches** — bump `?v=N` after edits.

**Layout accents (61–71):** 61 `#22D3EE` · 62 `#F97316` · 63 `#6366F1` · 64 `#0891B2` · 65 `#475569` · 66 `#B45309` · 67 `#2563EB` · 68 `#7C3AED` · 69 `#E11D48` · 70 `#0D9488` · 71 `#0F172A`

**Info-design accents (i01–i36):** rotate an editorial set — i01 `#B45309` · i02 `#1D4ED8` · i03 `#0F766E` · i04 `#BE123C` · i05 `#6D28D9` · i06 `#0E7490` · i07 `#B45309` · i08 `#166534` · i09 `#9F1239` · i10 `#1E40AF` · i11 `#7C2D12` · i12 `#115E59` · i13 `#A21CAF` · i14 `#B91C1C` · i15 `#1D4ED8` · i16 `#B45309` · i17 `#4D7C0F` · i18 `#0F766E` · i19 `#1E40AF` · i20 `#C2410C` · i21 `#6D28D9` · i22 `#0E7490` · i23 `#BE123C` · i24 `#166534` · i25 `#15803D` · i26 `#B91C1C` · i27 `#334155` · i28 `#0369A1` · i29 `#B45309` · i30 `#7E22CE` · i31 `#BE123C` · i32 `#0F766E` · i33 `#1E3A8A` · i34 `#334155` · i35 `#1D4ED8` · i36 `#B45309`

---

## File Structure

- **Modify:** `index.html` — tab shell, 60 href rewires, new cards for `61`–`71` and `i01`–`i36`, chooser link card, new `.t-*` thumbnail motifs, count copy.
- **Modify:** `layouts/01…60` — one-line badge href fix each (`index.html` → `../index.html`).
- **Create:** `layouts/61-agent-canvas.html` … `layouts/71-title-dividers.html` (11 files).
- **Create:** `info-design/i01-grouped-bars.html` … `info-design/i36-narrative-dashboard.html` (36 files).
- **Create:** `info-design/chooser.html` — decision tree + master picker-prompt + embedded catalog array.
- **Modify:** `README.md` — info-design contract section, catalogs, counts, backlog.

`index.html` and `README.md` are the only shared files; all touches additive except the rewires.

---

## Verification procedure (the test cycle for every file)

Server once per session: `python3 -m http.server 8800` in the project root.

For each file, via Playwright MCP:
- [ ] Navigate to `http://localhost:8800/<folder>/<file>?v=<n>`.
- [ ] Snapshot; confirm the regions/chart render, nothing clipped or overlapping.
- [ ] Exercise the signature interaction; confirm it responds.
- [ ] For info-design files: open the spec drawer; click **Copy prompt** and confirm the "Copied" confirmation state appears (clipboard itself can't be asserted headlessly — the visible confirmation is the check).
- [ ] Console: **zero errors, zero warnings**.
- [ ] Resize to 400px wide; no horizontal overflow; behaviour per the header comment.

## Per-batch gallery integration (end of each authoring task)

- [ ] Add each new card to its `<section>` (layouts tab) or category block (info-design tab), in number order, using the documented card shape with the assigned accent.
- [ ] Thumbnails: reuse a `.t-MOTIF` or add a lightweight one. Info-design thumbs may instead put a tiny inline `<svg viewBox="0 0 60 40">` inside `.thumb` when the chart shape can't reasonably be drawn in CSS (sankey, chord, maps, network) — keep it ≤ ~10 elements, abstract, using `currentColor`/`--accent`.
- [ ] Verify gallery (`/index.html?v=<n>`): new cards render, links resolve, console clean.
- [ ] Update `README.md` catalog for the batch. Defer count bumps to Task 17.
- [ ] Commit + push.

---

### Task 1: Gallery tab shell + link rewire

**Files:** Modify `index.html`; modify `layouts/01…60` (badge line only).

**Interfaces:** Produces tab ids `#layouts` / `#info-design` (hash deep-linking) and the `.tabs` bar — later tasks add cards inside `#info-design`; every scaffold badge targets `../index.html`.

- [ ] **Tab shell.** In `index.html`: wrap the 7 existing `p.cat`+`.grid` sections in `<div class="pane" id="layouts">`; add `<div class="pane" id="info-design" hidden>` after it containing a placeholder intro (`p.cat` "Info design — live chart scaffolds" + an empty `.grid`; populated from Task 6). Insert a tab bar after `header.intro`:
  ```html
  <nav class="tabs">
    <button class="tab on" data-pane="layouts">Layouts</button>
    <button class="tab" data-pane="info-design">Info design</button>
  </nav>
  ```
  Styling: match existing gallery vocabulary (pill buttons, `--line` border, active = ink fill). First `<script>` in the gallery: click sets `.on`, toggles `hidden` on the two `.pane`s, sets `location.hash`; on load, `#info-design` in the hash selects that tab. No reserved globals.
- [ ] **Rewire 60 card hrefs**: every `href="NN-slug.html"` → `href="layouts/NN-slug.html"` (mechanical; 60 occurrences).
- [ ] **Badge sweep**: in all 60 `layouts/*.html`, replace `<a href="index.html">` → `<a href="../index.html">` (one occurrence per file; verify with `grep -c` that 60 files match after).
- [ ] **Update intro copy**: kicker "Reusable scaffolds · 60 layouts · info design coming" (final copy lands in Task 17); h1 stays.
- [ ] **Verify:** load `/index.html` — both tabs switch, hash updates, `#info-design` deep-link works; click 4 spread-out layout cards (01, 23, 55, 60) — each opens and its badge returns to the gallery; console clean on all pages; 400px check on the gallery.
- [ ] **Commit + push:** `fix: two-tab gallery shell; rewire links to layouts/`.

### Task 2: Agentic commerce 61–63

**Files:** Create `layouts/61-agent-canvas.html`, `layouts/62-approval-queue.html`, `layouts/63-comparison-chat.html`. Modify `index.html` (Agentic commerce section), `README.md`.

**Interfaces:** Agentic commerce → 9 cards.

Authoring recipe (every layout in Tasks 2–4): copy the skeleton from `layouts/23-bento.html` (doctype, head, `:root` tokens with assigned `--accent`, base reset, badge markup/CSS with `../index.html`), replace the doc-header fields per brief, build regions + signature interaction, add the responsive rule, then run the Verification procedure.

- [ ] **61 — Chat + Live Product Canvas.** `NAV MODEL` a chat rail drives a persistent product canvas: each scripted agent reply adds/rearranges product tiles on the canvas; clicking a tile focuses it and the chat annotates why it's there. `REGIONS` `.chat` (messages + input) · `.canvas` (product tiles, focus state) · `.linkline` (hover cue tying a message to its tiles). `BEST FOR` agent shopping, curation tools, research-with-artifacts. `RE-SKIN` `--accent` = agent bubbles + focused tile; canvas stacks above chat under ~760px. Build: scripted conversation array; "sending" any input plays the next scripted turn — reply text types in and its `products` land on the canvas with a stagger; hovering a message highlights its tiles (shared `data-turn`); clicking a tile raises it + shows a "why" chip. Guard timers on rapid sends.
- [ ] Verify 61: send twice, watch tiles land, hover-link, focus a tile; console clean.
- [ ] **62 — Human-in-the-Loop Approvals.** `NAV MODEL` an agent proposes purchase actions into a pending queue; the human approves, edits, or rejects each; approved actions play into an activity log; nav *is* the queue. `REGIONS` `.queue` (`.proposal` cards: intent, price, rationale) · `.editor` (inline amend, e.g. qty/budget) · `.log` (approved/rejected trail) · `.agentbar` (status: proposing/waiting/executing). `BEST FOR` agent commerce guardrails, expense approval, moderation. `RE-SKIN` `--accent` = approve button + agent status; queue and log stack under ~720px. Build: proposals array drip-fed by a timer (agent "thinking" between); Approve moves card to log with ✓ + advances a running total; Edit opens inline fields and re-prices; Reject strikes it into the log; when the queue empties the agentbar reports done and offers reset. Clear the drip timer on reset.
- [ ] Verify 62: approve one, edit one, reject one, run to empty, reset; console clean.
- [ ] **63 — Comparison-in-Chat.** `NAV MODEL` chat where each mention adds a column to a growing comparison tray pinned beside/below the thread; toggling a row highlights differences; the tray persists across turns. `REGIONS` `.thread` · `.tray` (comparison table: product columns × attribute rows) · `.diff` toggle · `.pick` (choose-winner CTA per column). `BEST FOR` product comparison, plan/tier chooser, vendor evaluation. `RE-SKIN` `--accent` = added-column flash + diff highlights; tray docks below the thread under ~760px. Build: scripted turns each add a product column (flash on entry, max 4 then columns scroll); "Highlight differences" toggle accents rows where values differ; "Pick" marks a winner and the agent posts a closing summary turn. Table semantics (`<table>` or grid) with sticky attribute column.
- [ ] Verify 63: add three columns via chat, toggle diffs, pick a winner; console clean.
- [ ] **Integration** (per-batch procedure): cards 61–63 in Agentic commerce (motifs: 61 add `.t-agentcanvas` — chat rail + tile cluster; 62 add `.t-queue` — card stack with ✓/✗ chips; 63 reuse `t-tabs`-style columns or add `.t-compare`). README: move the three built ideas out of the backlog into the catalog. Commit + push: `feat: agentic commerce 61-63 (canvas, approvals, comparison)`.

### Task 3: Backlog scaffolds 64–65

**Files:** Create `layouts/64-globe.html` (Spatial), `layouts/65-ticker-board.html` (Objects & cards). Modify `index.html`, `README.md`.

**Interfaces:** Spatial → 10, Objects & cards → 10 (categories may exceed 9; the "9 each" push was a past milestone, not a cap).

- [ ] **64 — Globe (3D points).** `NAV MODEL` a slowly-rotating 3D point globe; locations are dots on the sphere; drag to spin, click a front-facing dot to select it and open its brief; selection pauses rotation. `REGIONS` `.globe` (canvas or SVG points) · `.brief` (selected location card) · `.legendhint`. `BEST FOR` global footprints, network presence, travel. `RE-SKIN` `--accent` = active dot + brief; brief docks bottom-sheet-style under ~640px. Build: ~120 points distributed on a sphere (precomputed lat/lon table), projected each frame with rotation about Y (`x=cosφsinλ` etc.); back-hemisphere points dimmed/smaller; rAF loop auto-rotates, pointer-drag adjusts the rotation angle, click hit-tests nearest front point within a radius; honor `prefers-reduced-motion` (static globe, drag still works). Avoid reserved globals (`screen`).
- [ ] Verify 64: watch rotation, drag-spin, select a dot → brief opens, rotation pauses/resumes; console clean.
- [ ] **65 — Ticker / Stock-Board.** `NAV MODEL` a split-flap-adjacent live board: rows of instruments whose values tick on a timer (deterministic walk), flashing up/down; a marquee ticker runs across the top; clicking a row opens a detail pane with a sparkline. `REGIONS` `.marquee` · `.board` (rows: symbol, value, Δ, trend) · `.detail` (sparkline + stats). `BEST FOR` markets, live ops metrics, leaderboards. `RE-SKIN` `--accent` = positive Δ (pair with a red for negative); detail becomes overlay under ~720px. Build: instruments array with seeded pseudo-random walk on an interval; changed cells flash green/red then settle; marquee is a CSS animation of duplicated content; row click renders an inline-SVG sparkline from that instrument's history buffer. Distinct from `19` (split-flap chrome) — this is data-motion, not flap-motion. Clear interval when detail modal closes if paused.
- [ ] Verify 65: values tick + flash, marquee runs, open a row → sparkline draws; console clean (no timer leaks after several opens).
- [ ] **Integration:** card 64 in Spatial (add `.t-globe` — circle + dots), 65 in Objects & cards (reuse `t-table` vocabulary or add `.t-board` — rows with an up/down chip). README: remove globe + ticker from backlog, add to catalogs. Commit + push: `feat: globe + ticker-board backlog scaffolds (64-65)`.

### Task 4: Slides & frames 66–71 (new layouts category)

**Files:** Create `layouts/66-kpi-slide.html`, `layouts/67-steps-slide.html`, `layouts/68-quadrant-matrix.html`, `layouts/69-versus-slide.html`, `layouts/70-roadmap-slide.html`, `layouts/71-title-dividers.html`. Modify `index.html` (new section), `README.md`.

**Interfaces:** New gallery section `Slides & frames — presentation layouts` (between Immersive and Agentic commerce); 6 cards. These are 16:9-framed *presentation layouts* — each renders as a centered slide stage (`.stage` keeps 16/9 via `aspect-ratio`, scales to viewport) — distinct from info-design *figures*.

- [ ] **66 — KPI Big-Number Slide.** `NAV MODEL` a single-message stat slide; number is the hero, two supporting mini-bars ground it; arrow keys / click cycle 3 example variants (number+bars re-animate). `REGIONS` `.stage` · `.kicker` · `.bignum` · `.support` (two labeled bars) · `.foot` (source). `BEST FOR` exec summaries, QBRs, launch metrics. `RE-SKIN` `--accent` = number + bar fills; stage letterboxes on narrow. Build: variants array; on cycle, the number counts up (rAF, ~600ms, respects reduced-motion) and bars transition width; dot indicator shows variant index.
- [ ] Verify 66: cycle variants, count-up runs, bars animate; console clean.
- [ ] **67 — Numbered-Steps Slide.** `NAV MODEL` a 1-2-3 process frame; clicking a step (or →) advances an accent highlight along the sequence and swaps the detail caption. `REGIONS` `.stage` · `.steps` (numbered cards with connector line) · `.caption`. `BEST FOR` how-it-works, onboarding decks, process pitches. `RE-SKIN` `--accent` = active step + connector fill; steps stack vertically under ~640px. Build: 3–4 steps; active state fills the connector up to that step; ArrowLeft/Right and click both set active.
- [ ] Verify 67: click through steps, arrow keys, captions swap; console clean.
- [ ] **68 — 2×2 Quadrant Matrix.** `NAV MODEL` the consulting classic: labeled axes, four quadrants, plotted items; hovering an item shows its note, clicking a quadrant header dims the others. `REGIONS` `.stage` · `.axes` (x/y labels + arrows) · `.quad` ×4 (corner labels) · `.dot` items. `BEST FOR` positioning, prioritisation (effort/impact), portfolio reviews. `RE-SKIN` `--accent` = focus quadrant + dots; matrix stays square, legend drops below under ~640px. Build: items array with x/y ∈ [0,1] plotted by CSS position; quadrant focus toggles a dim class on the rest; Esc/again clears.
- [ ] Verify 68: hover items, focus each quadrant, clear; console clean.
- [ ] **69 — Versus / Comparison Slide.** `NAV MODEL` a split A-vs-B frame; a center divider handle drags to give one side more room; rows align across the divide for point-by-point contrast. `REGIONS` `.stage` · `.side.a` / `.side.b` (header + matched rows) · `.divider` (drag handle) · `.verdict` (footer line). `BEST FOR` before/after, us-vs-them, build-vs-buy. `RE-SKIN` `--accent` = side A tint (B gets neutral); sides stack under ~640px (divider hidden). Build: pointer-drag on the divider adjusts a `--split` custom property (clamped 30–70%); double-click resets 50/50; rows are a shared grid so lines stay aligned.
- [ ] Verify 69: drag the divider, double-click reset; console clean.
- [ ] **70 — Roadmap / Timeline Slide.** `NAV MODEL` horizontal phased lanes (Now / Next / Later); items sit on lanes; clicking a phase header zooms that phase (others compress); a today-marker rule crosses the lanes. `REGIONS` `.stage` · `.phases` (3 column headers) · `.lane` ×3 (workstream rows with item chips) · `.today` rule. `BEST FOR` product roadmaps, programme plans, investor timelines. `RE-SKIN` `--accent` = current phase + today rule; lanes scroll horizontally under ~700px. Build: phase widths as grid `fr` values; focusing a phase changes the template (e.g. `2fr 1fr 1fr`) with a transition; item chips carry phase-colored left borders.
- [ ] Verify 70: focus each phase, layout re-flows smoothly; console clean.
- [ ] **71 — Title + Section-Divider System.** `NAV MODEL` a mini deck of frame types — cover → section divider → closing — paged with arrows/keys/dots; each frame is a reusable typographic layout, numbered like a real deck. `REGIONS` `.deck` · `.frame` variants (`.cover` kicker/title/meta · `.divider` giant section number/title · `.closing` CTA/contact) · `.pager` (dots + arrows) · `.pageno`. `BEST FOR` deck skeletons, template systems, brand reviews. `RE-SKIN` `--accent` = divider numerals + rules; frames letterbox on narrow. Build: 5 frames (cover, divider 01, divider 02, content-stub, closing); ArrowLeft/Right, dot click, and edge-click page; frames cross-fade (no view-transitions needed).
- [ ] Verify 71: page through all frames by key + dots; console clean.
- [ ] **Integration:** new `p.cat` section "Slides & frames — presentation layouts" + 6 cards (motifs: 66 add `.t-kpi` — big block + two bars; 67 add `.t-steps` — three connected squares; 68 add `.t-quad` — 2×2 with dots; 69 add `.t-vs` — split with handle; 70 add `.t-roadmap` — three lanes; 71 reuse `t-carousel` vocabulary or add `.t-frames`). README: new category in the catalog with a one-line note distinguishing frames (layout) from figures (info-design). Commit + push: `feat: Slides & frames category (66-71)`.

---

## Info-design authoring recipe (applies to every chart in Tasks 5–16)

Every `info-design/iNN-slug.html` uses this exact page anatomy — Task 5 builds the first file as the canonical skeleton; subsequent files copy it.

**Head:** `<title>iNN · Name — Info design scaffold</title>` + the info-design doc header comment (`CHART / DATA SHAPE / INSIGHT / BEST FOR / RE-SKIN`).

**Shared `:root` tokens (identical across all 36 apart from `--accent`):**
```css
:root{
  --accent:#B45309;            /* re-skin: start here (per-file hex from Global Constraints) */
  --bg:#FBFAF8; --panel:#FFFFFF; --ink:#191919; --muted:#6E6A63; --line:#E5E1D8;
  --pos:var(--accent); --neg:#B3261E;   /* diverging pair where needed */
  --serif:Georgia,"Times New Roman",serif;
  --sans:system-ui,-apple-system,"Segoe UI",sans-serif;
  --mono:ui-monospace,"SF Mono",Menlo,monospace;
  --s1:8px; --s2:14px; --s3:24px; --s4:40px;
}
```

**Body structure:**
```html
<main class="fig">
  <header>
    <p class="kicker">CATEGORY · iNN</p>
    <h1>Headline stating the insight, not the axis names</h1>
    <p class="dek">One supporting sentence of context.</p>
  </header>
  <figure><!-- the chart: inline <svg viewBox="…"> (or CSS where natural) --></figure>
  <p class="source">Source: placeholder data, 2026 · illustrative</p>
</main>

<details class="spec">
  <summary>Spec — what it is, when to use it</summary>
  <dl>
    <dt>What it is</dt><dd>…</dd>
    <dt>When to use it</dt><dd>…</dd>
    <dt>Data shape</dt><dd>…</dd>
    <dt>Visual style</dt><dd>…</dd>
  </dl>
  <p class="tags"><span>tag</span>…</p>
  <div class="prompt">
    <div class="prompt-head"><b>Recreate prompt</b><button id="copy">Copy prompt</button></div>
    <pre id="prompt-text">…</pre>
  </div>
</details>

<div class="scaffold">iNN · slug &nbsp;<a href="../index.html#info-design">↔ gallery</a></div>
```

**Editorial conventions:** serif `h1` headline + sans dek; horizontal-only hairline gridlines (`--line`); direct labels over legends wherever possible; one `--accent` hue against the neutral ramp; generous whitespace (`--s4` between blocks); source line always present. Placeholder data lives as one clearly-named `const DATA = …` at the top of the script — the thing a forker replaces.

**Copy-prompt JS (identical in every file; `file://` is not a secure context, so the fallback is required):**
```js
const btn = document.getElementById('copy');
btn.addEventListener('click', () => {
  const txt = document.getElementById('prompt-text').textContent;
  const done = () => { btn.textContent = 'Copied ✓'; setTimeout(() => btn.textContent = 'Copy prompt', 1600); };
  if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(txt).then(done); }
  else {
    const ta = document.createElement('textarea'); ta.value = txt;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); done();
  }
});
```

**Recreate-prompt text (authored per file, our words):** two paragraphs in the `<pre>` — (1) a visual description of *this* design: form, composition, labeling approach, palette roles, annotation style; (2) a standard closing: "Rebuild this design with my data. Hand-code it as self-contained HTML/SVG (or the stack I name). Keep the headline-as-insight title, direct labels, and restrained palette. Ask me for my data series and the one insight to headline."

**Interactions:** hover readouts are the default; anything more only where the brief says so. All transitions respect `prefers-reduced-motion`.

Then: Verification procedure (including the Copy-prompt confirmation check).

---

### Task 5: Info-design foundations — Comparison trio (i01–i03)

**Files:** Create `info-design/i01-grouped-bars.html` (the canonical skeleton), `i02-slope.html`, `i03-dumbbell.html`. Modify `index.html` (info-design pane), `README.md`.

**Interfaces:** Produces the skeleton file every later task copies (tokens, spec drawer, copy-prompt JS, badge — exactly as in the recipe above) and the info-design tab's first category block. Gallery card shape inside `#info-design` is identical to layouts cards (number shown as `i01`).

- [ ] **i01 — Grouped Bars with Annotation.** `DATA SHAPE` 4 categories × 2 series (`{label, a, b}[]`). `INSIGHT` compare. Chart: vertical grouped bars, series direct-labeled at the first group (no legend box); one standout bar carries a thin callout line + short annotation; y-axis as 3 hairline gridlines with top-aligned labels. Hover a bar → value readout chip near the bar. `BEST FOR` two-series category comparisons, plan-vs-actual. `RE-SKIN` `--accent` = series A + annotation (B = neutral gray); bars thin + labels rotate under ~520px.
- [ ] Verify i01 (full procedure incl. copy-prompt check). **This file is the skeleton** — confirm the spec drawer opens/closes and the badge resolves before building i02.
- [ ] **i02 — Slope Chart.** `DATA SHAPE` 6 entities × 2 time points (`{label, then, now}[]`). `INSIGHT` compare / reveal change. Chart: two vertical baselines (2019 · 2024), a line per entity, direct labels + values on both ends; risers vs fallers distinguished (accent vs neutral); the focal entity gets a heavier stroke + annotation. Hover a line/label → that entity emphasised, others fade. `BEST FOR` before/after across many entities, rank shifts. `RE-SKIN` swap the focal entity by data flag; labels stack with leader ticks under ~520px.
- [ ] Verify i02.
- [ ] **i03 — Dumbbell / Dot-Range.** `DATA SHAPE` 8 rows × 2 values (`{label, from, to}[]`), sorted by delta. `INSIGHT` compare. Chart: horizontal rows, two dots joined by a track, delta labeled at the row end; open-vs-filled dot encodes from/to (stated in a one-line key sentence, not a legend box); largest delta annotated. Hover row → row highlight + exact values. `BEST FOR` gap analysis, before/after by group. `RE-SKIN` `--accent` = "to" dot + delta; rows compress, labels truncate with title-attr under ~520px.
- [ ] Verify i03.
- [ ] **Integration:** in `#info-design`, add `p.cat` "Comparison — set side by side" + `.grid` with 3 cards (thumb motifs: i01 add `.t-i-bars` in CSS; i02 add `.t-i-slope` — two posts + crossing lines (or mini-SVG); i03 add `.t-i-dumbbell` — three dot-pair rows). README: start the **Info-design contract** section (page anatomy, tokens, header fields — condensed from this recipe) + a new catalog table with these three. Commit + push: `feat: info-design foundations + Comparison trio (i01-i03)`.

### Task 6: Trend / Time-series (i04–i06)

**Files:** Create `info-design/i04-band-line.html`, `i05-streamgraph.html`, `i06-bump.html`. Modify `index.html`, `README.md`. (Copy the i01 skeleton; per-file accent from Global Constraints. Same for all later chart tasks.)

- [ ] **i04 — Line with Confidence Band + Events.** `DATA SHAPE` 1 series × 36 monthly points + band (`{t, v, lo, hi}[]`) + 2 events (`{t, label}`). `INSIGHT` reveal change. Chart: single line over a soft accent-tinted band; two vertical event rules with small angled labels; endpoint dot + value label; x-axis = year ticks only. Hover → nearest-point crosshair + readout. `BEST FOR` KPIs with uncertainty, forecasts, experiments. `RE-SKIN` `--accent` = line/band; band opacity is the second knob; hover crosshair off on touch.
- [ ] Verify i04.
- [ ] **i05 — Streamgraph.** `DATA SHAPE` 5 series × 12 points, precomputed stacked offsets (`layers[5][12]` of `{y0, y1}`). `INSIGHT` show composition over time. Chart: smooth wiggle-baseline bands (`path` with bezier smoothing), series labels set *inside* their widest run; muted multi-hue ramp derived from the accent (CSS `color-mix` with fallback hexes in comments). Hover a band → it saturates, others fade, readout shows series + share at pointer month. `BEST FOR` evolving share of voice/volume. `RE-SKIN` ramp hues; flattens to a stacked area with straight baseline under ~520px (simpler geometry, same data).
- [ ] Verify i05.
- [ ] **i06 — Bump Chart.** `DATA SHAPE` 6 entities × 6 periods of ranks (`{label, ranks[6]}[]`). `INSIGHT` rank over time. Chart: rounded rank lines on an inverted 1–6 scale, entity labels at both ends, focal entity in accent (heavier), a shaded column marks the period where the lead changes. Hover a line → emphasise + rank chips along it. `BEST FOR` league positions, brand rankings. `RE-SKIN` focal flag in data; under ~520px show first/last columns with connecting arrows only.
- [ ] Verify i06.
- [ ] **Integration:** `p.cat` "Trend / Time-series — the shape of change" + 3 cards (motifs: i04 `.t-i-line`; i05 `.t-i-stream` mini-SVG; i06 `.t-i-bump` — crossing rounded lines, mini-SVG ok). README table rows. Commit + push: `feat: info-design Trend trio (i04-i06)`.

### Task 7: Part-to-whole (i07–i09)

**Files:** Create `info-design/i07-waffle.html`, `i08-treemap.html`, `i09-stacked-leader.html`. Modify `index.html`, `README.md`.

- [ ] **i07 — Waffle Grid.** `DATA SHAPE` 3 segments + remainder summing to 100 (`{label, n}[]`). `INSIGHT` show composition. Chart: 10×10 rounded cells filling left-to-right bottom-up; segments in accent + two derived tints, remainder in `--line`; the key is a *sentence* under the headline ("■ 42 of every 100 … ■ 31 …"). Click a segment in the sentence → its cells pulse once. `BEST FOR` shares of a population, survey splits. `RE-SKIN` cell size/radius; grid stays square, sentence wraps on narrow.
- [ ] Verify i07.
- [ ] **i08 — Treemap.** `DATA SHAPE` 8 leaves in 3 groups with precomputed rects (`{group, label, value, x, y, w, h}[]`, squarified offline). `INSIGHT` show composition (two levels). Chart: SVG rects with 2px white gutters; group hue families (accent + 2 muted companions); labels inside cells that fit (name + %), tiny cells labeled by a footnote list. Hover → cell lifts (stroke) + readout of value/share. `BEST FOR` budgets, portfolio weights, storage. `RE-SKIN` hue families; under ~520px re-renders as a one-level bar list (same data, JS switch on `matchMedia`).
- [ ] Verify i08 (both wide and narrow renderings).
- [ ] **i09 — Stacked Bar with Leader Labels.** `DATA SHAPE` 5 segments of one whole (`{label, value, note}[]`). `INSIGHT` show composition. Chart: one horizontal 100% bar mid-page; thin elbow leader lines alternate up/down to labels (name, %, one-line note); largest segment in accent, others in a neutral ramp. Hover segment ↔ label pair-highlight. `BEST FOR` single-total breakdowns where each part deserves a sentence. `RE-SKIN` `--accent` = hero segment; leaders collapse to a stacked legend-list under ~560px.
- [ ] Verify i09.
- [ ] **Integration:** `p.cat` "Part-to-whole — composition" + 3 cards (motifs: i07 `.t-i-waffle` — CSS grid of dots; i08 `.t-i-treemap` — nested rects; i09 `.t-i-stackbar` — segmented bar + leader ticks). README rows. Commit + push: `feat: info-design Part-to-whole trio (i07-i09)`.

### Task 8: Distribution (i10–i12)

**Files:** Create `info-design/i10-histogram.html`, `i11-ridgeline.html`, `i12-beeswarm.html`. Modify `index.html`, `README.md`.

- [ ] **i10 — Histogram with Summary Stats.** `DATA SHAPE` ~200 values pre-binned into 20 bins (`bins[20]` counts + `{n, mean, median, p90}`). `INSIGHT` distribute. Chart: bars with hairline gaps; dashed rules for mean and median with small flags; the skew annotated ("long tail →"); stat chips row (n · mean · median · p90) above the chart. Hover bin → count readout. `BEST FOR` response times, prices, scores. `RE-SKIN` `--accent` = bars; chips wrap on narrow.
- [ ] Verify i10.
- [ ] **i11 — Ridgeline.** `DATA SHAPE` 5 groups × smooth density points (precomputed `{label, pts[24]}[]`). `INSIGHT` distribute / compare distributions. Chart: overlapping area curves, each row offset upward, 60% overlap; row labels left-aligned on the baseline; focal row in accent, rest translucent ink. Hover row → it lifts to full opacity + median tick shows. `BEST FOR` distributions across groups/time-of-day. `RE-SKIN` overlap amount + focal row; rows separate fully (no overlap) under ~560px.
- [ ] Verify i11.
- [ ] **i12 — Beeswarm / Dot Strip.** `DATA SHAPE` 3 categories × ~40 values (`{cat, v}[]`; deterministic jitter precomputed as `dy`). `INSIGHT` distribute (show every point). Chart: horizontal value axis, one row per category, dots jittered vertically within the row band; median shown as a heavy tick + label; one named outlier annotated with a leader. Hover dot → value chip. `BEST FOR` small-n distributions where individual points matter. `RE-SKIN` dot radius + `--accent` (focal category); rows stack taller with fewer gridlines under ~520px.
- [ ] Verify i12.
- [ ] **Integration:** `p.cat` "Distribution — the shape of the data" + 3 cards (motifs: i10 `.t-i-hist`; i11 `.t-i-ridge` mini-SVG; i12 `.t-i-swarm` — dot rows). README rows. Commit + push: `feat: info-design Distribution trio (i10-i12)`.

### Task 9: Correlation (i13–i15)

**Files:** Create `info-design/i13-scatter-trend.html`, `i14-bubble-quadrant.html`, `i15-connected-scatter.html`. Modify `index.html`, `README.md`.

- [ ] **i13 — Annotated Scatter with Trendline.** `DATA SHAPE` 30 points (`{x, y, label?}[]`) + precomputed regression `{m, b, r2}`. `INSIGHT` relate. Chart: ink dots on hairline grid, accent regression line with its equation/R² set quietly at the line's end; 3 named outliers get dots-in-accent + curved leader annotations. Hover any dot → x/y readout. `BEST FOR` two-metric relationships with exceptions worth naming. `RE-SKIN` `--accent` = trendline + outliers; annotations collapse to a numbered footnote list under ~560px.
- [ ] Verify i13.
- [ ] **i14 — Bubble Quadrant.** `DATA SHAPE` 12 items (`{label, x, y, size}[]`), x/y ∈ [0,1]. `INSIGHT` relate / position. Chart: midline rules split four quadrants with corner labels (e.g. "Quick wins"); bubbles area-scaled, labeled directly when room allows; focal quadrant tinted. Hover bubble → name + all three values. `BEST FOR` effort/impact, risk/return, growth/share. `RE-SKIN` corner labels + `--accent`; bubble labels hide (hover-only) under ~560px.
- [ ] Verify i14.
- [ ] **i15 — Connected Scatter.** `DATA SHAPE` one entity × 12 yearly points (`{year, x, y}[]`). `INSIGHT` relate over time. Chart: the path drawn point-to-point with small arrowheads mid-segment showing direction; first/last points emphasised + year-labeled, inflection years labeled; a ghost duplicate of the path in `--line` beneath for contrast. Hover point → year + values. `BEST FOR` two metrics evolving together (price vs volume, inflation vs unemployment). `RE-SKIN` `--accent` = path; arrowheads drop and every 3rd year labels under ~560px.
- [ ] Verify i15.
- [ ] **Integration:** `p.cat` "Correlation — how two things move" + 3 cards (motifs: i13 `.t-i-scatter`; i14 `.t-i-quadbub`; i15 `.t-i-connscatter` mini-SVG path + arrow). README rows. Commit + push: `feat: info-design Correlation trio (i13-i15)`.

### Task 10: Ranking (i16–i18)

**Files:** Create `info-design/i16-ordered-bars.html`, `i17-lollipop.html`, `i18-league-table.html`. Modify `index.html`, `README.md`.

- [ ] **i16 — Ordered Bars with Highlight.** `DATA SHAPE` 10 items (`{label, v, focal?}[]`) sorted desc. `INSIGHT` rank. Chart: horizontal bars, value labels at bar ends (not an axis), focal bar in accent with a one-line annotation; others neutral; rank numerals in the gutter. Hover → row highlight. `BEST FOR` "where do we stand" rankings. `RE-SKIN` focal flag; labels truncate + values stay under ~520px.
- [ ] Verify i16.
- [ ] **i17 — Lollipop with Benchmark.** `DATA SHAPE` 12 items (`{label, v}[]`) + benchmark value. `INSIGHT` rank vs a reference. Chart: thin stems + dots, sorted; a labeled vertical benchmark rule; dots beyond the benchmark in accent, short of it in ink; count summary in the dek ("7 of 12 clear the bar"). Hover dot → value. `BEST FOR` targets, SLAs, peer medians. `RE-SKIN` benchmark value in `DATA`; stems thin under ~520px.
- [ ] Verify i17.
- [ ] **i18 — League Table with Deltas.** `DATA SHAPE` 8 rows (`{name, v, prev}[]`). `INSIGHT` rank + change. Chart: a real `<table>`: rank · name · inline value bar (div-in-cell, width-scaled) · Δ chip (▲/▼, accent/`--neg`, computed from prev). Click the value or Δ header → re-sort asc/desc (▲▼ indicator, stable). `BEST FOR` leaderboards, portfolio tables, team metrics. `RE-SKIN` `--accent` = bars + positive Δ; low-priority column hides under ~520px.
- [ ] Verify i18: sort by both sortable columns, both directions.
- [ ] **Integration:** `p.cat` "Ranking — order matters" + 3 cards (motifs: i16 `.t-i-rankbars`; i17 `.t-i-lolli`; i18 reuse `t-table`). README rows. Commit + push: `feat: info-design Ranking trio (i16-i18)`.

### Task 11: Flow / Process (i19–i21)

**Files:** Create `info-design/i19-sankey.html`, `i20-funnel.html`, `i21-chord.html`. Modify `index.html`, `README.md`.

- [ ] **i19 — Sankey.** `DATA SHAPE` 3 sources → 4 targets with flow values; node y-extents and ribbon control points precomputed in `DATA` (`nodes[]` with `{label, x, y0, y1}`, `links[]` with `{s, t, v, sy0, sy1, ty0, ty1}`). `INSIGHT` show flow. Chart: node bars + cubic-bezier ribbons (opacity ~0.45), ribbon width ∝ value; node labels outside, flow values on hover; the dominant path in accent, rest neutral. Hover ribbon → isolate it (others fade) + value chip. `BEST FOR` traffic sources → outcomes, budget flows, energy. `RE-SKIN` `--accent` = hero flow; rotates to vertical (top→bottom) under ~560px by swapping the coordinate mapping.
- [ ] Verify i19 (both orientations).
- [ ] **i20 — Funnel.** `DATA SHAPE` 5 stages (`{label, n}[]`). `INSIGHT` show flow / loss. Chart: centered trapezoid bands, width ∝ count; stage label + count inside each band; conversion % set *between* bands in the gutters; the steepest drop annotated with a side note. Hover band → stage detail chip. `BEST FOR` signup/checkout funnels, pipeline stages. `RE-SKIN` `--accent` = top band, derived tints descend; bands become full-width bars with left-edge % under ~520px.
- [ ] Verify i20.
- [ ] **i21 — Chord Diagram.** `DATA SHAPE` 5 entities, symmetric flow matrix; arc spans and ribbon endpoints precomputed (`arcs[]` `{label, a0, a1}` in radians, `ribbons[]` `{s, t, sa0, sa1, ta0, ta1, v}`). `INSIGHT` show flow between peers. Chart: outer arc segments (accent + 4 muted companions), inner bezier ribbons at low opacity, labels around the circle rotated tangentially. Hover an arc → only its ribbons stay, value chips appear. `BEST FOR` migrations, trade, who-talks-to-whom. `RE-SKIN` hue set; under ~560px falls back to a matrix heat-grid of the same values (JS switch).
- [ ] Verify i21 (both renderings).
- [ ] **Integration:** `p.cat` "Flow & process — where things go" + 3 cards (motifs: mini-SVGs — i19 `.t-i-sankey`, i20 `.t-i-funnel` (CSS trapezoids fine), i21 `.t-i-chord`). README rows. Commit + push: `feat: info-design Flow trio (i19-i21)`.

### Task 12: Hierarchy / Network (i22–i24)

**Files:** Create `info-design/i22-radial-tree.html`, `i23-network.html`, `i24-icicle.html`. Modify `index.html`, `README.md`.

- [ ] **i22 — Radial Tree.** `DATA SHAPE` root + 2 levels (6 branches × 2–4 leaves), polar coordinates precomputed (`{label, depth, angle, r, parent}[]`). `INSIGHT` show hierarchy. Chart: root disc center, curved SVG links outward, node dots + labels angled along their radius; one branch (accent) tells the story, per the headline. Click a branch node → collapse/expand its leaves (links animate). `BEST FOR` org/topic structures with a focal branch. `RE-SKIN` `--accent` = focal branch; becomes an indented outline under ~560px.
- [ ] Verify i22: collapse + expand a branch, narrow fallback.
- [ ] **i23 — Network Graph.** `DATA SHAPE` 14 nodes, 18 links, positions precomputed (`nodes[]` `{id, label, x, y, w}` weight, `links[]` `{a, b}`). `INSIGHT` relate (structure). Chart: ink links (opacity 0.3), node discs sized by weight, labels on the 6 heaviest; two clusters visually separable, the bridge node in accent + annotated ("the broker"). Hover node → it + neighbors highlight, rest fade. `BEST FOR` collaboration, dependencies, influence maps. `RE-SKIN` `--accent` = bridge/focal node; labels reduce to top-3 under ~560px.
- [ ] Verify i23.
- [ ] **i24 — Icicle / Partition.** `DATA SHAPE` 3-depth hierarchy with precomputed spans (`{label, depth, x0, x1, parent}[]`, root spans 0–1). `INSIGHT` show hierarchy + size. Chart: full-width root bar, children rows beneath, width ∝ share; labels in cells that fit; depth encoded by tint steps of the accent. Click a cell → zoom (its span rescales to full width, ancestors shown as a breadcrumb bar); click the breadcrumb root to reset. `BEST FOR` file sizes, budget trees, taxonomy weights. `RE-SKIN` tint ramp; rows get taller + labels hover-only under ~520px.
- [ ] Verify i24: zoom into two levels, reset via breadcrumb.
- [ ] **Integration:** `p.cat` "Hierarchy & network — structure" + 3 cards (motifs: mini-SVGs — i22 `.t-i-radialtree`, i23 `.t-i-net`; i24 `.t-i-icicle` CSS rows). README rows. Commit + push: `feat: info-design Hierarchy trio (i22-i24)`.

### Task 13: Table / Heatmap (i25–i27)

**Files:** Create `info-design/i25-calendar-heatmap.html`, `i26-matrix-heatmap.html`, `i27-sparkline-table.html`. Modify `index.html`, `README.md`.

- [ ] **i25 — Calendar Heatmap.** `DATA SHAPE` 52 weeks × 7 days of counts (deterministic generated table in `DATA`). `INSIGHT` reveal change (rhythm). Chart: GitHub-style year grid, 5-step sequential ramp from `--line` to `--accent`; month labels above, weekday initials left; a quiet annotation circles the hottest streak. Hover cell → date + value chip. Legend = the 5 swatches labeled less→more. `BEST FOR` activity rhythms, habit/commit data. `RE-SKIN` ramp endpoint = accent; grid scrolls horizontally under ~640px (no squashing).
- [ ] Verify i25.
- [ ] **i26 — Matrix Heatmap with Marginals.** `DATA SHAPE` 8 rows × 6 cols matrix + row/col totals. `INSIGHT` relate (two categoricals). Chart: cell grid with sequential fill + in-cell values on the extremes; marginal bars right (row totals) and bottom (col totals) in ink; row/col labels. Hover cell → crosshair: its row + column highlight, others fade, readout shows cell/row/col values. `BEST FOR` confusion matrices, region×product, time×channel. `RE-SKIN` ramp; marginals hide under ~560px, matrix keeps in-cell values.
- [ ] Verify i26.
- [ ] **i27 — Sparkline Table.** `DATA SHAPE` 6 rows (`{name, series[12], current, prev}[]`). `INSIGHT` compare trends compactly. Chart: `<table>`: name · inline SVG sparkline (60×18, endpoint dot) · current value · Δ chip; focal row accent-tinted; column headers sort on click (current, Δ; ▲▼ indicator). `BEST FOR` metric overviews, watchlists. `RE-SKIN` `--accent` = sparkline + positive Δ; sparkline column persists on narrow (it *is* the point), prev-value column hides.
- [ ] Verify i27: sort both sortable columns.
- [ ] **Integration:** `p.cat` "Table & heatmap — dense and exact" + 3 cards (motifs: i25 `.t-i-cal` CSS dot-grid; i26 `.t-i-matrix`; i27 reuse `t-table` + spark). README rows. Commit + push: `feat: info-design Table/Heatmap trio (i25-i27)`.

### Task 14: Geospatial / Map (i28–i30)

**Files:** Create `info-design/i28-tile-cartogram.html`, `i29-symbol-map.html`, `i30-flow-map.html`. Modify `index.html`, `README.md`.

Base geography for all three: a **neutral, fictional archipelago/region system** (per the no-brand/no-domain rule real countries aren't required; a designed abstract landmass reads cleaner and dodges projection pedantry). i28 uses a tile abstraction of 24 named regions ("N1…S8" style short codes + invented names in `DATA`); i29/i30 share one simplified coastline `path` (hand-drawn, ~2 subpaths, stored as a `d` string constant) with named point locations.

- [ ] **i28 — Tile-Grid Cartogram.** `DATA SHAPE` 24 regions (`{code, label, col, row, v}[]`) arranged in a geography-suggestive tile grid. `INSIGHT` locate / compare regions equally. Chart: equal-size rounded tiles at grid positions, sequential fill by value, region code centered in each; the max/min regions annotated with leaders; the "every place equal weight" idea stated in the dek. Hover tile → name + value chip. `BEST FOR` per-region rates where area shouldn't dominate (elections, penetration). `RE-SKIN` ramp; tiles shrink but grid shape persists on narrow.
- [ ] Verify i28.
- [ ] **i29 — Proportional Symbol Map.** `DATA SHAPE` 10 locations (`{label, x, y, v}[]`) on the shared coastline path. `INSIGHT` locate + size. Chart: coastline in `--line` fill, accent circles area-scaled at locations (opacity 0.7, thin white stroke), the two largest labeled directly, others on hover; a circle-size key (3 nested circles labeled) bottom-left. `BEST FOR` quantities at places (sales by city, outbreaks). `RE-SKIN` `--accent` = symbols; map letterboxes, key drops below under ~560px.
- [ ] Verify i29.
- [ ] **i30 — Flow Map.** `DATA SHAPE` 1 origin + 6 destinations (`{from:{x,y}, to:{x,y,label}, v}[]`) on the same coastline. `INSIGHT` show flow across space. Chart: curved quadratic arcs origin→destinations, stroke width ∝ volume, small arrowheads at the destination end; a slow dash-offset drift animates direction (`prefers-reduced-motion` → static); the heaviest arc in accent + labeled with its share. Hover arc → isolate + value. `BEST FOR` shipments, migration, network traffic. `RE-SKIN` `--accent` = hero arc; arcs thin + labels to a side list under ~560px.
- [ ] Verify i30 (including reduced-motion static check via emulation if available; otherwise confirm the guard in code).
- [ ] **Integration:** `p.cat` "Geospatial — where" + 3 cards (motifs: mini-SVGs — i28 `.t-i-tiles` CSS grid ok, i29 `.t-i-symbols`, i30 `.t-i-arcs`). README rows. Commit + push: `feat: info-design Geospatial trio (i28-i30)`.

### Task 15: Pictorial / Infographic (i31–i33)

**Files:** Create `info-design/i31-icon-array.html`, `i32-area-shapes.html`, `i33-big-number.html`. Modify `index.html`, `README.md`.

- [ ] **i31 — Icon-Array Pictograph.** `DATA SHAPE` `{k, n}` (e.g. 27 of 100) + a comparison pair (`{label, k}[]` ×2). `INSIGHT` humanise a rate. Chart: a person glyph defined once as `<symbol>`, `<use>`-stamped 10×10; k in accent, rest `--line`; headline states the rate in words; below, the two-group comparison as two 1×10 rows for contrast. Hover the array → a chip restates "k in 100". `BEST FOR` risk communication, survey shares, "1 in N" stats. `RE-SKIN` swap the glyph path (person → house/car); arrays stack under ~520px.
- [ ] Verify i31.
- [ ] **i32 — Proportional-Area Shapes.** `DATA SHAPE` 4 items (`{label, v}[]`). `INSIGHT` compare magnitudes viscerally. Chart: 4 circles **area**-scaled (radius ∝ √v — say so in the spec drawer), baseline-aligned, value + label under each, the largest in accent; a small caption notes areas not radii are proportional (honesty footnote). Hover circle → exact value. `BEST FOR` magnitude gaps too big for bars ("A is 40× B"). `RE-SKIN` circle → square variant flag in `DATA`; circles wrap 2×2 under ~520px.
- [ ] Verify i32.
- [ ] **i33 — Annotated Big-Number Story.** `DATA SHAPE` one hero stat + 3 support facts + a 12-point context sparkline. `INSIGHT` tell a story with one number. Chart: the stat set huge in serif (accent), unit/qualifier small beside it; three annotation arrows/rules connect margin notes to parts of the number's context (the sparkline, a comparison chip, a date); the layout *is* the design — a figure, not a slide (contrast with layout `66`). `BEST FOR` report leads, posters, exec one-pagers. `RE-SKIN` `--accent` = the number; annotations stack below under ~560px.
- [ ] Verify i33.
- [ ] **Integration:** `p.cat` "Pictorial — data made human" + 3 cards (motifs: i31 `.t-i-icons` CSS dot-people grid; i32 `.t-i-circles`; i33 `.t-i-bignum`). README rows. Commit + push: `feat: info-design Pictorial trio (i31-i33)`.

### Task 16: Dashboard / Multi-chart (i34–i36)

**Files:** Create `info-design/i34-kpi-dashboard.html`, `i35-small-multiples.html`, `i36-narrative-dashboard.html`. Modify `index.html`, `README.md`.

- [ ] **i34 — KPI Dashboard.** `DATA SHAPE` 4 KPIs (`{label, v, prev, series[12]}[]`) + 1 main series + 1 category breakdown. `INSIGHT` monitor. Chart: a 12-col grid — 4 stat tiles (value, Δ chip, 40×14 sparkline) across the top; a main band-line chart (i04's visual language, simplified) left-two-thirds; an ordered bar list right-third; every element on the shared tokens, one accent. Hover states per element. `BEST FOR` weekly ops reviews, product health. `RE-SKIN` `--accent`; tiles 2×2 then charts stack under ~760px.
- [ ] Verify i34.
- [ ] **i35 — Small Multiples.** `DATA SHAPE` 12 series × 12 points (`{label, pts[12], focal?}[]`), shared y-scale. `INSIGHT` compare many trends honestly. Chart: 4×3 grid of mini line panels, identical scales (stated in a caption: "same scale everywhere"); panel label top-left, end-value right; the focal panel accent-stroked, others ink; a faint gray reference line of the all-series median in each panel. Hover panel → it enlarges slightly + endpoint readout. `BEST FOR` regions/products over time without spaghetti. `RE-SKIN` grid dims; 2×6 under ~700px, 1-col under ~460px.
- [ ] Verify i35.
- [ ] **i36 — Narrative Dashboard.** `DATA SHAPE` one main chart series + 4 numbered annotations (`{n, title, text, target}` where target names a chart region x-range). `INSIGHT` monitor + explain. Chart: left = a large annotated line/area chart with numbered ①–④ markers at key moments; right = a reading rail of the four numbered notes. Hovering/focusing a note highlights its span on the chart (tinted band) and vice versa. The dashboard that *reads like a memo*. `BEST FOR` post-mortems, monthly narratives, board packs. `RE-SKIN` `--accent` = markers + bands; rail moves below the chart under ~760px.
- [ ] Verify i36: hover notes ↔ chart bands both directions.
- [ ] **Integration:** `p.cat` "Dashboard & multi-chart — the whole picture" + 3 cards (motifs: i34 reuse `t-bento` vocabulary or `.t-i-kpi`; i35 `.t-i-multiples` — mini grid of lines; i36 `.t-i-narrative` — chart + rail). README rows. Commit + push: `feat: info-design Dashboard trio (i34-i36)`.

### Task 17: Chooser page + final reconciliation

**Files:** Create `info-design/chooser.html`. Modify `index.html`, `README.md`.

**Interfaces:** Consumes the full 36-file catalog (ids, titles, hrefs from Tasks 5–16). Produces `CATALOG` — the single embedded array both chooser halves render from:
```js
const CATALOG = [
  { id:'i01', title:'Grouped Bars with Annotation', cat:'Comparison',
    href:'i01-grouped-bars.html',
    shape:'4 categories × 2 series',
    verbs:['compare'],                       // from the fixed verb list below
    when:'two-series category comparisons; plan vs actual' },
  // … all 36, one entry each, fields filled from the built files' headers
];
```
Fixed verb list (order matters, it drives the UI): `compare · reveal change · show composition · relate · distribute · rank · show flow · locate · tell a story with one number`.

- [ ] **Chooser page shell.** Same editorial tokens as the charts; doc header comment (`CHART  Chooser (meta)` etc.); badge `chooser &nbsp;<a href="../index.html#info-design">↔ gallery</a>`.
- [ ] **Step 1 UI — insight verb:** 9 large option cards (verb + one-line definition + a tiny abstract glyph). Clicking selects and reveals Step 2.
- [ ] **Step 2 UI — refinements:** 1–2 follow-ups driven by a small per-verb config, e.g. `compare` → "how many things?" (2–10 / many) + "is time involved?" (yes/no); `reveal change` → "one series or several?"; `show composition` → "at one moment or over time?"; `relate` → "pairs or a whole system?"; `distribute` → "one group or several?"; `rank` → "against a benchmark?"; `show flow` → "between stages or between peers or across space?"; `locate` → "equal-weight regions or sized quantities or movement?"; `tell a story with one number` → skip (no refinement). Each config maps answer combinations to an ordered list of catalog ids.
- [ ] **Recommendations:** render the mapped ids (2–3) as cards — title, category, `shape`, a one-line *why this one* (from the mapping, not the catalog), linking to the scaffold. A "start over" reset. Every one of the 36 ids must be reachable through at least one path (write the mapping first, then assert coverage in a quick dev check: `CATALOG.every(c => MAPPINGS_FLAT.includes(c.id))` logged once — remove the log before finishing).
- [ ] **Master picker-prompt:** a section below: intro line, a `<pre id="prompt-text">` whose content is *generated by JS* from `CATALOG` — a fixed preamble ("You are choosing an information design. Here is a catalog… I will give you my data and the insight I want. Recommend the best 1–3 designs, favouring the most creative fit that stays honest, and say why. Then ask for my data and build the chosen design as self-contained HTML/SVG.") followed by one line per chart (`i01 · Grouped Bars with Annotation · compare · 4 categories × 2 series · two-series category comparisons`), plus the same copy-button JS as the scaffolds.
- [ ] Verify chooser: walk 3 different verb paths to recommendations, links resolve, reset works, copy button confirms, console clean, 400px pass.
- [ ] **Gallery:** add a full-width chooser link card at the top of `#info-design` ("Not sure which chart? → Answer two questions" styling distinct from scaffold cards) + a regular-size card linking it too if it fits the grid rhythm better — pick one, don't do both.
- [ ] **Final reconciliation:** `index.html` intro → kicker "Reusable scaffolds · 71 layouts · 36 info designs", h1 stays or becomes "Seventy-one ways to navigate. Thirty-six ways to show data." (pick at build time, keep it in this voice); README: `## The catalog (71)` for layouts + new `## Info-design catalog (36)` tables complete; backlog updated — remove all built items, add the info-design backlog seeds (Marimekko · radial calendar · horizon chart · arc timeline · voronoi treemap · isotype comparison) and remaining agentic ideas (cart drawer · voice commerce); status note at top updated to 2026-07-03 (both tabs, chooser, git).
- [ ] **Full link sweep:** load `/index.html` — count 71 cards in #layouts (7 sections) + 37 cards in #info-design (12 sections + chooser), every href resolves (spot-check ≥1 per section), every badge returns; console clean everywhere checked.
- [ ] Commit + push: `feat: chooser page + catalog reconciliation`.

---

## Self-Review

**Spec coverage:** Part 1 (tab shell, 60 rewires, badge sweep, thumbnails, chooser link, counts) → Tasks 1 + 17. Part 2 (61–63 agentic, 64–65 backlog, 66–71 slides) → Tasks 2–4. Part 3 (36 charts, anatomy, tokens, copy-prompt with `file://` fallback, header fields) → recipe + Tasks 5–16, exact category/chart table matched. Part 4 (chooser both halves, catalog defined once) → Task 17. Part 5 (README contract, checklists, backlog) → per-task README steps + Task 17. Git init handled before planning (repo live). ✓

**Placeholder scan:** No TBDs. Every chart brief names its data shape (with field names), visual composition, interaction, responsive behaviour, and a concrete verify action. Skeleton code (tokens, body anatomy, copy-prompt JS, CATALOG shape) given in full. ✓

**Name consistency:** File slugs match between Create lists, briefs, and CATALOG example; badge targets `../index.html#info-design` used consistently; verb list identical in recipe and Task 17; accents assigned once in Global Constraints. Layout `66` vs chart `i33` overlap (big number) explicitly disambiguated (frame vs figure). ✓
