import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { build } from '../build.mjs';
import { CANON_FACETS } from '../lib/scaffolds.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const README_PATH = path.join(ROOT, 'README.md');
const CHOOSER_PATH = path.join(ROOT, 'info-design', 'chooser.html');
const INDEX_PATH = path.join(ROOT, 'index.html');
const CATALOG_PATH = path.join(ROOT, 'catalog.json');

// Run the generator once up front so every test below sees the regenerated,
// in-sync files (mirrors `node tools/build.mjs && node --test ...`).
build(ROOT);

const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));

// Same slice-and-eval technique as tools/migrate/extract-catalog.mjs.
function extractChooserCatalog(chooserHtml) {
  const marker = 'CATALOG = ';
  const start = chooserHtml.indexOf(marker);
  if (start === -1) throw new Error('CATALOG marker not found in chooser.html');
  const arrayStart = start + marker.length;
  const arrayEnd = chooserHtml.indexOf('];', arrayStart);
  if (arrayEnd === -1) throw new Error('closing "];" not found after CATALOG in chooser.html');
  const literal = chooserHtml.slice(arrayStart, arrayEnd + 1);
  return new Function('return ' + literal)();
}

test('(a) chooser fidelity: regenerated CATALOG deep-equals catalog.json info-design items', () => {
  const chooserHtml = readFileSync(CHOOSER_PATH, 'utf8');
  const actual = extractChooserCatalog(chooserHtml);

  const expected = catalog.items
    .filter((it) => it.group === 'info-design')
    .map((it) => ({
      id: it.id,
      // Restated literally rather than imported from build.mjs, so this stays
      // an independent check of the emitted format, not a tautology.
      title: it.alias ? `${it.title} (${it.alias})` : it.title,
      cat: it.chooserCat,
      href: path.basename(it.file),
      shape: it.shape,
      verbs: it.verbs,
      when: it.when,
    }));

  assert.deepEqual(actual, expected);
});

test('(b) README counts: 71 layout ids, 36 info-design table rows', () => {
  const readme = readFileSync(README_PATH, 'utf8');

  // Some categories carry a hand-authored annotation blockquote (see
  // LAYOUT_CATEGORY_ANNOTATIONS in build.mjs) that cross-references entry
  // ids in prose (e.g. "`60` reuses `55`'s flow") — dedupe by id so those
  // mentions don't inflate the count past the true entry total.
  const layoutRegion = readme.match(
    /<!-- gen:readme-layout-catalog start -->\n([\s\S]*?)\n<!-- gen:readme-layout-catalog end -->/
  )[1];
  const layoutIds = new Set((layoutRegion.match(/`\d{2}`/g) || []));
  assert.equal(layoutIds.size, 71);

  const infoRegion = readme.match(
    /<!-- gen:readme-info-catalog start -->\n([\s\S]*?)\n<!-- gen:readme-info-catalog end -->/
  )[1];
  const infoRows = infoRegion.split('\n').filter((line) => line.startsWith('| `i'));
  assert.equal(infoRows.length, 36);
});

test('(c) idempotence: a second build produces byte-identical files', () => {
  const before = {
    readme: readFileSync(README_PATH, 'utf8'),
    chooser: readFileSync(CHOOSER_PATH, 'utf8'),
    index: readFileSync(INDEX_PATH, 'utf8'),
    catalog: readFileSync(CATALOG_PATH, 'utf8'),
  };

  build(ROOT);

  const after = {
    readme: readFileSync(README_PATH, 'utf8'),
    chooser: readFileSync(CHOOSER_PATH, 'utf8'),
    index: readFileSync(INDEX_PATH, 'utf8'),
    catalog: readFileSync(CATALOG_PATH, 'utf8'),
  };

  assert.equal(after.readme, before.readme, 'README.md changed on a second build');
  assert.equal(after.chooser, before.chooser, 'chooser.html changed on a second build');
  assert.equal(after.index, before.index, 'index.html changed on a second build');
  assert.equal(after.catalog, before.catalog, 'catalog.json must never be written by build.mjs');
});

