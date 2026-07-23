# Cross-cutting facet filters — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 16-chip filter bar to `index.html` that cuts across the 20-category rail, so "show me everything mobile" is one click.

**Architecture:** A closed facet vocabulary lives in `tools/canon/facets.json`. Every one of the 107 `catalog.json` items carries ≥1 facet. `tools/build.mjs` generates the chip bar and stamps `data-facets` onto every card. `tools/check.mjs` gains rule R12 to keep the vocabulary from rotting. Filtering itself is ~60 lines of vanilla JS in `index.html`.

**Tech Stack:** Zero dependencies. Node ≥20 built-ins only. Static HTML/CSS/JS. `node --test` for tests, Playwright MCP for browser verification.

## Global Constraints

- **Zero dependencies.** Node built-ins only, in tooling and in the page.
- **Must work from `file://`.** No fetch/XHR, no `<script src>`, no `@import`, no external fonts. `history.replaceState` throws on `file://` in some Chrome builds — every call MUST be wrapped in try/catch.
- **Single-file contract is sacred.** The 107 scaffolds are NOT touched by this work. Index chrome only.
- **wb-base-ui `components.css` is immutable.** It is inlined verbatim under `<style id="wb-base-ui" data-wb-version="1.0.0">`. NEVER edit a rule inside that block. All new styling goes in the project's own CSS below it. `.wb-chip[aria-pressed="true"]` already exists in the component layer — reuse it, do not redefine it.
- **Node v24 test invocation:** `node --test --test-concurrency=1 tools/test/*.test.mjs` (glob). A bare directory argument crashes.
- **`build.mjs` must stay idempotent** — a second run produces a byte-identical tree.
- **Never hand-edit a generated region.** Edit `catalog.json` / `facets.json` / `build.mjs`, then run `node tools/build.mjs`.
- **Tool-call-leak grep every task:** `grep -nE '</content>|</invoke>|antml' <changed files>` must be empty, and HTML files must end cleanly at `</html>`.
- **Commit per task. Do not push** unless Warren asks.

## Two traps found while writing this plan — read before Task 6

1. **`.asset-card{display:flex}` at `index.html:1180` overrides the `hidden` attribute.** Setting `el.hidden = true` will NOT hide a card. Task 6 adds an explicit `[hidden]{display:none !important}` rule in the project CSS block.
2. **Card chips cannot be `<button>`s.** The card is `<a class="wb-card asset-card">` wrapping everything; a `<button>` inside an `<a>` is invalid HTML and browsers handle it inconsistently. Card chips stay `<span>`s and are made clickable by a delegated listener that calls `preventDefault()` on the anchor navigation. Consequence: card chips are a **mouse shortcut only**; the filter bar's real `<button>`s are the keyboard-accessible route. This is deliberate, not an oversight.

## File Structure

| file | responsibility | task |
|---|---|---|
| `tools/canon/facets.json` | CREATE — the closed 16-facet vocabulary, display order | 1 |
| `tools/lib/scaffolds.mjs` | MODIFY — export `CANON_FACETS` | 1 |
| `tools/test/scaffolds.test.mjs` | MODIFY — vocabulary shape tests | 1 |
| `tools/check.mjs` | MODIFY — `ruleR12`, `REPO_RULES`, `REPO_RULE_IDS`, `STATIC_EXPECTED_MARKERS` | 2, 5 |
| `tools/test/check.test.mjs` | MODIFY — R12 tests | 2 |
| `catalog.json` | MODIFY — `facets` on all 107 items | 3 |
| `tools/build.mjs` | MODIFY — `buildAssetCard`, new `buildFacetBar` | 4, 5 |
| `tools/test/build.test.mjs` | MODIFY — card + bar generation tests | 4, 5 |
| `index.html` | MODIFY — bar markers, CSS, filter JS | 5, 6 |
| `README.md` | MODIFY — document the vocabulary | 7 |

---

### Task 1: Facet vocabulary canon + loader

**Files:**
- Create: `tools/canon/facets.json`
- Modify: `tools/lib/scaffolds.mjs` (append near `CANON_TOKENS` / `CANON_HELPERS`, ~line 145)
- Test: `tools/test/scaffolds.test.mjs`

**Interfaces:**
- Produces: `CANON_FACETS: {key: string, label: string, blurb: string}[]` exported from `tools/lib/scaffolds.mjs`, in display order. Consumed by Task 2 (`check.mjs`) and Task 5 (`build.mjs`).

- [ ] **Step 1: Write the failing test**

Append to `tools/test/scaffolds.test.mjs`:

```js
test('CANON_FACETS: 16 facets, unique keys, every field non-empty', () => {
  assert.equal(CANON_FACETS.length, 16);

  const keys = CANON_FACETS.map((f) => f.key);
  assert.equal(new Set(keys).size, 16, 'facet keys must be unique');

  for (const f of CANON_FACETS) {
    assert.ok(f.key && typeof f.key === 'string', `facet key missing: ${JSON.stringify(f)}`);
    assert.ok(f.label && typeof f.label === 'string', `facet label missing: ${f.key}`);
    assert.ok(f.blurb && typeof f.blurb === 'string', `facet blurb missing: ${f.key}`);
    assert.ok(!/[<>"]/.test(f.key), `facet key "${f.key}" must be plain text`);
  }

  assert.ok(keys.includes('mobile'), 'expected the mobile facet');
  assert.ok(keys.includes('before/after'), 'expected the before/after facet');
});
```

