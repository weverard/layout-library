# Cross-cutting facet filters on the master index — design spec

Date: 2026-07-22
Branch: `feat/consistency-cleanup` (Phase 2), base for this work: `a10ac91`
Status: approved in brainstorming, awaiting spec read-through

## Goal

Let a reader of `index.html` cut **across** the 20-category rail — "show me
everything mobile", "everything playful" — instead of only drilling down one
category at a time.

The rail partitions the library; it cannot answer a question whose answer is
scattered across six headings. Filters answer exactly that question, and
nothing else. This is a discovery aid, not a search engine.

## The finding that shaped the design

The existing `tags` field cannot support this, and the measurement is the
reason the design looks the way it does:

- 160 distinct tags across 107 items, exactly 2 per item.
- **129 of the 160 (81%) appear exactly once.** A filter returning one card is
  a link with extra steps.
- Only **17 tags span ≥2 categories**, and those 17 reach just **44 of 107
  items** — 63 items, including 25 of the 36 charts, would be unreachable.
- The vocabulary also carries synonym splits a filter would expose as bugs:
  `compare` / `comparison` / `compare-groups`, `geospatial` / `geography` /
  `maps` / `world map`, `kpi` / `big number`, `flow` / `flow map`.

Conclusion: `tags` were authored as **per-card flavour text**, not as a
controlled vocabulary. They are good card copy and stay in `catalog.json`
and the README. They are not a filter axis.

One reassurance from the same audit: the *recurring* tags are disciplined.
Every item whose title or one-liner reads mobile-ish is in fact tagged
`mobile` — the tagging is not sloppy, it is simply the wrong shape for this
job.

## Decisions (locked during brainstorming — do not re-litigate)

1. **A new `facets` field**, separate from `tags`. Tags keep their meaning;
   facets are the filter axis.
2. **A facet must span ≥2 categories.** A facet that maps onto a single
   category is redundant with the rail. This is why `cinematic` is absent (it
   is the Immersive section) and `part-to-whole` is absent (it is a chart
   category).
3. **The vocabulary is a closed set of 16**, enforced by the checker. Without
   enforcement this drifts back toward 160.
4. **Every item carries ≥1 facet.** No card is unreachable by the filter.
5. **Multi-select is OR (union), not AND.** With ~2 facets per item, AND is
   empty almost every time.
6. **Filtering preserves section structure.** Cards stay under their category
   heading; zero-match sections hide; the rail mutes rather than removes.
7. **Card chips become the facets, and become clickable.** Flavour tags leave
   the card face (they remain in `catalog.json` and the README). The card
   keeps exactly 2 chips, so approved visual weight is unchanged.
8. **Chips, not a dropdown.** At 16 values a dropdown hides the vocabulary
   behind a click and defeats browse-by-scanning. (A dropdown would have been
   right at 160 — which is why 160 was the wrong number.)

## 1. Vocabulary (16 facets, closed set)

| facet | means | cuts across |
|---|---|---|
| `mobile` | phone-shaped: sheets, tab bars, tap, swipe | Foundations · Sequence · Objects · Agentic |
| `conversational` | chat, voice or agent *is* the interface | Command · Agentic |
| `keyboard-driven` | driven by typing or keys, not pointing | Command · Spatial · Sequence |
| `playful` | toy-like, game-like, characterful | Spatial · Command · Objects |
| `animated` | motion carries meaning, not decoration | Immersive · Objects · Geospatial |
| `narrative` | meant to be read start-to-finish | Sequence · Slides · Pictorial · Dashboard |
| `dashboard` | many metrics at a glance | Foundations · Objects · Dashboard |
| `before/after` | explicit A-vs-B or then-vs-now | Immersive · Slides · Comparison · Agentic |
| `ranking` | order or leaderboard is the point | Objects · Ranking · Trend |
| `geospatial` | place, maps, coordinates | Spatial · Foundations · Geospatial |
| `hierarchy` | nested, tree, parent-child | Spatial · Hierarchy |
| `time` | a time axis is central | Sequence · Trend · Correlation · Table |
| `dense` | high information density | Foundations · Objects · Table |
| `editorial` | typographic, publication-like | Immersive · Foundations · Pictorial |
| `gallery` | browsing a visual collection | Objects · Sequence · Immersive |
| `commerce` | buying, checkout, loyalty | Agentic · Sequence · Objects |

Canonical home: `tools/canon/facets.json` — `{key, label, blurb}` per facet,
in display order. Parsed by both the checker and the generator, matching how
`tools/canon/tokens.css` and `helpers.js` already work.

*Amended 2026-07-22 (post-build, Warren decided): the vocabulary is **15, not
16** — `dense` was dropped. The final whole-feature review measured it at 42/107
items across **15 of 20 categories** (this table claimed 3) and 27 of the 36
charts. It was the largest count in the bar while barely narrowing anything,
which teaches a reader that the filter does not discriminate and costs trust in
the other chips. Cause: every item was given exactly 2 facets, and `dense` is
where the second slot went when nothing else was true — it landed as exactly 3
items in each of 7 chart categories, a filler pattern rather than a property.
A split was rejected: the honest fault line inside `dense` is charts-vs-layouts,
which the rail's two groups already draw. After the drop, 42 items carry one
facet (legal — the constraint is ≥1), no item is facet-less, and every remaining
facet still spans ≥2 categories.*

