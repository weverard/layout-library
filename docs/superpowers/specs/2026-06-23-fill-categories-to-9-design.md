# Design — Fill every gallery category to 9 scaffolds

**Date:** 2026-06-23
**Project:** layout-library (standalone HTML layout/navigation scaffolds)
**Goal:** Add 24 new scaffolds (files `31`–`54`) so all six `index.html` categories hold exactly 9 cards each (30 → 54 total).

---

## Why

The gallery groups scaffolds into six nav-paradigm categories. They are currently uneven
(7 / 6 / 4 / 3 / 5 / 5). Levelling every category to 9 gives the library a complete,
balanced catalog and forces coverage of paradigms that are currently thin
(Command & Conversation has only 3; Sequence only 4).

## Gap analysis (authoritative, from `index.html`)

| Category | Now | Add | Existing files |
|---|---|---|---|
| Foundations — app & document shells | 7 | +2 | 01,02,03,04,23,25,26 |
| Spatial — navigate through space | 6 | +3 | 06,07,08,09,27,28 |
| Sequence & story — the axis is the nav | 4 | +5 | 05,10,11,12 |
| Command & conversation — type, don't click | 3 | +6 | 13,14,15 |
| Objects & cards — the content is a thing | 5 | +4 | 16,17,18,19,24 |
| Immersive — cinematic | 5 | +4 | 20,21,22,29,30 |
| **Total** | **30** | **+24** | → **54** |

## The contract (unchanged — every new file obeys `README.md`)

1. One file, fully self-contained — all CSS in one `<style>`, all JS in one `<script>`. No imports/CDNs/build. Runs from a bare file server and (where possible) `file://`.
2. Design tokens in `:root`; re-skin starts with `--accent`. Neutral base palette.
3. Documentation header comment at top of `<body>`/`<head>`: `PATTERN / NAV MODEL / BEST FOR / REGIONS / RE-SKIN`.
4. Responsive — stack/collapse on small screens; state breakpoint behaviour in the header.
5. Neutral placeholder content, no brand/domain lock-in.
6. Removable `.scaffold` badge, fixed bottom-right: `NN · slug ↔ gallery`.
7. Numbered kebab-case filename `NN-slug.html`.

Known gotchas to respect (from README): no reserved globals at top-level script scope
(`top`, `history`, `name`, `length`, `status`, `parent`, `location`, `self`, `event`, `screen`…);
shape `<span>`/`<button>` need `display:block`/UA reset; `view-transition-name` must be unique
per snapshot; dedupe heading ids for scroll-spy.

---

## The slate — 24 scaffolds

Built in six category batches, numbered sequentially in build order. ⭐ = user's original four picks.

### Foundations (+2)
| # | slug | Pattern | Nav model / key interaction | accent |
|---|---|---|---|---|
| 31 | `tabbed-workspace` | Tabbed Workspace ⭐ | Browser-in-browser: a tab strip; click to switch panes, close (×), reorder by drag, new-tab (+). Each tab owns an independent body. | `#4338CA` |
| 32 | `mobile-tabbar` | Mobile Tab-Bar Shell | Phone-frame app with a bottom tab bar (4 items); tap/swipe between sections, active icon highlights. Fills the no-mobile-shell gap. | `#0EA5A4` |

### Spatial (+3)
| # | slug | Pattern | Nav model / key interaction | accent |
|---|---|---|---|---|
| 33 | `column-view` | Folder Column-View ⭐ | Miller columns (Finder): selecting an item in a column reveals its children as a new column to the right; horizontal scroll follows the deepening path. | `#9333EA` |
| 34 | `isometric` | Isometric Scene | A 2.5D plane of tiles/buildings (CSS transforms); click a zone to focus/travel; hover lifts. | `#0891B2` |
| 35 | `mind-map` | Mind-Map Tree | A central node with branches; click a node to expand/collapse its children; the tree re-lays-out. Distinct from 08 (orbit rotates peers; this is a hierarchy). | `#DB2777` |

### Sequence & story (+5)
| # | slug | Pattern | Nav model / key interaction | accent |
|---|---|---|---|---|
| 36 | `dial-picker` | Dial / Wheel Picker ⭐ | iOS-style rotating wheel; drag/scroll to spin through a sequence, the centred item is selected (snaps + perspective fade at edges). | `#F59E0B` |
| 37 | `stepper` | Stepper / Wizard | Numbered linear steps with a progress rail; Next/Back move along; completed steps tick. | `#2563EB` |
| 38 | `page-turn` | Page-Turn Book | Spreads flip like a magazine/book; click page edge or arrows to turn (CSS 3D fold). | `#B45309` |
| 39 | `story-tap` | Story Tap-Through | Instagram-stories: tap right/left zones to advance/rewind; segmented timed progress bars auto-fill; pause on hold. | `#E11D48` |
| 40 | `carousel` | Carousel / Slideshow | Paged hero slides; dots + prev/next arrows + autoplay; keyboard arrows. | `#7C3AED` |