Add `CANON_FACETS` to the existing import from `../lib/scaffolds.mjs` at the top of that test file.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/test/scaffolds.test.mjs`
Expected: FAIL — `SyntaxError: The requested module '../lib/scaffolds.mjs' does not provide an export named 'CANON_FACETS'`

- [ ] **Step 3: Create the vocabulary file**

Create `tools/canon/facets.json`:

```json
{
  "facets": [
    { "key": "mobile",          "label": "mobile",          "blurb": "phone-shaped: sheets, tab bars, tap, swipe" },
    { "key": "conversational",  "label": "conversational",  "blurb": "chat, voice or agent is the interface" },
    { "key": "keyboard-driven", "label": "keyboard-driven", "blurb": "driven by typing or keys, not pointing" },
    { "key": "playful",         "label": "playful",         "blurb": "toy-like, game-like, characterful" },
    { "key": "animated",        "label": "animated",        "blurb": "motion carries meaning, not decoration" },
    { "key": "narrative",       "label": "narrative",       "blurb": "meant to be read start-to-finish" },
    { "key": "dashboard",       "label": "dashboard",       "blurb": "many metrics at a glance" },
    { "key": "before/after",    "label": "before/after",    "blurb": "explicit A-vs-B or then-vs-now" },
    { "key": "ranking",         "label": "ranking",         "blurb": "order or leaderboard is the point" },
    { "key": "geospatial",      "label": "geospatial",      "blurb": "place, maps, coordinates" },
    { "key": "hierarchy",       "label": "hierarchy",       "blurb": "nested, tree, parent-child" },
    { "key": "time",            "label": "time",            "blurb": "a time axis is central" },
    { "key": "dense",           "label": "dense",           "blurb": "high information density" },
    { "key": "editorial",       "label": "editorial",       "blurb": "typographic, publication-like" },
    { "key": "gallery",         "label": "gallery",         "blurb": "browsing a visual collection" },
    { "key": "commerce",        "label": "commerce",        "blurb": "buying, checkout, loyalty" }
  ]
}
```

- [ ] **Step 4: Export the loader**

In `tools/lib/scaffolds.mjs`, immediately after the `CANON_HELPERS` export (~line 148), add:

```js
/** @type {{key: string, label: string, blurb: string}[]} closed facet vocabulary, display order. */
export const CANON_FACETS = JSON.parse(
  readFileSync(path.join(CANON_DIR, 'facets.json'), 'utf8')
).facets;
```

- [ ] **Step 5: Run the tests**

Run: `node --test --test-concurrency=1 tools/test/*.test.mjs`
Expected: PASS, count rises from 44 to 45.

- [ ] **Step 6: Commit**

```bash
git add tools/canon/facets.json tools/lib/scaffolds.mjs tools/test/scaffolds.test.mjs
git commit -m "feat(canon): closed 16-facet vocabulary + CANON_FACETS loader"
```

---

### Task 2: Checker rule R12

Written BEFORE the data exists, so it goes red against the real catalog and proves it has teeth.

**Files:**
- Modify: `tools/check.mjs` (import block line 23; new rule near `ruleR11`; `REPO_RULES` line 366; `REPO_RULE_IDS` line 371)
- Test: `tools/test/check.test.mjs`

**Interfaces:**
- Consumes: `CANON_FACETS` from Task 1.
- Produces: `ruleR12({root}) -> {rule, file, detail}[]`, registered in `REPO_RULES`. Task 3 makes it green.

- [ ] **Step 1: Write the failing test**

Append to `tools/test/check.test.mjs`:

Use the helper that **already exists** at `tools/test/check.test.mjs:138`: `makeSyntheticRoot()`. It builds a temp root with `catalog.json` (2 items — `01` in category `foundations`, `i01` in category `comparison`), plus `index.html`, `README.md` and `chooser.html`. Do NOT write a new scratch-repo helper and do NOT mutate the real repo root.

Follow the file's existing convention for reaching a repo rule — positional destructuring of `REPO_RULES`, matching the `ruleR10` / `ruleR11` wrappers at lines 20-27. Add alongside them:

```js
function ruleR12(ctx) {
  const [, , r12] = REPO_RULES;
  return r12(ctx);
}
```

Then append these four tests:

```js
test('R12 fires: an item with no facets', () => {
  const root = makeSyntheticRoot();
  try {
    const p = path.join(root, 'catalog.json');
    const cat = JSON.parse(readFileSync(p, 'utf8'));
    cat.items[0].facets = [];
    cat.items[1].facets = ['mobile', 'dense'];
    writeFileSync(p, JSON.stringify(cat, null, 2));

    const violations = ruleR12({ root });
    assert.ok(
      violations.some((v) => v.rule === 'R12' && v.detail.includes('01') && /missing facets/.test(v.detail)),
      'expected a missing-facets violation for item 01'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('R12 fires: a facet outside the closed vocabulary', () => {
  const root = makeSyntheticRoot();
  try {
    const p = path.join(root, 'catalog.json');
    const cat = JSON.parse(readFileSync(p, 'utf8'));
    cat.items[0].facets = ['not-a-real-facet'];
    cat.items[1].facets = ['mobile', 'dense'];
    writeFileSync(p, JSON.stringify(cat, null, 2));

    const violations = ruleR12({ root });
    assert.ok(
      violations.some((v) => v.rule === 'R12' && v.detail.includes('not-a-real-facet')),
      'expected an out-of-vocabulary violation'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('R12 fires: a facet confined to one category is redundant with the rail', () => {
  const root = makeSyntheticRoot();
  try {
    const p = path.join(root, 'catalog.json');
    const cat = JSON.parse(readFileSync(p, 'utf8'));
    // "mobile" spans both categories; "gallery" is confined to foundations.
    cat.items[0].facets = ['mobile', 'gallery'];
    cat.items[1].facets = ['mobile', 'dense'];
    writeFileSync(p, JSON.stringify(cat, null, 2));

    const violations = ruleR12({ root });
    assert.ok(
      violations.some((v) => v.detail.includes('"gallery"') && /only 1 category/.test(v.detail)),
      'expected a single-category span violation for gallery'
    );
    assert.ok(
      !violations.some((v) => v.detail.includes('"mobile"') && /only 1 category/.test(v.detail)),
      'mobile spans both categories and must NOT be flagged'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('R12 fires: a vocabulary facet carried by no item is a dead chip', () => {
  const root = makeSyntheticRoot();
  try {
    const p = path.join(root, 'catalog.json');
    const cat = JSON.parse(readFileSync(p, 'utf8'));
    cat.items[0].facets = ['mobile', 'dense'];
    cat.items[1].facets = ['mobile', 'dense'];
    writeFileSync(p, JSON.stringify(cat, null, 2));

    const violations = ruleR12({ root });
    assert.ok(
      violations.some((v) => v.detail.includes('"commerce"') && /no item/.test(v.detail)),
      'expected a dead-chip violation for the unused commerce facet'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
```

**Expected noise, not a bug:** on a 2-item synthetic root the dead-chip check fires for the ~14 unused facets in every one of these tests. That is why each assertion uses `.some()` for the specific violation it is testing rather than asserting an exact violation count. R12 reaching zero is only meaningful against the real 107-item catalog, which Task 3 verifies.

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tools/test/check.test.mjs`
Expected: FAIL — `TypeError: r12 is not a function` (only two rules are registered in `REPO_RULES`).

- [ ] **Step 3: Implement R12**

In `tools/check.mjs`, add `CANON_FACETS` to the import block at line 23. Then add, immediately after `ruleR11` — as a plain module-scope function, NOT exported, matching how `ruleR10` and `ruleR11` are declared:

```js
/**
 * R12 — the facet vocabulary stays closed and useful.
 * Repo-level: reads catalog.json once and checks it against tools/canon/facets.json.
 *   a) every item carries >=1 facet (no card is unreachable by the filter);
 *   b) every facet used is in the closed vocabulary (no drift back to 160 tags);
 *   c) every facet in the vocabulary is carried by >=1 item (no dead chips);
 *   d) every facet spans >=2 categories — a facet confined to one category is
 *      redundant with the rail, which is the whole reason facets exist.
 */
