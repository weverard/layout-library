# Consistency Cleanup + Master Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One token vocabulary + one helper canon across all 107 scaffolds, one `catalog.json` source of truth with dev-side checker/generator tooling, a wb-base-ui master index replacing the two-tab gallery, and dead weight removed — per `docs/superpowers/specs/2026-07-11-consistency-cleanup-design.md` (the spec; read it first).

**Architecture:** Canonical reference blocks in `tools/canon/`; a zero-dep Node checker enforces them; a one-off codemod migrates the 107 files; `tools/build.mjs` regenerates catalog-derived regions of index/README/chooser from `catalog.json`. Infrastructure pages adopt wb-base-ui atom structure with this project's look expressed as `--wb-*` token overrides.

**Tech Stack:** Plain HTML/CSS/JS scaffolds (unchanged), Node ≥20 built-ins only (`node:fs`, `node:path`, `node:test`), Playwright MCP for browser verification, wb-base-ui skill at `~/.claude/skills/wb-base-ui` (v1.0.0).

## Global Constraints

- **Single-file contract is sacred:** every scaffold + index + chooser stays one self-contained HTML file — no runtime includes, no CDNs, no build step; must work from `file://` and `python3 -m http.server 8800`.
- **Zero npm dependencies.** `tools/` uses Node built-ins only. No `package.json`.
- **Migration must produce zero intended visual/behavioral change** in the 107 scaffolds.
- **The 107 scaffolds do NOT adopt wb-base-ui** — only `index.html` and `info-design/chooser.html` do.
- **wb-base-ui `components.css` is immutable** — inline it byte-identical from `~/.claude/skills/wb-base-ui/assets/components.css`; theme only via `--wb-*` token overrides. Version anchor `data-wb-version="1.0.0"`.
- **Every task's verify step includes the tool-call-leak grep:** `grep -nE '</content>|</invoke>|antml' <changed files>` must return nothing after `</html>` (recurring risk from Phase 1).
- Browser verification = Playwright MCP against `http://localhost:8800` (`python3 -m http.server 8800` from repo root; server caches — bump `?v=N` after edits). Console must be clean; check 400px width.
- Commit per task on branch `feat/consistency-cleanup`. Do not push.
- Canon helper set is `el, showChip, hideChip, attachHover, escHtml` ONLY — `xOf`/`yOf` are chart-specific by design (6+ legitimate body variants) and are exempt (spec amended 2026-07-11).

## File Structure

```
tools/
  canon/tokens.css        # canonical :root template (names+order contract)
  canon/helpers.js        # canonical bodies of the 5 shared helpers
  canon/headers.md        # doc-header standard, 2 profiles
  lib/scaffolds.mjs       # shared parsing: list files, extract :root/header/title
  check.mjs               # contract checker (exit 1 on violation; --report mode)
  build.mjs               # regenerates gen: regions from catalog.json
  migrate/extract-catalog.mjs   # one-off: index+chooser+README → catalog.json
  migrate/migrate-scaffolds.mjs # one-off: codemod over 107 files
  test/*.test.mjs         # node:test suites + fixtures/
catalog.json              # single source of truth (107 entries + categories)
index.html                # REBUILT: wl-nav master view
info-design/chooser.html  # re-skinned chrome, logic untouched
README.md                 # conventions + tooling + generated catalog regions
frontend-UI/              # DELETED (Task 1, after parity gate)
```

---

### Task 1: Hygiene — .DS_Store purge + gated frontend-UI deletion

**Files:**
- Delete: `frontend-UI/` (entire folder), all `.DS_Store`

**Interfaces:** Produces: a tree containing only library files. Nothing consumes frontend-UI afterwards.

⚠️ `frontend-UI/` is **untracked** — deletion is unrecoverable. The parity gate below is mandatory; if it finds unique content, STOP and surface to the orchestrator instead of deleting.

- [ ] **Step 1: Parity-diff frontend-UI against the installed skill** (the skill re-homes flat files: CSS → `assets/`, `wl-*.html` → `layouts/`)