test('(d) markers intact: README x2, chooser x1, and one index-cards pair per catalog category', () => {
  const readme = readFileSync(README_PATH, 'utf8');
  const chooser = readFileSync(CHOOSER_PATH, 'utf8');
  const index = readFileSync(INDEX_PATH, 'utf8');

  function countOf(text, needle) {
    return (text.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  }

  assert.equal(countOf(readme, '<!-- gen:readme-layout-catalog start -->'), 1);
  assert.equal(countOf(readme, '<!-- gen:readme-layout-catalog end -->'), 1);
  assert.equal(countOf(readme, '<!-- gen:readme-info-catalog start -->'), 1);
  assert.equal(countOf(readme, '<!-- gen:readme-info-catalog end -->'), 1);
  assert.equal(countOf(readme, '<!-- gen:readme-facets start -->'), 1);
  assert.equal(countOf(readme, '<!-- gen:readme-facets end -->'), 1);
  assert.equal(countOf(chooser, '// gen:chooser-catalog start'), 1);
  assert.equal(countOf(chooser, '// gen:chooser-catalog end'), 1);

  // index.html carries one marker pair per catalog category — derive the
  // expected keys from catalog.json itself rather than hardcoding the count,
  // so this test doesn't go stale if a category is added or removed.
  assert.ok(catalog.categories.length > 0, 'catalog.json has no categories to derive marker keys from');
  for (const cat of catalog.categories) {
    assert.equal(
      countOf(index, `<!-- gen:index-cards:${cat.key} start -->`),
      1,
      `expected exactly one index-cards:${cat.key} start marker`
    );
    assert.equal(
      countOf(index, `<!-- gen:index-cards:${cat.key} end -->`),
      1,
      `expected exactly one index-cards:${cat.key} end marker`
    );
  }
});

test('(e) index.html cards: exactly 107 asset-card links, each href resolving to a file on disk', () => {
  const index = readFileSync(INDEX_PATH, 'utf8');
  const hrefs = [...index.matchAll(/<a class="wb-card asset-card" href="([^"]+)"/g)].map((m) => m[1]);

  assert.equal(hrefs.length, 107, `expected 107 asset-card links, found ${hrefs.length}`);

  for (const href of hrefs) {
    assert.ok(existsSync(path.join(ROOT, href)), `asset-card href "${href}" does not exist on disk`);
  }
});

test('(f) title aliases: surface in README + chooser, never in an index card heading', () => {
  // Aliases ("Cover Flow (3D)", "Ridgeline (joyplot)") are prose embellishments
  // for the catalog listings. The index card <h3> deliberately stays the plain
  // title — it always was, and one alias is long enough to wreck a heading.
  const aliased = catalog.items.filter((it) => it.alias);
  assert.ok(aliased.length > 0, 'catalog.json has no aliased items, so this test would pass vacuously');

  const readme = readFileSync(README_PATH, 'utf8');
  const chooser = readFileSync(CHOOSER_PATH, 'utf8');
  const index = readFileSync(INDEX_PATH, 'utf8');

  for (const it of aliased) {
    const display = `${it.title} (${it.alias})`;

    assert.ok(readme.includes(display), `README is missing aliased title "${display}"`);

    if (it.group === 'info-design') {
      assert.ok(chooser.includes(`title:'${display}'`), `chooser CATALOG is missing "${display}"`);
    }

    assert.ok(
      index.includes(`<h3>${it.title}</h3>`),
      `index card heading for ${it.id} should be the plain title "${it.title}"`
    );
    assert.ok(
      !index.includes(`<h3>${display}</h3>`),
      `index card heading for ${it.id} must not carry the alias`
    );
  }
});

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

test('(f2) rail <-> category parity: rail links, .cat-section ids, and catalog.categories all agree', () => {
  // The left rail links, the <h2> headings, and the .intro paragraphs in
  // index.html are hand-written; only the card regions are generated. A
  // category added to catalog.json without a matching rail link/section
  // would render a section that never mutes and has no rail entry, with
  // every other gate green — the facet JS's `if (railItem)` silently no-ops
  // on the mismatch. Guard the three-way parity directly.
  const index = readFileSync(INDEX_PATH, 'utf8');

  const expected = new Set(catalog.categories.map((c) => `cat-${c.key}`));
  assert.ok(expected.size > 0, 'catalog.json has no categories to derive expected ids from');

  const sectionIds = new Set(
    [...index.matchAll(/<section class="cat-section" id="([^"]+)"/g)].map((m) => m[1])
  );
  const railHrefs = new Set(
    [...index.matchAll(/<a class="wl-nav__item" href="#(cat-[^"]+)"/g)].map((m) => m[1])
  );

  assert.deepEqual(sectionIds, expected, '.cat-section ids must exactly match catalog.categories');
  assert.deepEqual(railHrefs, expected, 'rail hrefs must exactly match catalog.categories');
});

test('(g2) README facet list: one entry per vocabulary facet, in CANON_FACETS order', () => {
  const readme = readFileSync(README_PATH, 'utf8');
  const region = readme.match(
    /<!-- gen:readme-facets start -->\n([\s\S]*?)\n<!-- gen:readme-facets end -->/
  );
  assert.ok(region, 'gen:readme-facets region not found in README.md');

  const lines = region[1].split('\n').filter((l) => l.trim() !== '');
  assert.equal(lines.length, CANON_FACETS.length, 'README facet list length must match the vocabulary');

  for (let i = 0; i < CANON_FACETS.length; i++) {
    const { key, blurb } = CANON_FACETS[i];
    assert.equal(lines[i], `- \`${key}\` — ${blurb}`, `README facet line ${i} mismatch for "${key}"`);
  }
});

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