function ruleR12({ root }) {
  const violations = [];
  const catalog = JSON.parse(readFileSync(path.join(root, 'catalog.json'), 'utf8'));
  const vocab = new Set(CANON_FACETS.map((f) => f.key));
  const spans = new Map(); // facet key -> Set of category keys

  for (const item of catalog.items) {
    if (!Array.isArray(item.facets) || item.facets.length === 0) {
      violations.push({
        rule: 'R12',
        file: 'catalog.json',
        detail: `${item.id}: missing facets — every item needs at least one`,
      });
      continue;
    }
    for (const facet of item.facets) {
      if (!vocab.has(facet)) {
        violations.push({
          rule: 'R12',
          file: 'catalog.json',
          detail: `${item.id}: facet "${facet}" is not in tools/canon/facets.json`,
        });
        continue;
      }
      if (!spans.has(facet)) spans.set(facet, new Set());
      spans.get(facet).add(item.category);
    }
  }

  for (const { key } of CANON_FACETS) {
    const cats = spans.get(key);
    if (!cats || cats.size === 0) {
      violations.push({
        rule: 'R12',
        file: path.join('tools', 'canon', 'facets.json'),
        detail: `facet "${key}" is carried by no item — a dead chip`,
      });
    } else if (cats.size < 2) {
      violations.push({
        rule: 'R12',
        file: path.join('tools', 'canon', 'facets.json'),
        detail: `facet "${key}" appears in only 1 category — a facet must cut across >=2 to earn its place`,
      });
    }
  }

  return violations;
}
```

Register it:

```js
export const REPO_RULES = [ruleR10, ruleR11, ruleR12];
```

```js
const REPO_RULE_IDS = ['R10', 'R11', 'R12'];
```

- [ ] **Step 4: Run the R12 tests**

Run: `node --test tools/test/check.test.mjs`
Expected: PASS — all four R12 tests green.

- [ ] **Step 5: Confirm R12 goes red against the REAL catalog**

Run: `node tools/check.mjs`
Expected: **exit 1**, with 107 `R12` violations reading `missing facets — every item needs at least one`, plus 16 dead-chip lines. This is correct and expected: the rule exists, the data does not yet. Task 3 closes it.

- [ ] **Step 6: Commit**

```bash
git add tools/check.mjs tools/test/check.test.mjs
git commit -m "feat(check): R12 — closed facet vocabulary, >=1 per item, >=2 categories per facet