### Known weak spots (disclosed, accepted)

- ~~**`commerce` is the weakest of the 16**~~ — **this was wrong, corrected
  2026-07-22.** Measured, `commerce` is 6 items across 3 categories, in line with
  `geospatial` (6/3) and `before/after` (6/4). It earns its place. The claim of
  ~70% collinearity was asserted, not measured. The genuinely weak chip was
  `dense`, which this spec never questioned — a reminder that the item nobody
  challenges is the one to measure.
- **A handful of charts get their weakest facet rather than a natural one.**
  `i32 Proportional-Area Shapes` → `editorial`, `i08 Treemap` → `hierarchy`.
  These are judgment calls, not derivations. The ≥1 constraint is what forces
  them; that is the accepted price of no card being unreachable.

## 2. Data (`catalog.json`)

Each item gains `facets: string[]`, length ≥1, values from the closed set.
Target is exactly 2 per item to match the existing chip weight, but 1 or 3 is
legal — the constraint is ≥1 and in-vocabulary, not exactly-2.

`tags` is unchanged and stays the README/flavour axis.

Classification of all 107 items is implementation work, done in the plan, item
by item against the vocabulary blurbs.

## 3. Generator (`tools/build.mjs`)

Two new generated regions, both driven from `catalog.json` + `facets.json`:

- `gen:facet-bar` in `index.html` — the chip bar, each chip carrying its label
  and a static count of items holding that facet, plus the leading "All" chip.
- Existing `gen:index-cards:<key>` regions change: each `.asset-card` gains
  `data-facets="mobile keyboard-driven"`, and its chip row renders **facets**
  instead of tags, as buttons rather than spans.

Counts are static (items carrying that facet), not live-updating under
selection. Under OR, live counts shift confusingly as chips toggle; static
counts stay true to "how many of these exist".

Idempotence is unchanged and still required: a second `build.mjs` run must
produce a byte-identical tree.

## 4. Checker (`tools/check.mjs`)

New rule **R12**, over `catalog.json`:

- every item has `facets` with length ≥1;
- every value appears in `tools/canon/facets.json`;
- every facet in the vocabulary is carried by ≥1 item (no dead chips);
- every facet spans ≥2 distinct categories (the rule that justifies the facet
  existing at all).

The last two are what keep the vocabulary from silently rotting as items are
added.

## 5. Behaviour (`index.html`, vanilla JS, no deps)

- **OR across selected chips.** No selection = everything shown.
- **Section preservation.** Matching cards stay under their heading and intro;
  a section with zero matches is hidden entirely; the rail entry for a hidden
  section goes muted (never removed — removal makes the rail jump).
- **"All" chip** resets, active by default.
- **Card chips are clickable** — clicking `mobile` on a card filters by it.
- **URL state as `?f=mobile,playful`.** Query string, not hash, so the
  existing `#cat-<key>` anchors keep working. Restored on load. Works from
  `file://`.
- **No empty state reachable by construction** — every chip has ≥1 member and
  selection is OR. A defensive message is still rendered rather than leaving a
  blank page.
- **400px:** chips wrap; the bar does not become a horizontal scroller, which
  would hide vocabulary.
- **Accessibility:** chips are real `<button>`s with `aria-pressed`; the
  result count is announced via a polite live region.

## 6. Verification (all gates required)

- `node --test --test-concurrency=1 tools/test/*.test.mjs` green, including new tests for R12, the
  facet-bar region, and `data-facets` emission.
- `node tools/check.mjs` exit 0, 0 violations across 107.
- `node tools/build.mjs` idempotent.
- Browser: drive filtering live — single chip, multi-chip OR, card-chip click,
  All reset, URL round-trip, rail muting, 400px.
- Every one of the 16 chips exercised at least once; assert the visible-card
  count matches the chip's stated count.
- `avoid-visual-ai-tells` pass on the new chrome (orchestrator-run, per the
  Task 8 precedent).

## 7. Non-goals

- Free-text search. The chooser already covers guided discovery for charts.
- AND/NOT combinators, saved filters, or filter analytics.
- Re-tagging or consolidating the 160 flavour tags. They stay as they are;
  the synonym splits are documented above as known, not scheduled.
- Any change to the 107 scaffolds themselves. This is index chrome only.
- Applying facets to `chooser.html`. Task 9 owns the chooser.

## 8. Sequencing note

This work lands **after Task 9** (chooser re-skin) and **before or alongside
Task 10** (README + final gates). It touches `index.html`'s generated regions,
which Task 9 does not, so the two do not conflict — but Task 9 was queued
first and is a clean boundary.
