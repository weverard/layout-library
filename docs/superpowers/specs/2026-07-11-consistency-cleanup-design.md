# Consistency cleanup + master index — design spec

**Date:** 2026-07-11
**Status:** Approved by Warren (brainstorming session 2026-07-11); awaiting spec review before writing-plans.

## Goal

Bring the library together, consistently: one token vocabulary and one helper
library across all 107 scaffolds, one source of truth for catalog metadata, one
master browse view with short explainers, executable enforcement of the
conventions contract, and removal of dead weight — all without breaking the
core contract that every scaffold is a single self-contained HTML file.

## Decisions (locked during brainstorming)

1. **Single-file contract stays sacred.** No shared runtime includes, no runtime
   build step, every file keeps opening via `file://`. Consistency comes from
   normalizing the inlined blocks, enforced by dev-side tooling.
2. **Tooling: checker + generator** (`tools/`, Node, zero npm deps). Never a
   runtime dependency.
3. **`frontend-UI/` is removed.** It is UNTRACKED (never committed), so deletion
   is unrecoverable from git — verify parity with the installed skill copy at
   `~/.claude/skills/wb-base-ui` first (see §6).
4. **One token vocabulary, per-file palette values.** All 107 files share token
   NAMES, order, and spacing scale; each file keeps its own VALUES (dark themes
   and bespoke accents survive).
5. **Execution: codemod + canon + checker** — scripted one-off migration against
   canonical reference blocks, then permanent enforcement.
6. **Master view IS the new `index.html`** (two-tab gallery replaced), built on
   the wb-base-ui `wl-nav` shell.
7. **Explainers at both levels:** 1–2 sentence intro per category + one-line
   "use when" per asset, all sourced from `catalog.json`.
8. **wb-base-ui = code base, not look.** Infrastructure pages (index, chooser)
   adopt wb- atom structure (`components.css` immutable) with token overrides
   expressing THIS project's existing visual identity. The 107 scaffolds do NOT
   adopt wb-base-ui — they are the product, each its own thing.

## 1. Canon (`tools/canon/`)

Reference files defining "correct"; never runtime includes.