Red against the real catalog by design; Task 3 supplies the data."
```

---

### Task 3: Classify all 107 items

**Files:**
- Modify: `catalog.json` (add `facets` to every item)

**Interfaces:**
- Consumes: the vocabulary from Task 1, the rule from Task 2.
- Produces: `item.facets: string[]` on all 107 items. Tasks 4 and 5 read it.

**Method:** insert `facets` immediately after `tags` on each item, preserving the file's existing 2-space formatting. Do NOT `JSON.stringify` the whole file — that reflows all 1847 lines and buries the diff. Use a targeted script or per-item edits.

Target exactly 2 facets per item to match the existing chip weight. 1 or 3 is legal where honest.

- [ ] **Step 1: Apply the classification**

Use this mapping verbatim — it was derived item-by-item from each card's title and one-liner:

```
01 landing,portfolio        -> editorial, dense
02 docs                     -> editorial, dense
03 sidebar app              -> dashboard, dense
04 three-pane               -> dense, keyboard-driven
23 bento                    -> dashboard, gallery
25 accordion                -> editorial, dense
26 bottom-sheet             -> mobile, geospatial
31 tabbed workspace         -> dense, keyboard-driven
32 mobile tab-bar           -> mobile, dense
06 infinite canvas          -> hierarchy, playful
07 zettelkasten             -> hierarchy, editorial
08 radial orbit             -> hierarchy, playful
09 map-pinned               -> geospatial, gallery
27 elevator floors          -> playful, animated
28 arrow rooms              -> playful, keyboard-driven
33 folder column-view       -> hierarchy, dense
34 isometric scene          -> playful, animated
35 mind-map tree            -> hierarchy, playful
64 globe                    -> geospatial, animated
05 scrollytelling           -> narrative, animated
10 timeline scrubber        -> time, narrative
11 filmstrip                -> gallery, animated
12 sticky-stack             -> narrative, editorial
36 dial picker              -> mobile, playful
37 stepper                  -> narrative, commerce
38 page-turn book           -> gallery, editorial
39 story tap-through        -> mobile, narrative
40 carousel                 -> gallery, animated
13 command palette          -> keyboard-driven, dense
14 terminal                 -> keyboard-driven, playful
15 chat-first               -> conversational, narrative
41 conversational form      -> conversational, narrative
42 notebook cells           -> keyboard-driven, dense
43 keyboard inbox           -> keyboard-driven, dense
44 slash editor             -> keyboard-driven, editorial
45 filter search            -> keyboard-driven, dense
46 voice assistant          -> conversational, mobile
16 desktop OS               -> playful, animated
17 card-deck swipe          -> mobile, gallery
18 pinboard                 -> gallery, playful
19 split-flap board         -> animated, ranking
24 cover flow               -> gallery, animated
47 kanban                   -> dense, playful
48 masonry gallery          -> gallery, editorial
49 card wallet              -> mobile, commerce
50 data table               -> dense, ranking
65 ticker board             -> ranking, animated
20 z-axis fly-through       -> animated, narrative
21 grid-to-detail morph     -> gallery, animated
22 poster full-bleed        -> editorial, gallery
29 marquee index            -> editorial, animated
30 spotlight scroll         -> animated, playful
56 parallax hero            -> animated, editorial
57 diagonal editorial       -> editorial, animated
58 starfield hero           -> animated, editorial
59 cursor-mask reveal       -> before/after, animated
66 kpi slide                -> dashboard, narrative
67 steps slide              -> narrative, editorial
68 quadrant matrix          -> ranking, narrative
69 versus slide             -> before/after, narrative
70 roadmap slide            -> time, narrative
71 title dividers           -> editorial, narrative
51 shop chat                -> conversational, commerce
52 checkout journey         -> commerce, narrative
53 agent trace              -> conversational, narrative
54 agent handoff            -> conversational, narrative
55 chatgpt commerce         -> conversational, commerce
60 chatgpt mobile           -> mobile, commerce
61 agent canvas             -> conversational, gallery
62 approval queue           -> conversational, dense
63 comparison-in-chat       -> conversational, before/after
i01 grouped bars            -> before/after, ranking
i02 slope                   -> before/after, ranking
i03 dumbbell                -> before/after, ranking
i04 band line               -> time, dashboard
i05 streamgraph             -> time, animated
i06 bump                    -> time, ranking
i07 waffle                  -> dense, editorial
i08 treemap                 -> hierarchy, dense
i09 stacked leader          -> editorial, dense
i10 histogram               -> dense, editorial
i11 ridgeline               -> dense, editorial
i12 beeswarm                -> dense, editorial
i13 scatter trend           -> dense, editorial
i14 bubble quadrant         -> ranking, dense
i15 connected scatter       -> time, dense
i16 ordered bars            -> ranking, dense
i17 lollipop                -> ranking, dense
i18 league table            -> ranking, dense
i19 sankey                  -> hierarchy, dense
i20 funnel                  -> narrative, dense
i21 chord                   -> hierarchy, dense
i22 radial tree             -> hierarchy, dense
i23 network graph           -> hierarchy, dense
i24 icicle                  -> hierarchy, dense
i25 calendar heatmap        -> time, dense
i26 matrix heatmap          -> dense, ranking
i27 sparkline table         -> dense, time
i28 tile cartogram          -> geospatial, dense
i29 symbol map              -> geospatial, dense
i30 flow map                -> geospatial, animated
i31 icon array              -> editorial, dense
i32 area shapes             -> editorial, dense
i33 big number              -> narrative, editorial
i34 kpi dashboard           -> dashboard, dense
i35 small multiples         -> dashboard, dense
i36 narrative dashboard     -> dashboard, narrative
```

- [ ] **Step 2: Verify every facet clears R12's ≥2-category bar**

Run:

```bash
node -e "
const c=JSON.parse(require('fs').readFileSync('catalog.json','utf8'));
const s=new Map();
for(const i of c.items) for(const f of i.facets||[]){ if(!s.has(f))s.set(f,new Set()); s.get(f).add(i.category); }
const v=JSON.parse(require('fs').readFileSync('tools/canon/facets.json','utf8')).facets;
for(const {key} of v) console.log(String((s.get(key)||new Set()).size).padStart(2), String([...c.items].filter(i=>(i.facets||[]).includes(key)).length).padStart(3), key);
console.log('items with 0 facets:', c.items.filter(i=>!(i.facets||[]).length).length);
"
```

Expected: every facet shows a category span ≥2 and a count ≥1; `items with 0 facets: 0`.

- [ ] **Step 3: Run the checker**

Run: `node tools/check.mjs`
Expected: exit 0, `R12: 0`, TOTAL 0 violations.

- [ ] **Step 4: Run the full suite**

Run: `node --test --test-concurrency=1 tools/test/*.test.mjs`
Expected: PASS, 49/49.

- [ ] **Step 5: Commit**

```bash
git add catalog.json
git commit -m "feat(catalog): classify all 107 items against the facet vocabulary

R12 now green: every item carries 2 facets, every facet spans >=2 categories."
```

---

### Task 4: Cards carry facets

**Files:**
- Modify: `tools/build.mjs` — `buildAssetCard` (~line 275 after Task 1's edits)
- Test: `tools/test/build.test.mjs`

**Interfaces:**
- Consumes: `item.facets` from Task 3.
- Produces: every `.asset-card` carries `data-facets="<space-separated>"`, and its chip row renders facets as `<span class="wb-chip" data-facet="…">`. Task 6's JS reads both.

- [ ] **Step 1: Write the failing test**

Append to `tools/test/build.test.mjs`:

```js
test('(g) cards carry data-facets and render facet chips, not flavour tags', () => {
  const index = readFileSync(INDEX_PATH, 'utf8');

  const cards = [...index.matchAll(/<a class="wb-card asset-card" href="([^"]+)"[^>]*data-facets="([^"]*)"/g)];
  assert.equal(cards.length, 107, `expected 107 cards with data-facets, found ${cards.length}`);

  const byFile = new Map(catalog.items.map((it) => [it.file, it]));
  for (const [, href, facets] of cards) {
    const item = byFile.get(href);
    assert.ok(item, `card href "${href}" is not in catalog.json`);
    assert.equal(facets, item.facets.join(' '), `data-facets mismatch for ${item.id}`);
  }

  // Chip row is facets now. Pick an item whose facets and tags differ.
  const sample = catalog.items.find((it) => it.facets.join() !== it.tags.join());
  assert.ok(sample, 'expected at least one item whose facets differ from its tags');
  for (const f of sample.facets) {
    assert.ok(
      index.includes(`<span class="wb-chip" data-facet="${f}">${f}</span>`),
      `expected a facet chip for "${f}"`
    );
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tools/test/build.test.mjs`
Expected: FAIL — `expected 107 cards with data-facets, found 0`.

- [ ] **Step 3: Implement**

Replace `buildAssetCard` in `tools/build.mjs`:

```js
// Card markup for one catalog item. `oneliner` carries intentional inline
// HTML (e.g. `<b>`) and must NOT be escaped; `title` and facets are plain
// text and are escaped defensively. `thumb` is byte-verbatim from
// catalog.json — emitting it unchanged inside the shared thumbnail-CSS
// context is what keeps all 107 thumbnails pixel-identical to the old
// gallery.
//
// The chip row renders FACETS, not `tags`: the chips double as the filter's
// legend, so clicking `mobile` on a card and clicking `mobile` in the bar
// must mean the same thing. Flavour `tags` stay in catalog.json and the
// README. Chips are <span>, never <button> — the whole card is an <a>, and
// a button inside an anchor is invalid HTML.
function buildAssetCard(item) {
  const chips = item.facets
    .map((f) => `<span class="wb-chip" data-facet="${escapeHtml(f)}">${escapeHtml(f)}</span>`)
    .join('');
  return (
    `<a class="wb-card asset-card" href="${item.file}" style="--accent:${item.accent}"` +
    ` data-facets="${escapeHtml(item.facets.join(' '))}">` +
    `<div class="thumb">${item.thumb}</div>` +
    `<div class="b"><p class="n">${escapeHtml(item.id)}</p>` +
    `<h3>${escapeHtml(item.title)}</h3>` +
    `<p class="nav">${item.oneliner}</p>` +
    `<div class="tags">${chips}</div></div></a>`
  );
}
```

- [ ] **Step 4: Rebuild and run the suite**

Run: `node tools/build.mjs && node --test --test-concurrency=1 tools/test/*.test.mjs`
Expected: PASS, 50/50.

- [ ] **Step 5: Verify idempotence and the checker**

Run: `node tools/build.mjs && git diff --stat index.html && node tools/check.mjs`
Expected: the second build adds no further change; checker exit 0.

- [ ] **Step 6: Commit**

```bash
git add tools/build.mjs tools/test/build.test.mjs index.html
git commit -m "feat(build): cards carry data-facets and render facet chips"
```

---

### Task 5: Generate the facet bar

**Files:**
- Modify: `tools/build.mjs` — new `buildFacetBar`, wire into `buildRegions`
- Modify: `index.html` — insert the marker pair after the hero (~line 1247)
- Modify: `tools/check.mjs` — add the bar to `STATIC_EXPECTED_MARKERS` (line ~250)
- Test: `tools/test/build.test.mjs`

**Interfaces:**
- Consumes: `CANON_FACETS` (Task 1), `item.facets` (Task 3).
- Produces: `<!-- gen:facet-bar start -->…<!-- gen:facet-bar end -->` in `index.html` containing 17 buttons (1 "All" + 16 facets), each `.facet-chip[data-facet]` with `aria-pressed`. Task 6's JS binds to them.

- [ ] **Step 1: Write the failing test**

Append to `tools/test/build.test.mjs`:

```js
test('(h) facet bar: All chip + one chip per vocabulary facet, counts true to catalog', () => {
  const index = readFileSync(INDEX_PATH, 'utf8');
  const region = index.match(
    /<!-- gen:facet-bar start -->\n([\s\S]*?)\n<!-- gen:facet-bar end -->/
  );
  assert.ok(region, 'gen:facet-bar region not found in index.html');

  const chips = [...region[1].matchAll(/data-facet="([^"]*)"[^>]*>([\s\S]*?)<\/button>/g)];
  assert.equal(chips.length, CANON_FACETS.length + 1, 'expected 16 facet chips plus the All chip');

  assert.equal(chips[0][1], '', 'the first chip must be the All chip (empty data-facet)');
  assert.ok(chips[0][2].includes('107'), 'the All chip must show the total');

  const counts = new Map();
  for (const it of catalog.items) for (const f of it.facets) counts.set(f, (counts.get(f) || 0) + 1);

  for (let i = 0; i < CANON_FACETS.length; i++) {
    const facet = CANON_FACETS[i];
    const [, key, body] = chips[i + 1];
    assert.equal(key, facet.key, `chip ${i + 1} out of vocabulary order`);
    assert.ok(
      body.includes(`>${counts.get(facet.key)}<`),
      `chip "${facet.key}" must show its true count of ${counts.get(facet.key)}`
    );
  }

  // Every chip is a real button with a pressed state — the accessible route.
  assert.equal((region[1].match(/<button /g) || []).length, CANON_FACETS.length + 1);
  assert.equal((region[1].match(/aria-pressed=/g) || []).length, CANON_FACETS.length + 1);
});
```

Add `CANON_FACETS` to that file's imports.

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tools/test/build.test.mjs`
Expected: FAIL — `gen:facet-bar region not found in index.html`.

- [ ] **Step 3: Insert the marker pair into index.html**

In `index.html`, directly after the closing `</div>` of `.hero` (~line 1247) and before `<section class="cat-section" id="cat-foundations">`, insert:

```html
      <div class="facet-bar" id="facet-bar" role="group" aria-label="Filter scaffolds by facet">
<!-- gen:facet-bar start -->
<!-- gen:facet-bar end -->
      </div>
      <p class="facet-status" id="filter-status" role="status" aria-live="polite">107 scaffolds</p>
```

- [ ] **Step 4: Implement the generator**

In `tools/build.mjs`, add the import at the top:

```js
import { CANON_FACETS } from './lib/scaffolds.mjs';
```

Add, after `buildAssetCard`:

```js
// The filter bar. Counts are STATIC — the number of items carrying each facet,
// not a live "how many would this add" figure. Selection is OR, so live counts
// would shift as chips toggle and stop meaning anything stable. These are real
// <button>s: they are the keyboard-accessible route to filtering, because the
// card chips (spans inside an <a>) cannot be focusable without nesting
// interactive elements.
function buildFacetBar(catalog) {
  const counts = new Map();
  for (const item of catalog.items) {
    for (const facet of item.facets) counts.set(facet, (counts.get(facet) || 0) + 1);
  }

  const all =
    `<button type="button" class="wb-chip facet-chip" data-facet="" aria-pressed="true">` +
    `All <span class="facet-n">${catalog.items.length}</span></button>`;

  const chips = CANON_FACETS.map(
    ({ key, label, blurb }) =>
      `<button type="button" class="wb-chip facet-chip" data-facet="${escapeHtml(key)}"` +
      ` aria-pressed="false" title="${escapeHtml(blurb)}">` +
      `${escapeHtml(label)} <span class="facet-n">${counts.get(key) || 0}</span></button>`
  );

  return [all, ...chips].join('\n');
}
```

Wire it into `buildRegions`, immediately before the per-category loop:

```js
  let indexOut = replaceRegion(indexSrc, 'facet-bar', 'html', buildFacetBar(catalog));
  for (const cat of catalog.categories) {
    indexOut = replaceRegion(indexOut, `index-cards:${cat.key}`, 'html', buildIndexCardsRegion(catalog, cat.key));
  }
```

(Note the changed initialiser — it was `let indexOut = indexSrc;`.)

- [ ] **Step 5: Register the marker with R10**

In `tools/check.mjs`, add to `STATIC_EXPECTED_MARKERS`:

```js
  { file: 'index.html', name: 'facet-bar', kind: 'html' },
```

- [ ] **Step 6: Update the synthetic test root — REQUIRED, the suite crashes without it**

`buildRegions` now calls `replaceRegion(indexSrc, 'facet-bar', …)`, and `replaceRegion` **throws** when it cannot find exactly one marker pair. R11's tests call `checkInSync` → `buildRegions` against `makeSyntheticRoot()`, whose `index.html` has no facet-bar markers. Without this step those tests die with an uncaught `replaceRegion: expected exactly one "<!-- gen:facet-bar start -->", found 0` — a crash, not a clean failure.

In `tools/test/check.test.mjs`, inside `makeSyntheticRoot()` (~line 211), add the marker pair to the synthetic `index.html` array, directly after `'<html><body>'`:

```js
      '<!-- gen:facet-bar start -->',
      'STALE FACET BAR',
      '<!-- gen:facet-bar end -->',
```

NOTE: the synthetic catalog's 2 items already gained `facets: ['mobile','dense']` during **Task 4** — `buildAssetCard` reads `item.facets` and crashed the R11 tests without it. That half of this fixture work is already done; only the marker pair above remains.

- [ ] **Step 7: Rebuild, then run everything**

Run: `node tools/build.mjs && node --test --test-concurrency=1 tools/test/*.test.mjs && node tools/check.mjs`
Expected: 51/51 tests pass; checker exit 0, `R10: 0`, `R12: 0`.

- [ ] **Step 8: Commit**

```bash
git add tools/build.mjs tools/check.mjs tools/test/build.test.mjs tools/test/check.test.mjs index.html
git commit -m "feat(build): generate the facet filter bar into index.html"
```

---

### Task 6: Filter behaviour

**Files:**
- Modify: `index.html` — project CSS block (below the wb-base-ui `<style>`, near `.asset-card` ~line 1180) and the foot `<script>` (~line 1548)

**Interfaces:**
- Consumes: `#facet-bar` and `.facet-chip[data-facet]` (Task 5), `.asset-card[data-facets]` and `.wb-chip[data-facet]` (Task 4), the existing `.cat-section[id]` and `.wl-nav__item[href="#…"]`.

- [ ] **Step 1: Add the CSS**

In `index.html`, in the project's own CSS (NOT inside the wb-base-ui block), next to the `.asset-card` rules:

```css
/* Filter bar. .wb-chip and its [aria-pressed="true"] state come from the
   immutable wb-base-ui component layer — only layout and the count badge
   are added here. */