```bash
cd /Users/warren/Projects/layout-library
S=~/.claude/skills/wb-base-ui
for f in tokens.css components.css reference.html; do diff -q "frontend-UI/$f" "$S/assets/$f"; done
for f in frontend-UI/wl-*.html; do diff -q "$f" "$S/layouts/$(basename "$f")"; done
diff -q frontend-UI/wb-base-ui.combined.css "$S/wb-base-ui.combined.css"
diff -q frontend-UI/SKILL.md "$S/SKILL.md"
diff -q frontend-UI/project-instructions.md "$S/project-instructions.md"
# then list anything in frontend-UI NOT covered above:
ls frontend-UI/
```
Expected: every `diff -q` silent (files identical). Remaining listed files (manual.html, stack-model.html, README, index.html, `mnt/` artifact, .DS_Store) — check each: `diff -q` against any same-named file anywhere under `$S/` (`find $S -name <name>`). The `mnt/user-data/outputs/…` path is a known sandbox artifact — deletable regardless. **Any file with real content that has NO identical copy under `$S/` → STOP, report, do not delete.**

- [ ] **Step 2: Delete**

```bash
rm -rf frontend-UI/
find . -name .DS_Store -not -path "./.git/*" -delete
git status --short   # expect: no ?? frontend-UI, no .DS_Store
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove untracked frontend-UI (lives as wb-base-ui skill) + .DS_Store purge"
```
(Only tracked-file changes will appear in the commit — that's expected; the deletion itself is untracked cleanup. If nothing is staged, commit with `--allow-empty -m "chore: record frontend-UI removal (was untracked)"` so the ledger has an anchor.)

**Orchestrator follow-up (not the subagent):** update memory `reference_wb_base_ui_skill.md` — source of truth becomes `~/.claude/skills/wb-base-ui/`.

---

### Task 2: `tools/lib/scaffolds.mjs` + canon files + tests

**Files:**
- Create: `tools/lib/scaffolds.mjs`, `tools/canon/tokens.css`, `tools/canon/helpers.js`, `tools/canon/headers.md`, `tools/test/scaffolds.test.mjs`

**Interfaces:**
- Produces (consumed by Tasks 3–7):
  - `listScaffolds(root) → [{file, group}]` — group `"layouts"|"info-design"`; 107 entries; excludes chooser/index.
  - `extractRoot(html) → {raw, decls:[{name,value}]}` — first `:root{…}` block.
  - `extractHeader(html) → {raw, fields:[{key,value}]}` — the `<!-- … -->` doc comment after `<title>`; keys are the UPPERCASE first tokens.
  - `extractTitle(html) → string`
  - `CANON_TOKENS` (array of 16 names, canonical order), `CANON_HELPERS` (object name→body), exported from `tools/lib/scaffolds.mjs` after reading the canon files.

- [ ] **Step 1: Write `tools/canon/tokens.css`** — names+order are the contract, `/*file*/` values are per-file:

```css
/* Canonical :root vocabulary — NAMES AND ORDER are contract, values are per-file
   unless marked canonical. Extra file-specific tokens are allowed AFTER these 16. */
:root{
  --accent:/*file*/; --accent-ink:/*file; default #fff*/;
  --bg:/*file*/; --surface:/*file*/; --ink:/*file*/; --muted:/*file*/; --line:/*file*/;
  --pos:/*file; default var(--accent)*/; --neg:/*file; default #B3261E*/;
  --serif:/*file; default Georgia,"Times New Roman",serif*/;
  --sans:/*file*/; --mono:/*file*/;
  --s1:8px; --s2:14px; --s3:24px; --s4:40px; /* canonical values */
}
```

- [ ] **Step 2: Write `tools/canon/helpers.js`** — exactly these five bodies (verbatim from the i01-lineage majority; `xOf`/`yOf` are deliberately absent):

```js
// Canonical shared helpers. A scaffold inlines only what it uses, but any function
// bearing one of these names must match these bodies (whitespace-normalized).
// xOf/yOf are chart-specific and exempt. Module vars used: svgns, chip, figureEl.
function el(name, attrs){
  var e = document.createElementNS(svgns, name);
  for(var k in attrs){ e.setAttribute(k, attrs[k]); }
  return e;
}
function attachHover(barEl, label, value){
  barEl.addEventListener('mouseenter', function(){ showChip(barEl, label, value); });
  barEl.addEventListener('mouseleave', hideChip);
  barEl.addEventListener('mousemove', function(){ showChip(barEl, label, value); });
}
function showChip(barEl, label, value){
  var r = barEl.getBoundingClientRect();
  var f = figureEl.getBoundingClientRect();
  chip.textContent = label + ': ' + value;
  chip.style.left = (r.left + r.width / 2 - f.left) + 'px';
  chip.style.top = (r.top - f.top) + 'px';
  chip.classList.add('on');
}
function hideChip(){ chip.classList.remove('on'); }
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

- [ ] **Step 3: Write `tools/canon/headers.md`** documenting the two profiles (shared core `BEST FOR`, `RE-SKIN`; layouts add `PATTERN`, `NAV MODEL`, `REGIONS` in order PATTERN, NAV MODEL, BEST FOR, REGIONS, RE-SKIN; charts add `CHART`, `DATA SHAPE`, `INSIGHT` in order CHART, DATA SHAPE, INSIGHT, BEST FOR, RE-SKIN). Copy the real examples from `layouts/01-split-panel.html:7-15` and `info-design/i01-grouped-bars.html:7-15` into it.

- [ ] **Step 4: Write failing tests** `tools/test/scaffolds.test.mjs` (node:test): `listScaffolds` returns 107 with correct group split (71/36); `extractRoot` on `layouts/01-split-panel.html` yields first decl `--bg` (pre-migration order) and on `info-design/i01-grouped-bars.html` includes `--panel`; `extractHeader` on i01 yields keys `['CHART','DATA SHAPE','INSIGHT','BEST FOR','RE-SKIN']`; `extractTitle` regex-matches `^i01 · .* — Info design scaffold$`; `CANON_TOKENS.length === 16`; `CANON_HELPERS` has exactly the 5 names.

- [ ] **Step 5: Run to verify fail** — `node --test tools/test/` → FAIL (module missing).
- [ ] **Step 6: Implement `tools/lib/scaffolds.mjs`** (readdir + regexes: `:root\s*{([^}]*)}` for root; `<!--([\s\S]*?)-->` first comment after `</title>` for header, field key = leading `[A-Z][A-Z ]+` before double-space; parse CANON_TOKENS from canon/tokens.css decl names; parse CANON_HELPERS by splitting canon/helpers.js on `^function (\w+)`).
- [ ] **Step 7: Run to verify pass** — `node --test tools/test/` → all PASS.
- [ ] **Step 8: Commit** — `git add tools/ && git commit -m "feat(tools): scaffold parsing lib + canon reference files"`

---

### Task 3: Contract checker `tools/check.mjs`

**Files:**
- Create: `tools/check.mjs`, `tools/test/check.test.mjs`, `tools/test/fixtures/good-layout.html`, `tools/test/fixtures/bad-layout.html`

**Interfaces:**
- Consumes: everything Task 2 produces.
- Produces: CLI `node tools/check.mjs [--report] [files…]` — no args = all 107 + repo rules; `--report` prints violations but exits 0; default exits 1 on any violation. Task 5 adds two repo rules to it (see Task 5 Step 4); Tasks 6/7 gate on it.

**Rules (exact):**
| # | Rule | Logic |
|---|---|---|
| R1 | head preamble | file starts with the exact 5 lines of `layouts/01-split-panel.html:1-5` (byte compare) |
| R2 | reset present | contains `*{box-sizing:border-box` |
| R3 | tokens | `extractRoot` decl names: first 16 === `CANON_TOKENS` in order; extras allowed after |
| R4 | helpers | for each CANON_HELPERS name found via `/function (el|attachHover|showChip|hideChip|escHtml)\s*\(/`: body (to balanced closing brace) must equal canon after whitespace-normalize (`s.replace(/\s+/g,' ')`) |
| R5 | title | `/^\d{2} · .+ — Layout scaffold$/` or `/^i\d{2} · .+ — Info design scaffold$/`, matching its group |
| R6 | header | field keys+order per profile (layouts vs charts, from canon/headers.md) |
| R7 | badge | contains `class="scaffold"` and a gallery link (`../index.html`) |
| R8 | filename | `/^\d{2}-[a-z0-9-]+\.html$/` or `/^i\d{2}-[a-z0-9-]+\.html$/` |
| R9 | clean tail | nothing but whitespace after `</html>`; no `</content>|</invoke>|antml` anywhere |

- [ ] **Step 1: Write fixtures** — `good-layout.html`: minimal scaffold satisfying R1–R9 (copy head of `layouts/01`, canonical 16-token :root, one canon helper, valid header/title/badge). `bad-layout.html`: same but `--surface` before `--bg` (R3), a modified `hideChip` body (R4), and trailing `</invoke>` after `</html>` (R9).
- [ ] **Step 2: Write failing tests** `check.test.mjs`: run checker programmatically on fixtures — good → `[]`, bad → violations exactly `['R3','R4','R9']` (by rule id).
- [ ] **Step 3: Verify fail** — `node --test tools/test/` → FAIL.
- [ ] **Step 4: Implement `tools/check.mjs`** (import lib; per-file rule functions returning `{rule, file, detail}`; `--report` flag).
- [ ] **Step 5: Verify pass** — tests PASS. Then `node tools/check.mjs --report` on the real tree: expect MANY R3/R4/R6 violations (pre-migration baseline — that's correct). Save count: `node tools/check.mjs --report | tail -1`.
- [ ] **Step 6: Commit** — `git add tools/ && git commit -m "feat(tools): contract checker with report mode"`

---

### Task 4: Extract `catalog.json` (single source of truth)

**Files:**
- Create: `tools/migrate/extract-catalog.mjs`, `catalog.json`, `tools/test/catalog.test.mjs`

**Interfaces:**
- Produces `catalog.json` (consumed by Tasks 5, 8):

```json
{
  "categories": [
    {"key":"foundations","group":"layouts","name":"Foundations — app & document shells","intro":"<1-2 sentences, authored>"},
    {"key":"comparison","group":"info-design","name":"Comparison — set side by side","intro":"…"}
  ],
  "items": [
    {"id":"01","group":"layouts","file":"layouts/01-split-panel.html","title":"Split Panel",
     "category":"foundations","accent":"#4F46E5",
     "oneliner":"Nav in a <b>fixed identity panel</b>; content scrolls beside it.",
     "tags":["landing","portfolio"],
     "thumb":"<div class=\"tw t-split\">…verbatim from index.html…</div>"},
    {"id":"i01","group":"info-design","file":"info-design/i01-grouped-bars.html",
     "title":"Grouped Bars with Annotation","category":"comparison","accent":"#B45309",
     "oneliner":"Two-series category comparisons; plan vs actual.",
     "tags":["compare"],
     "thumb":"…",
     "shape":"4 categories × 2 series","verbs":["compare"],
     "when":"two-series category comparisons; plan vs actual"}
  ]
}
```

- [ ] **Step 1: Write `extract-catalog.mjs`**: (a) parse `index.html` — split on `<p class="cat">` headings (20 expected) and per-card regex `/<a class="card" href="([^"]+)" style="--accent:([^"]+)">([\s\S]*?)<\/a>/g`; inside a card, `thumb` = the `<div class="thumb">…` inner `tw` div verbatim, `title` = `<h3>…`, `oneliner` = `<p class="nav">…` inner HTML, `tags` = all `<span class="tag">…`; (b) parse `info-design/chooser.html` `var CATALOG = [` array via `new Function('return ' + slice)()` (slice = text between `CATALOG = ` and the closing `];`), merge `cat/shape/verbs/when` into the matching `iNN` items; (c) chart `oneliner` = chooser `when`, sentence-cased with trailing period; (d) write pretty-printed `catalog.json`.
- [ ] **Step 2: Author the ~20 category intros** directly in `catalog.json` — 1-2 sentences each, extending the existing heading (source: heading text + the category's README section). Two worked examples to match in tone: *Foundations:* "The app and document shells most products start from — sidebars, top bars, split panes. Fork one of these when the structure should disappear behind the content." *Comparison:* "Charts that set two or more things side by side so the gap is the message. Reach for these when someone asks 'which is bigger, and by how much?'"
- [ ] **Step 3: Write + run tests** `catalog.test.mjs`: 107 items (71+36); every `file` exists on disk and vice-versa (glob the two dirs); every item's `category` key exists in `categories`; every chart item has `shape/verbs/when`; every `thumb` non-empty and every `accent` matches `/^#[0-9A-Fa-f]{3,8}$/`; every category has non-empty `intro` ≥ 40 chars. Run: `node tools/migrate/extract-catalog.mjs && node --test tools/test/` → PASS.
- [ ] **Step 4: Reconcile known drift** — for `i04`: chooser `shape` wins (`1 series × 36 monthly points + band`); grep README later regenerates from this (Task 5).
- [ ] **Step 5: Commit** — `git add catalog.json tools/ && git commit -m "feat: catalog.json single source of truth + extractor"`

---

### Task 5: Generator `tools/build.mjs` — README + chooser regions

**Files:**
- Create: `tools/build.mjs`, `tools/test/build.test.mjs`
- Modify: `README.md` (insert markers around both catalog sections), `info-design/chooser.html` (markers around CATALOG), `tools/check.mjs` (add R10/R11)

**Interfaces:**
- Produces: `node tools/build.mjs` — rewrites, in place, the text between each marker pair; idempotent (second run = no diff). Markers: HTML/md `<!-- gen:<name> start -->` / `<!-- gen:<name> end -->`; inside JS: `// gen:catalog start` / `// gen:catalog end`. Targets now: `readme-layout-catalog`, `readme-info-catalog`, `chooser-catalog`. Task 8 adds `index-cards`.

- [ ] **Step 1: Insert markers** around README's `## The catalog (71)` body, README's info-design tables, and chooser's `var CATALOG = […];` block. Commit nothing yet.
- [ ] **Step 2: Write failing test**: run build twice; (a) chooser CATALOG region, evaluated, deep-equals the array evaluated from `catalog.json` items (charts only, mapped to `{id,title,cat,href,shape,verbs,when}` — `href` = basename); (b) README regions contain exactly 71 and 36 entry rows; (c) second run produces byte-identical files (idempotence).
- [ ] **Step 3: Implement** — generate README layout list in the existing grouped-prose format (category heading bold line + `` `NN` Title — oneliner `` lines) and info tables in the existing `| # | Chart | Data shape | Best for |` format; generate chooser CATALOG entries in the existing object-literal style, one per line.
- [ ] **Step 4: Add checker rules** — R10: every marker pair present exactly once in its file; R11: `build.mjs` dry-run produces zero diff (generated regions in sync) and catalog↔disk 1:1. Extend `check.test.mjs` accordingly.
- [ ] **Step 5: Verify** — `node tools/build.mjs && node --test tools/test/` → PASS. `git diff README.md` should show only formatting-level changes + the i04 reconciliation; **review that diff by eye** — content drift beyond i04 means an extractor bug: STOP and fix. Playwright: load `http://localhost:8800/info-design/chooser.html?v=2`, walk one verb path (e.g. *compare* → answer → 2-3 recommendations render), console clean.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(tools): build.mjs regenerates README + chooser from catalog.json"`

---

### Task 6: Migrate `layouts/` (71 files)

**Files:**
- Create: `tools/migrate/migrate-scaffolds.mjs`
- Modify: all `layouts/*.html`

**Interfaces:**
- Consumes: Task 2 lib/canon. Produces: layouts pass `check.mjs` R1–R9. The script takes `--group layouts|info-design` (Task 7 reuses it).

- [ ] **Step 1: Write the codemod** `migrate-scaffolds.mjs --group layouts`. Per file:
  1. Rewrite `:root` first-16 in canonical order, keeping the file's existing values; insert missing tokens with these defaults: `--accent-ink:#fff` (only if absent), `--pos:var(--accent)`, `--neg:#B3261E`, `--serif:Georgia,"Times New Roman",serif`, `--s1:8px; --s2:14px; --s3:24px; --s4:40px`. Preserve any extra file tokens after the 16, order untouched.
  2. Replace any canon-named helper whose whitespace-normalized body ≠ canon with the canon body — **but only when the existing body is behaviorally equivalent** (differences limited to whitespace/`var`-vs-`const`/param names). A behaviorally different body (e.g. the cursor-follow `showChip` using `e.clientX`) gets RENAMED instead (`showChip`→`showChipCursor` + its call sites) so R4 stays honest. Log every rename.
  3. `function escHtml(str)` → canon `escHtml(s)` body.
  4. Header: reorder fields to profile order if needed (values untouched).
- [ ] **Step 2: Dry-run + eyeball** — `node tools/migrate/migrate-scaffolds.mjs --group layouts --dry` prints per-file change summary. Expect: 71 token-block rewrites, few helper replacements, ≤2 renames.
- [ ] **Step 3: Apply, then check** — run without `--dry`; `node tools/check.mjs --report layouts/*.html` → zero R1–R9 violations. `git diff --stat` ≈ 71 files.
- [ ] **Step 4: Verify in browser** — Playwright sweep all 71 pages (loop `http://localhost:8800/layouts/<file>?v=3`): loads, console clean. Screenshot before/after (checkout stash trick or use main's copy via `git show main:layouts/01-split-panel.html > /tmp/before.html`) for 5 representative files: `01-split-panel`, `16-desktop-os` (dark theme), `55-chatgpt-commerce` (biggest), `66-kpi-slide`, `43-keyboard-inbox` — pixel-eyeball: identical.
- [ ] **Step 5: Tail grep** — R9 covers it via checker; also run the global grep from Global Constraints.
- [ ] **Step 6: Commit** — `git add layouts/ tools/ && git commit -m "refactor: migrate layouts/ to canonical token vocabulary + helper canon"`

---

### Task 7: Migrate `info-design/` (36 files)

**Files:**
- Modify: all `info-design/i*.html` (NOT chooser.html — it's not a scaffold)

**Interfaces:** Consumes Task 6's script. Produces: `node tools/check.mjs` fully green (all 107).

- [ ] **Step 1: Extend codemod for `--group info-design`**: additionally rename `--panel` → `--surface` (the `:root` decl AND every `var(--panel)` use — `grep -c "var(--panel)"` per file first, assert same count replaced); insert `--accent-ink:#fff` after `--accent`; reorder to canonical 16.
- [ ] **Step 2: Dry-run, apply, check** — `node tools/check.mjs` (no args, all 107) → exit 0, zero violations. `grep -rn "\-\-panel" info-design/` → only chooser.html (if it uses it; chooser is exempt until Task 9).
- [ ] **Step 3: Browser sweep** — all 36 chart pages: load, console clean, hover one chart element (tooltip chip appears — exercises the canon helpers live), drive one interactive file per motif class: `i18` (sort a column), `i22` (collapse a node), `i24` (zoom + breadcrumb), `i27` (sort). Screenshots before/after for `i01`, `i19` (heaviest geometry), `i25`, `i33`, `i36`: identical.
- [ ] **Step 4: Commit** — `git add info-design/ tools/ && git commit -m "refactor: migrate info-design/ — --panel→--surface, unified vocabulary"`

---

### Task 8: Master index — rebuild `index.html` on wl-nav

**Files:**
- Modify: `index.html` (full rebuild), `tools/build.mjs` (add `index-cards` target), `tools/check.mjs` (R10 covers new markers automatically)

**Interfaces:**
- Consumes: `catalog.json`, wb-base-ui skill files, the OLD index.html (thumbnail CSS + chrome palette — read it from git before overwriting: `git show HEAD:index.html > /tmp/old-index.html`).
- Produces: single-file master view; `node tools/build.mjs` regenerates its card sections.

- [ ] **Step 1: Read the wb-base-ui skill docs** — `~/.claude/skills/wb-base-ui/SKILL.md`, `layouts/wl-nav.html`, `assets/reference.html`. The shell vocabulary: `.wl-nav` wrapper, `.wl-nav__sidebar` (with `__brand`, `nav` of `__section` labels + `__item` links), `.wl-nav__scrim` + `__hamburger` responsive behavior, `.wl-nav__main` > `__topbar` + `__content`.
- [ ] **Step 2: Build the new `index.html`** structure:
  1. Head: keep title `Layout Scaffold Library`, keep the existing doc-comment (update counts text to "one master view").
  2. `<style id="wb-base-ui" data-wb-version="1.0.0">` = verbatim `assets/tokens.css` + `assets/components.css`.
  3. Second `<style>`: (a) project-look overrides — `:root{ --wb-color-bg:#FBFAF8; --wb-color-surface:#FFFFFF; --wb-color-text:#191919; --wb-color-text-muted:#6E6A63; --wb-color-border:#E5E1D8; --wb-color-primary:#4F46E5; }` (the library's paper palette + the gallery's existing indigo primary; re-check contrast per skill note); (b) the ENTIRE thumbnail CSS copied verbatim from `/tmp/old-index.html` (`.thumb`, `.tw`, every `.t-*` motif rule, `.b2`, card accent usage) — cards keep `style="--accent:#…"` and thumbnails read `var(--accent)` exactly as before; (c) card layout: `.asset-card` grid extending `.wb-card`.
  4. Body: wl-nav shell. Sidebar brand "Layout Scaffold Library"; `__section` "Layouts" then one `__item` per layouts category (7); `__section` "Info design" with `__item` per chart category (12, wait — count from catalog: ~13 headings on that pane incl. chooser banner; use catalog `categories`) + a distinct `__item` for the **Chart chooser** at the top of the section; `__spacer`; `__item` → README on GitHub. Items are same-page anchors (`href="#cat-<key>"`).
  5. `__content`: intro block (kicker "71 layouts · 36 info designs" + one-line dek), then per category: `<section id="cat-<key>">` with `<h2>` name, `<p class="intro">` from catalog, and a card grid between `<!-- gen:index-cards:<key> start/end -->` markers.
  6. Card template (generated): `<a class="wb-card asset-card" href="<file>" style="--accent:<accent>"><div class="thumb">…thumb…</div><div class="b"><p class="n"><id></p><h3><title></h3><p class="nav"><oneliner></p><div class="tags"><span class="wb-chip"><tag></span>…</div></div></a>`.
- [ ] **Step 3: Extend `build.mjs`** with the `index-cards` target (one marker pair per category key) + test: after build, index contains 107 `asset-card` links, each `href` exists on disk, idempotent.
- [ ] **Step 4: Run + verify** — `node tools/build.mjs && node --test tools/test/ && node tools/check.mjs` → all green.
- [ ] **Step 5: Browser verification (thorough)** — `http://localhost:8800/index.html?v=4`: all 107 cards render with thumbnails; rail anchors scroll to sections; chooser link opens; click through 3 cards (one per group + chooser) and back; 400px width → hamburger opens/closes sidebar, scrim works; `file://` open also works (drag into browser); console clean.
- [ ] **Step 6: avoid-visual-ai-tells pass** — orchestrator invokes the `avoid-visual-ai-tells` skill over the new page; fix or justify each flag inline.
- [ ] **Step 7: Commit** — `git add index.html tools/ && git commit -m "feat: master index — wl-nav shell, category intros, generated cards"`

---

### Task 9: Chooser re-skin onto wb- atoms

**Files:**
- Modify: `info-design/chooser.html` (chrome only — CATALOG/VERBS/logic untouched)

**Interfaces:** Consumes wb-base-ui skill files. Produces: chooser with `<style id="wb-base-ui" data-wb-version="1.0.0">` + same override block as index (§Task 8 Step 2.3a).

- [ ] **Step 1: Swap chrome classes** — buttons → `wb-btn` (primary action `wb-btn--primary`), verb/answer choice pills → `wb-chip` (interactive; keep existing click JS by keeping existing ids/data-attrs and ADDING wb classes), recommendation cards → `wb-card`, panels → `wb-card`/panel token surfaces. Replace bespoke button/chip/card CSS with the wb block + overrides; keep chooser-specific layout CSS (step columns, prompt box) as prefixed local classes. `--panel`→`--surface` here too if present.
- [ ] **Step 2: Verify logic untouched** — `git diff` shows NO change between the `// gen:catalog start/end` markers and none in `VERBS`/decision logic beyond class attributes.
- [ ] **Step 3: Browser drive** — walk ALL 9 verbs end-to-end (each reaches 2-3 recommendation cards, links valid), Reset works, "Copy prompt" works (button label flips to "Copied ✓"), 400px layout, console clean, `node tools/check.mjs` still green.
- [ ] **Step 4: avoid-visual-ai-tells pass** (orchestrator, as Task 8 Step 6).
- [ ] **Step 5: Commit** — `git add info-design/chooser.html && git commit -m "refactor: chooser chrome on wb-base-ui atoms, logic untouched"`

---

### Task 10: README conventions + final verification sweep

**Files:**
- Modify: `README.md` (conventions §2 token list, new "Tooling" section, status note), `docs/` nothing else

- [ ] **Step 1: Update README** — Conventions item 2 lists the canonical 16-token vocabulary verbatim from `tools/canon/tokens.css` and states "names and order are contract, values are yours; xOf/yOf-style scale functions are chart-specific". New section after Quick start:

```markdown
## Tooling (dev-side only — scaffolds stay zero-dependency)

- `node tools/check.mjs` — the contract, executable. Run before committing; CI-of-one.
- `node tools/build.mjs` — regenerates gallery cards, README catalogs, and the
  chooser CATALOG from `catalog.json`. Edit `catalog.json`, never the generated
  regions (marked `gen:` in comments).
- Adding a scaffold: create the file per Conventions, add its `catalog.json`
  entry, run build + check, browser-verify.
```
  Status note dated 2026-07-XX (fill actual date): master view + unified vocabulary shipped. Update "Adding a new layout" to reference catalog.json instead of hand-editing index.
- [ ] **Step 2: Full gates** — `node tools/build.mjs` (no diff) && `node --test tools/test/` && `node tools/check.mjs` → all green; global tail grep; Playwright: index + chooser + 6 random scaffolds (3 per group) load clean.
- [ ] **Step 3: Commit** — `git add README.md && git commit -m "docs: unified vocabulary + tooling contract in README"`

---

## Self-review (done at write time)

- **Spec coverage:** §1 canon→T2, §2 catalog→T4+T5, §3 checker→T3(+T5 R10/R11), §4 migration→T6+T7, §5 master index→T8, §6 chooser→T9, §7 deletions→T1, §8 verification→embedded per task + T10, §9 non-goals respected (no scaffold visual changes, outliers untouched). xOf/yOf exemption = spec amendment committed with this plan.
- **Type consistency:** `listScaffolds/extractRoot/extractHeader/extractTitle/CANON_TOKENS/CANON_HELPERS` used identically in T3/T6/T7; marker grammar `gen:<name>` identical in T5/T8; `--group` flag consistent T6/T7.
- **Placeholders:** README status date intentionally "fill actual date" — an instruction, not a gap.