### Command & conversation (+6)
| # | slug | Pattern | Nav model / key interaction | accent |
|---|---|---|---|---|
| 41 | `conversational-form` | Conversational Form | Typeform-style: one question on screen at a time; Enter (or a button) advances; progress bar; answers recap. | `#10B981` |
| 42 | `notebook-cells` | Notebook / REPL Cells | Jupyter-style cells; type into a cell, "run" (⇧⏎) renders mock output below; add/clear cells. | `#EA580C` |
| 43 | `keyboard-inbox` | Keyboard Inbox | Superhuman-style list driven by j/k to move, Enter to open, e to archive; a shortcut cheatsheet (?) overlay. | `#4F46E5` |
| 44 | `slash-editor` | Slash-Command Editor | Notion-style document; typing "/" opens a block-type menu; pick a block, it inserts inline. | `#0D9488` |
| 45 | `filter-search` | Live Filter Search | Search-as-you-type over a list with facet chips; results filter instantly; count updates; clear. | `#0284C7` |
| 46 | `voice-assistant` | Voice Assistant | Mic button + animated waveform; "speak" plays a scripted transcription that resolves into an answer card. | `#7E22CE` |

### Objects & cards (+4)
| # | slug | Pattern | Nav model / key interaction | accent |
|---|---|---|---|---|
| 47 | `kanban` | Kanban Board ⭐ | Columns (To-do / Doing / Done) of cards; drag a card across columns (HTML5 DnD); counts update. | `#EA580C` |
| 48 | `masonry` | Masonry Gallery | Pinterest staggered-height grid; click a tile to open a lightbox; arrow through; Esc closes. | `#DB2777` |
| 49 | `card-wallet` | Card Wallet | A fanned stack of passes/cards; tap one to bring it forward and flip for detail (persistent fan, distinct from 17's discard-swipe). | `#0F766E` |
| 50 | `data-table` | Data Table | Sortable spreadsheet; rows are objects; click a header to sort, a row to open a detail drawer. | `#475569` |

### Immersive (+4)
| # | slug | Pattern | Nav model / key interaction | accent |
|---|---|---|---|---|
| 51 | `parallax-hero` | Parallax Mouse Hero | Layered hero where foreground/mid/back shift at different rates with cursor position (depth); scroll continues the parallax. | `#22D3EE` |
| 52 | `diagonal-editorial` | Diagonal / Skewed Editorial | Skewed section dividers, rotated oversized type, asymmetric off-grid blocks; scroll reveals. | `#F97316` |
| 53 | `starfield` | Particle Starfield Hero | An animated `<canvas>` particle/star field behind bold centred type; subtle drift + cursor pull. | `#6366F1` |
| 54 | `cursor-mask` | Cursor-Mask Reveal | A shaped mask follows the cursor revealing a *different* image/layer beneath the top one (swap, not just dim — distinct from 30). | `#EF4444` |

> Accents are starting points (each card's `--accent`); adjust if two adjacent cards clash in the gallery.

---

## Gallery integration (`index.html`)

For each new scaffold, add a card to the matching category `<section>` in the documented shape:

```html
<a class="card" href="NN-slug.html" style="--accent:#HEX">
  <div class="thumb"><div class="tw t-MOTIF"> … </div></div>
  <div class="b">
    <p class="n">NN</p><h3>Name</h3>
    <p class="nav"><b>Key verb</b> — one line on how you navigate.</p>
    <div class="tags"><span class="tag">use</span><span class="tag">use</span></div>
  </div>
</a>
```

- **Thumbnails:** reuse an existing `.t-MOTIF` wireframe where one fits (e.g. column-view ≈ a three-column variant, kanban ≈ columns, data-table ≈ rows). Otherwise add a new `.t-yourmotif` rule in the gallery `<style>` — abstract and lightweight, matching the existing motif vocabulary.
- Update the intro count (`N layouts`) and any heading total from 30 → 54.

## README updates (`README.md`)

- Move each built pattern from **Backlog** into **The catalog**, under its category, in number order.
- Bump catalog heading `## The catalog (30)` → `(54)`.
- Prune backlog items we built this round (dial/wheel picker, folder column-view, tabbed workspace, kanban, isometric, magazine page-turn, parallax hero, diagonal editorial). Keep the still-unbuilt ones (globe 3D points, ticker/stock-board).

## Build & verification process (per the chosen "category batches, verified" mode)

For each batch (one category at a time):
1. Author each `NN-slug.html` to the contract.
2. **Browser-verify each file** in headless Chrome (Playwright MCP): load it, exercise the
   core interaction, and confirm **zero console errors/warnings**. Fix before moving on.
3. Add the cards to `index.html`; verify the gallery still renders and new cards link correctly.
4. Update `README.md` catalog/backlog/count.
5. Proceed to the next category batch.

Batch order: Foundations (31–32) → Spatial (33–35) → Sequence (36–40) → Command (41–46) → Objects (47–50) → Immersive (51–54).

## Success criteria

- 24 new files `31`–`54` exist, each self-contained and contract-compliant (header comment, `:root` tokens, `--accent`, responsive, removable badge).
- Each new scaffold loads with a **clean console** and its signature interaction works.
- `index.html` shows **9 cards in every one of the six categories**, each with a working thumbnail and correct link; intro count reads 54.
- `README.md` catalog reflects all 54, backlog pruned of built items, counts updated.

## Out of scope

- No framework/build introduction; everything stays vanilla single-file.
- No git repo initialisation (project is not currently a git repo) — can be done separately on request.
- No redesign of existing 30 scaffolds or the gallery shell beyond adding cards/motifs and counts.