.facet-bar{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.facet-chip{cursor:pointer;font:inherit;font-size:var(--wb-text-xs)}
.facet-n{opacity:.55;font-variant-numeric:tabular-nums;margin-left:2px}
.facet-status{margin:0 0 28px;color:var(--wb-color-text-muted);font-size:var(--wb-text-xs)}
.asset-card .wb-chip{cursor:pointer}

/* .asset-card is display:flex and .cat-section is a block with margin, so the
   `hidden` attribute alone does NOT hide either — the class rules win on
   specificity. This restores what `hidden` is supposed to mean. */
.asset-card[hidden],.cat-section[hidden]{display:none !important}

/* A rail entry whose section has no matches: dimmed, never removed —
   removing it would make the rail jump as chips toggle. */
.wl-nav__item.is-muted{opacity:.35}
```

- [ ] **Step 2: Add the behaviour**

Append inside the existing foot `<script>`, after the nav drawer IIFE:

```js
/* ---- facet filtering -------------------------------------------------
   OR across selected chips: with ~2 facets per item, AND is empty almost
   every time. No selection = everything. Cards stay under their category
   heading rather than flattening into one grid, because seeing WHERE a
   facet turns up is the cross-cutting answer the bar exists to give. */
(function () {
  var bar = document.getElementById('facet-bar');
  var status = document.getElementById('filter-status');
  if (!bar || !status) return;

  var cards = [].slice.call(document.querySelectorAll('.asset-card'));
  var sections = [].slice.call(document.querySelectorAll('.cat-section'));
  var chips = [].slice.call(bar.querySelectorAll('.facet-chip'));
  var active = Object.create(null);

  function activeKeys() { return Object.keys(active); }

  function apply() {
    var keys = activeKeys();
    cards.forEach(function (card) {
      var own = (card.getAttribute('data-facets') || '').split(' ');
      var show = keys.length === 0 || own.some(function (f) { return active[f]; });
      card.hidden = !show;
    });

    var shown = 0;
    sections.forEach(function (sec) {
      var n = sec.querySelectorAll('.asset-card:not([hidden])').length;
      sec.hidden = n === 0;
      shown += n;
      var railItem = document.querySelector('.wl-nav__item[href="#' + sec.id + '"]');
      if (railItem) railItem.classList.toggle('is-muted', n === 0);
    });

    chips.forEach(function (chip) {
      var key = chip.getAttribute('data-facet');
      chip.setAttribute('aria-pressed', key === '' ? String(keys.length === 0) : String(!!active[key]));
    });

    status.textContent = keys.length === 0
      ? cards.length + ' scaffolds'
      : shown + ' of ' + cards.length + ' — ' + keys.join(' or ');

    /* file:// forbids replaceState in some Chrome builds; the filter must
       keep working there, so a failure here is swallowed by design. */
    try {
      var q = keys.join(',');
      history.replaceState(null, '', location.pathname + (q ? '?f=' + encodeURIComponent(q) : '') + location.hash);
    } catch (e) { /* no-op on file:// */ }
  }

  function toggle(key) {
    if (!key) { active = Object.create(null); }
    else if (active[key]) { delete active[key]; }
    else { active[key] = true; }
    apply();
  }

  bar.addEventListener('click', function (e) {
    var chip = e.target.closest && e.target.closest('.facet-chip');
    if (chip) toggle(chip.getAttribute('data-facet'));
  });

  /* Card chips are <span>s inside an <a> — they cannot be buttons without
     nesting interactive elements. Intercept the click before the anchor
     navigates. Mouse-only by design; the bar above is the keyboard route. */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest && e.target.closest('.asset-card .wb-chip[data-facet]');
    if (!chip) return;
    e.preventDefault();
    toggle(chip.getAttribute('data-facet'));
    bar.scrollIntoView({ block: 'nearest' });
  });

  var known = {};
  chips.forEach(function (c) { known[c.getAttribute('data-facet')] = true; });
  var initial = new URLSearchParams(location.search).get('f');
  if (initial) {
    initial.split(',').forEach(function (k) { if (k && known[k]) active[k] = true; });
  }
  apply();
})();
```

- [ ] **Step 3: Serve and verify in the browser**

Run: `python3 -m http.server 8800` then drive `http://localhost:8800/index.html` with Playwright MCP. (If "Browser is already in use": `pkill -f ms-playwright-mcp`.)