- **`tokens.css`** — unified `:root` vocabulary in canonical order:
  `--bg --surface --ink --muted --line --accent --accent-ink --pos --neg`,
  fonts `--serif --sans --mono`, spacing `--s1 --s2 --s3 --s4`.
  `--surface` is canonical (info-design's `--panel` renamed to it). Names and
  order are contract; values are per-file. Every scaffold declares the full set
  even where some tokens go unused — uniformity is the point. Migration keeps
  each file's existing palette; newly added tokens get the canonical defaults
  from the info-design palette (`--pos`/`--neg`) or are derived from the file's
  own tokens (`--accent-ink` from its `--accent`).
- **`helpers.js`** — canonical bodies for the pasted micro-library:
  `el`, `hideChip`, `escHtml` (single spelling: `escHtml(s)`). A file inlines
  only the helpers it uses, but any function bearing one of these names must
  match canon (whitespace-normalized byte match). *Amended 2026-07-11:*
  `xOf`/`yOf` are EXEMPT — inspection shows 6+ legitimate body variants (they
  encode each chart's scale/domain); they stay chart-specific. Behaviorally
  divergent canon-named helpers are renamed during migration rather than
  forced to canon. *Amended 2026-07-21:* `showChip`/`attachHover` are ALSO
  EXEMPT — inspection across `info-design/` shows `showChip` has 13 distinct
  signatures and `attachHover` has 8, with only one file each matching canon,
  versus `el`, which is genuinely uniform (all 30 occurrences share
  `el(name, attrs)`). These are different per-chart functions that merely
  share a name, not a shared helper; without the exemption the migration
  would rename ~25 of them into 14 unrelated functions all called
  `showChipCustom`, satisfying the checker by relabelling without unifying
  anything. They join `xOf`/`yOf` as chart-specific by design.
- **`headers.md`** — one doc-header standard, two profiles sharing core fields
  `BEST FOR` and `RE-SKIN`, fixed field order and formatting:
  layouts profile adds `PATTERN / NAV MODEL / REGIONS`;
  charts profile adds `CHART / DATA SHAPE / INSIGHT`.

## 2. Catalog — single source of truth (`catalog.json`)

One entry per asset (107 total):
`{ id, group: "layouts"|"info-design", slug, title, category, tags[], accent,
oneliner, thumb }` plus chart-only fields `{ shape, verbs[], when }`, plus a
`categories` map: `{ name → { intro, order } }` (~20 categories).

- `thumb` = the existing hand-built wireframe markup, extracted one-time from
  the current `index.html` cards.
- `oneliner` = the per-asset "use when" line, adapted from doc-headers and the
  chooser's `when` field. Known drift (e.g. i04 data-shape text differing
  between README and chooser) is reconciled once, in this file.

`tools/build.mjs` regenerates, between HTML/markdown comment markers:
1. the card sections of `index.html`,
2. the README catalog sections/tables,
3. the chooser's `CATALOG` block.

All three outputs remain committed static files — zero runtime change.

## 3. Checker (`tools/check.mjs`)

Node, zero deps, exit non-zero on any violation. Per scaffold: head preamble
bytes, CSS reset present, token block conforms to canon (names/order exact,
values free), helper conformance, `<title>` pattern
(`NN · Name — Layout scaffold` / `iNN · Name — Info design scaffold`),
doc-header profile fields and order, scaffold badge present, filename
convention. Repo-level: `catalog.json` ↔ files on disk 1:1 (counts reconcile),
and generated regions in sync (rebuild + diff = clean). README documents
`node tools/check.mjs` as the contribution gate.

## 4. One-off migration (`tools/migrate/`)

Scripted codemod over the 107 scaffolds: token renames (`--panel`→`--surface`),
insert missing tokens and spacing scale, replace helper bodies with canon,
normalize header field order, unify `escHtml`. NO other content, markup, or
behavior changes. The migrate scripts are kept in-repo as a record (or deleted
after merge — implementer's call, noted in plan).

## 5. Master index (`index.html`, rebuilt)

- **wl-nav shell** from wb-base-ui: left rail lists all ~20 categories across
  both collections (layouts first, then info-design; the chooser is linked from
  the info-design group header in the rail).
- **Main pane:** one section per category — category intro (1–2 sentences),
  then wb-cards per asset: wireframe thumbnail, title, one-line "use when",
  tag chips (`wb-chip`).
- **wb-base-ui inlined** as `<style id="wb-base-ui" data-wb-version="<installed skill version>">`
  (tokens then components, components.css byte-identical to the skill's copy),
  followed by a separate token-override block expressing this project's
  existing look (paper-neutral palette). Single file, `file://`-safe.
- Card content is generated from `catalog.json` between markers; shell chrome
  is hand-authored once.

## 6. Chooser alignment (`info-design/chooser.html`)

Decision-tree logic, verbs, and generated CATALOG untouched. Markup moves onto
wb- atoms (buttons → `wb-btn`, choice chips → `wb-chip`, result cards →
`wb-card`) with the same project-look token overrides and the same inlined
versioned wb-base-ui block. Visual identity stays as-is.

## 7. Deletions & hygiene

- **`frontend-UI/` deleted from disk.** Precondition: diff it against
  `~/.claude/skills/wb-base-ui` and confirm the skill copy is a superset of
  anything worth keeping (expected: it is the same system; the folder also
  contains a stray sandbox artifact `frontend-UI/mnt/user-data/outputs/…`).
  Anything unique and wanted moves into the skill, not the repo.
- All `.DS_Store` files removed (`.gitignore` already covers them).
- `docs/` (specs/plans) stays.

## 8. Verification (all gates required)

1. `node tools/check.mjs` green across all 107 files + catalog reconciliation.
2. Playwright sweep over 107 scaffolds + index + chooser: page renders, console
   clean, one smoke interaction per file class (use the established
   orchestrator-driven Bash+node+Playwright pattern from the original build —
   reviewer subagents previously hit spend limits).
3. Before/after screenshot spot-checks on ~10 representative scaffolds:
   migration must produce zero intended visual change.
4. `avoid-visual-ai-tells` pass over the rebuilt index and chooser.

## 9. Non-goals

- No visual redesign of any scaffold; no content or interaction changes beyond
  the mechanical migration.
- No slimming of the outlier layouts `55-chatgpt-commerce` (67 KB) and
  `60-chatgpt-mobile` (58 KB) — flagged as debt only.
- No shared runtime includes anywhere; no npm dependencies.
- No new scaffolds or charts; no README rewrite beyond conventions/tooling
  sections and the generated catalog regions.
- Scaffolds do not adopt wb-base-ui.