Verify every one of these, and record the observed number for each:

1. Click `mobile` → visible-card count equals the chip's stated count; only sections containing matches remain; rail entries for empty sections are dimmed.
2. Click `playful` as well → count equals the **union**, not the intersection, and is ≥ each individual count.
3. Click `All` → all 107 return, all sections visible, no rail item dimmed.
4. Click a facet chip **on a card** → filters by it and does NOT navigate to the scaffold.
5. Reload with `?f=mobile,gallery` → both chips restore pressed and the grid matches.
6. Drive all 16 chips one at a time, asserting visible count == stated count each time.
7. Resize to 400px → chips wrap, nothing overflows horizontally.
8. Console is clean throughout.

- [ ] **Step 4: Verify it works from `file://`**

Open `index.html` directly via `open index.html`. Confirm filtering still works and the console shows no uncaught error (the `replaceState` try/catch is what makes this pass). The URL will simply not update — that is expected and acceptable.

- [ ] **Step 5: Full gates**

Run: `node --test --test-concurrency=1 tools/test/*.test.mjs && node tools/check.mjs && node tools/build.mjs && git diff --stat`
Expected: tests pass; checker exit 0; build idempotent (no diff from the rebuild).

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(index): OR facet filtering with section preservation and URL state"
```

---

### Task 7: Visual gate, README, final verification

**Files:**
- Modify: `README.md`
- Modify: `index.html` (only if the visual pass finds something)

**Note for the orchestrator:** per the Task 8 precedent, the implementer skips the visual pass; the ORCHESTRATOR runs `avoid-visual-ai-tells` and commits any fixes separately with reasons annotated inline.

- [ ] **Step 1: Document the vocabulary in README.md**

Add a short section after the layout catalog explaining that facets are a closed 16-value vocabulary in `tools/canon/facets.json`, that every item carries ≥1, that R12 enforces both the closed set and the ≥2-category span, and that `index.html?f=mobile` links a pre-filtered view. Keep it to a paragraph plus the 16-value list — the README is a contract, not a tutorial.

- [ ] **Step 2: Run the visual gate**

Invoke the `avoid-visual-ai-tells` skill against the new bar chrome. Compare against `git show HEAD~1:index.html` — the Task 8 lesson was that drift is only visible when diffed against the file being replaced, not judged on taste alone. Keep any flagged pattern that is deliberate, annotating the reason inline; revert unintended drift.

- [ ] **Step 3: Tool-call-leak grep**

Run: `grep -nE '</content>|</invoke>|antml' index.html README.md catalog.json tools/build.mjs tools/check.mjs tools/canon/facets.json`
Expected: no output. Confirm `index.html` still ends at `</html>`.

- [ ] **Step 4: Final gates**

Run: `node --test --test-concurrency=1 tools/test/*.test.mjs && node tools/check.mjs && node tools/build.mjs && git status --short`
Expected: all tests pass; checker exit 0 / 0 violations across 107; tree clean after the rebuild.

- [ ] **Step 5: Commit**

```bash
git add README.md index.html
git commit -m "docs(readme): document the facet vocabulary and R12 enforcement"
```

---

## Self-review notes

Spec coverage checked section by section: vocabulary → Task 1; `catalog.json` facets → Task 3; generator regions → Tasks 4–5; R12 (all four assertions) → Task 2; behaviour incl. OR, section preservation, rail muting, All reset, URL state, 400px, a11y → Task 6; verification incl. all-16-chip drive and the visual pass → Tasks 6–7; README → Task 7.

Two spec statements were corrected here because the code contradicted them:

- The spec said card chips become "buttons". They cannot — the card is an `<a>`. They stay `<span>`s with a delegated `preventDefault` listener, and the accessibility consequence is stated rather than hidden.
- The spec did not anticipate that `.asset-card{display:flex}` defeats the `hidden` attribute. Task 6 adds the explicit rule.

### The Task 3 classification was validated before this plan was committed

The mapping was run against `catalog.json` and R12's logic. Result: all 107 items mapped, no id missing, no id invented, no out-of-vocabulary value, and **all 16 facets clear the ≥2-category bar**. Observed span / count per facet:

| facet | categories | items | | facet | categories | items |
|---|---|---|---|---|---|---|
| `dense` | 15 | 42 | | `hierarchy` | 4 | 11 |
| `editorial` | 11 | 24 | | `dashboard` | 4 | 7 |
| `narrative` | 8 | 20 | | `before/after` | 4 | 6 |
| `ranking` | 7 | 13 | | `keyboard-driven` | 3 | 9 |
| `animated` | 6 | 20 | | `geospatial` | 3 | 6 |
| `gallery` | 6 | 12 | | `commerce` | 3 | 6 |
| `mobile` | 5 | 8 | | `conversational` | 2 | 10 |
| `playful` | 5 | 12 | | `time` | 5 | 8 |

Two findings from that run that change how the plan should be read:

1. **`dense` is too broad to be a good filter — 42 of 107 items, 39% of the library.** It passes R12 (the rule only tests span, not discrimination), but a chip returning 39% of everything barely narrows anything. It became the default landing spot for charts that resisted the other 15. Warren should decide whether to (a) ship it as-is, (b) split it into something sharper like `tabular` vs `statistical`, or (c) drop it and let those items lean on their second facet. **Not a blocker — flag it at the Task 3 review gate, since that is when the classification is in front of a reviewer anyway.**
2. **`commerce` is stronger than the spec feared.** The spec called it ~70% collinear with Agentic commerce and marked it cuttable. Measured, it spans 3 categories (`37` Sequence, `49` Objects, plus Agentic) with 6 items. It earns its place; the spec's pessimism was wrong and should not drive a cut.

Deliberately deferred: nothing else. `commerce` stays on the evidence above.
