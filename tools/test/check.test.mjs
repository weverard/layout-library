import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

import { checkContent, REPO_RULES } from '../check.mjs';
import { listScaffolds } from '../lib/scaffolds.mjs';
import { build } from '../build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures');
const REPO_ROOT = path.resolve(__dirname, '..', '..');

function readFixture(name) {
  return readFileSync(path.join(FIXTURES, name), 'utf8');
}

function ruleR10(ctx) {
  const [r10] = REPO_RULES;
  return r10(ctx);
}

function ruleR11(ctx) {
  const [, r11] = REPO_RULES;
  return r11(ctx);
}

function ruleR12(ctx) {
  const [, , r12] = REPO_RULES;
  return r12(ctx);
}

test('good-layout.html fixture: zero violations', () => {
  const html = readFixture('good-layout.html');
  // Virtual filename satisfying R8 independently of the fixture's real
  // on-disk name (which is deliberately shared across good/bad fixtures).
  const violations = checkContent(html, { file: '01-good-layout.html', group: 'layouts' });
  assert.deepEqual(violations, []);
});

test('bad-layout.html fixture: violations are exactly R3, R4, R9', () => {
  const html = readFixture('bad-layout.html');
  const violations = checkContent(html, { file: '02-bad-layout.html', group: 'layouts' });
  const rules = violations.map((v) => v.rule).sort();
  assert.deepEqual(rules, ['R3', 'R4', 'R9']);
  // every violation is well-formed
  for (const v of violations) {
    assert.equal(typeof v.rule, 'string');
    assert.equal(v.file, '02-bad-layout.html');
    assert.equal(typeof v.detail, 'string');
    assert.ok(v.detail.length > 0);
  }
});

test('R3 violation detail flags the --surface/--bg reorder', () => {
  const html = readFixture('bad-layout.html');
  const violations = checkContent(html, { file: '02-bad-layout.html', group: 'layouts' });
  const r3 = violations.find((v) => v.rule === 'R3');
  assert.ok(r3, 'expected an R3 violation');
  assert.match(r3.detail, /token names\/order mismatch/);
});

test('R4 violation flags the modified hideChip body', () => {
  const html = readFixture('bad-layout.html');
  const violations = checkContent(html, { file: '02-bad-layout.html', group: 'layouts' });
  const r4 = violations.find((v) => v.rule === 'R4');
  assert.ok(r4, 'expected an R4 violation');
  assert.match(r4.detail, /hideChip/);
});

test('R9 violation flags the trailing tool-call-leak artifact', () => {
  const html = readFixture('bad-layout.html');
  const violations = checkContent(html, { file: '02-bad-layout.html', group: 'layouts' });
  const r9 = violations.find((v) => v.rule === 'R9');
  assert.ok(r9, 'expected an R9 violation');
});

// Build a minimal-but-R1-9-conforming layout scaffold around a custom reset
// line, so we can assert R2's tolerance in isolation (no R2 finding means R2
// accepted the reset; any other rule is irrelevant to this test).
function scaffoldWithReset(resetLine) {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<title>01 · R2 Probe — Layout scaffold</title>',
    '<!--',
    '  PATTERN    R2 Probe',
    '  NAV MODEL  Probe.',
    '  BEST FOR   Probing R2 tolerance.',
    '  REGIONS    .a  |  .b',
    '  RE-SKIN    Change --accent.',
    '-->',
    '<style>',
    '  :root{',
    '    --accent:#000; --accent-ink:#fff;',
    '    --bg:#fff; --surface:#fff; --ink:#000; --muted:#666; --line:#eee;',
    '    --pos:#0a0; --neg:#a00;',
    '    --serif:Georgia,serif;',
    '    --sans:system-ui; --mono:monospace;',
    '    --s1:8px; --s2:14px; --s3:24px; --s4:40px;',
    '  }',
    `  ${resetLine}`,
    '</style>',
    '</head>',
    '<body>',
    '  <div class="scaffold">01 · probe <a href="../index.html">gallery</a></div>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

test('R2 accepts the thorough `*, *::before, *::after { box-sizing: border-box }` reset', () => {
  const html = scaffoldWithReset('*, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }');
  const violations = checkContent(html, { file: '01-r2-probe.html', group: 'layouts' });
  assert.deepEqual(
    violations.filter((v) => v.rule === 'R2'),
    [],
    'thorough universal reset must satisfy R2'
  );
});

test('R2 still rejects a non-universal box-sizing rule', () => {
  const html = scaffoldWithReset('.foo { box-sizing: border-box; }');
  const violations = checkContent(html, { file: '01-r2-probe.html', group: 'layouts' });
  const r2 = violations.find((v) => v.rule === 'R2');
  assert.ok(r2, 'a non-universal selector must NOT satisfy R2');
});

// ---------------------------------------------------------------------------
// R10 / R11 — repo-level rules. Built against a synthetic temp root so we
// can construct malformed marker/region states without touching the real
// repo. The fixture mirrors just enough of the real shape (a catalog.json +
// README.md + info-design/chooser.html + the scaffold files it references)
// for buildRegions()/listScaffolds() to run.
// ---------------------------------------------------------------------------

function makeSyntheticRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'check-r10r11-'));
  mkdirSync(path.join(root, 'layouts'));
  mkdirSync(path.join(root, 'info-design'));

  const catalog = {
    categories: [
      { key: 'foundations', group: 'layouts', name: 'Foundations', intro: 'x'.repeat(40) },
      { key: 'comparison', group: 'info-design', name: 'Comparison', intro: 'x'.repeat(40) },
    ],
    items: [
      {
        id: '01',
        group: 'layouts',
        file: 'layouts/01-split-panel.html',
        title: 'Split Panel',
        category: 'foundations',
        accent: '#000000',
        oneliner: 'x',
        tags: [],
        facets: ['mobile', 'editorial'],
        thumb: '<div></div>',
      },
      {
        id: 'i01',
        group: 'info-design',
        file: 'info-design/i01-grouped-bars.html',
        title: 'Grouped Bars',
        category: 'comparison',
        accent: '#000000',
        oneliner: 'x',
        tags: [],
        facets: ['mobile', 'editorial'],
        thumb: '<div></div>',
        chooserCat: 'Comparison',
        shape: '4 categories × 2 series',
        verbs: ['compare'],
        when: 'two-series category comparisons',
      },
    ],
  };
  writeFileSync(path.join(root, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  writeFileSync(path.join(root, 'layouts', '01-split-panel.html'), '<html></html>\n');
  writeFileSync(path.join(root, 'info-design', 'i01-grouped-bars.html'), '<html></html>\n');

  writeFileSync(
    path.join(root, 'README.md'),
    [
      '## The catalog (1)',
      '',
      '<!-- gen:readme-layout-catalog start -->',
      'STALE LAYOUT CONTENT',
      '<!-- gen:readme-layout-catalog end -->',
      '',
      '## Info-design catalog (1)',
      '',
      '<!-- gen:readme-info-catalog start -->',
      'STALE INFO CONTENT',
      '<!-- gen:readme-info-catalog end -->',
      '',
      '## Facets',
      '',
      '<!-- gen:readme-facets start -->',
      'STALE FACET LIST',
      '<!-- gen:readme-facets end -->',
      '',
    ].join('\n')
  );

  writeFileSync(
    path.join(root, 'info-design', 'chooser.html'),
    [
      '<script>',
      '  var CATALOG = [',
      '    // gen:chooser-catalog start',
      '    // gen:chooser-catalog end',
      '  ];',
      '</script>',
      '',
    ].join('\n')
  );

  writeFileSync(
    path.join(root, 'index.html'),
    [
      '<!doctype html>',
      '<html><body>',
      '<!-- gen:facet-bar start -->',
      'STALE FACET BAR',
      '<!-- gen:facet-bar end -->',
      '<section id="cat-foundations">',
      '<!-- gen:index-cards:foundations start -->',
      'STALE FOUNDATIONS CARDS',
      '<!-- gen:index-cards:foundations end -->',
      '</section>',
      '<section id="cat-comparison">',
      '<!-- gen:index-cards:comparison start -->',
      'STALE COMPARISON CARDS',
      '<!-- gen:index-cards:comparison end -->',
      '</section>',
      '</body></html>',
      '',
    ].join('\n')
  );

  return root;
}

test('R10 fires: a marker missing its matching end tag is flagged', () => {
  const root = makeSyntheticRoot();
  try {
    // Remove the readme-layout-catalog end marker only.
    const readmePath = path.join(root, 'README.md');
    const readme = readFileSync(readmePath, 'utf8').replace(
      '<!-- gen:readme-layout-catalog end -->\n',
      ''
    );
    writeFileSync(readmePath, readme);

    const entries = listScaffolds(root);
    const violations = ruleR10({ root, entries });
    assert.ok(
      violations.some((v) => v.rule === 'R10' && v.file === 'README.md' && /readme-layout-catalog end/.test(v.detail)),
      'expected an R10 violation for the missing end marker'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('R11 fires: a region whose on-disk text is stale (not what build.mjs would generate)', () => {
  const root = makeSyntheticRoot();
  try {
    const entries = listScaffolds(root);
    const violations = ruleR11({ root, entries });
    assert.ok(
      violations.some((v) => v.rule === 'R11' && v.file === 'README.md' && /out of sync/.test(v.detail)),
      'expected an R11 violation for the stale readme-layout-catalog region'
    );
    assert.ok(
      violations.some((v) => v.rule === 'R11' && v.file === path.join('info-design', 'chooser.html')),
      'expected an R11 violation for the stale chooser-catalog region'
    );
    assert.ok(
      violations.some((v) => v.rule === 'R11' && v.file === 'index.html' && /out of sync/.test(v.detail)),
      'expected an R11 violation for the stale index-cards regions in index.html'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('R11 fires: an on-disk scaffold with no catalog.json entry breaks the bijection', () => {
  const root = makeSyntheticRoot();
  try {
    writeFileSync(path.join(root, 'layouts', '99-orphan.html'), '<html></html>\n');
    const entries = listScaffolds(root);
    const violations = ruleR11({ root, entries });
    assert.ok(
      violations.some(
        (v) => v.rule === 'R11' && v.file === 'catalog.json' && /layouts\/99-orphan\.html/.test(v.detail)
      ),
      'expected an R11 violation for the orphan on-disk scaffold'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('R10 + R11: the real, built repo tree has neither', () => {
  build(REPO_ROOT);
  const entries = listScaffolds(REPO_ROOT);
  assert.deepEqual(ruleR10({ root: REPO_ROOT, entries }), []);
  assert.deepEqual(ruleR11({ root: REPO_ROOT, entries }), []);
});

// ---------------------------------------------------------------------------
// R12 — closed facet vocabulary. Built against the same synthetic temp root
// as R10/R11, with catalog.json's item facets mutated per-test.
// ---------------------------------------------------------------------------

test('R12 fires: an item with no facets', () => {
  const root = makeSyntheticRoot();
  try {
    const p = path.join(root, 'catalog.json');
    const cat = JSON.parse(readFileSync(p, 'utf8'));
    cat.items[0].facets = [];
    cat.items[1].facets = ['mobile', 'editorial'];
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
    cat.items[1].facets = ['mobile', 'editorial'];
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
    cat.items[1].facets = ['mobile', 'editorial'];
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
    cat.items[0].facets = ['mobile', 'editorial'];
    cat.items[1].facets = ['mobile', 'editorial'];
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

test('R12 fires: a vocabulary key containing a space is reported (delimiter-unsafe)', () => {
  const root = makeSyntheticRoot();
  try {
    // build.mjs joins facet keys with a space into data-facets and the URL
    // joins with a comma; a key containing either delimiter would produce a
    // chip with a correct count that silently selects zero cards. Inject a
    // malformed vocabulary (real facets.json is untouched) to prove R12
    // catches this independently of catalog.json's own facet usage.
    const badFacets = [
      { key: 'mobile', label: 'mobile', blurb: 'x' },
      { key: 'has space', label: 'has space', blurb: 'x' },
    ];
    const violations = ruleR12({ root, facets: badFacets });
    assert.ok(
      violations.some((v) => v.detail.includes('"has space"') && /\[a-z0-9\/\+-\]/.test(v.detail)),
      'expected a key-syntax violation for the space-containing facet key'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('R12 accepts the real "before/after" key: a slash must not trip the key-syntax check', () => {
  const root = makeSyntheticRoot();
  try {
    const goodFacets = [
      { key: 'mobile', label: 'mobile', blurb: 'x' },
      { key: 'before/after', label: 'before/after', blurb: 'x' },
    ];
    const violations = ruleR12({ root, facets: goodFacets });
    assert.ok(
      !violations.some((v) => /outside \[a-z0-9/.test(v.detail)),
      'before/after must not be flagged by the key-syntax check'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Whole-branch review fixes (2026-07-24)
// ---------------------------------------------------------------------------

test('R11 REPORTS a malformed marker pair instead of throwing (checker must still print R1-R10)', () => {
  const root = makeSyntheticRoot();
  try {
    // Drop an index.html end marker. R10 is the rule that catches this; R11
    // must not blow up first, or the whole report — R10's finding included —
    // is lost behind a stack trace.
    const indexPath = path.join(root, 'index.html');
    writeFileSync(
      indexPath,
      readFileSync(indexPath, 'utf8').replace('<!-- gen:index-cards:foundations end -->\n', '')
    );

    const entries = listScaffolds(root);
    let violations;
    assert.doesNotThrow(() => {
      violations = ruleR11({ root, entries });
    }, 'ruleR11 must not throw on a malformed marker pair');
    assert.ok(
      violations.some((v) => v.rule === 'R11' && /index\.html/.test(v.file) && /marker/i.test(v.detail)),
      'expected an R11 violation naming the malformed region'
    );
    // And R10 still gets to do its job.
    assert.ok(
      ruleR10({ root, entries }).some((v) => v.rule === 'R10'),
      'R10 must still report the missing marker'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('R4 ignores an unextractable EXEMPT helper (showChip/attachHover are not canon)', () => {
  // showChip is exempt (spec amendment 2026-07-21): only el/hideChip/escHtml
  // are canon. An exempt helper the brace scanner cannot balance must not be
  // reported — that was a latent false positive.
  const html = readFixture('good-layout.html').replace(
    '</script>',
    'function showChip(e, t) { if (a) { return 1; \n</script>'
  );
  const violations = checkContent(html, { file: '01-good-layout.html', group: 'layouts' });
  assert.ok(
    !violations.some((v) => v.rule === 'R4' && /showChip/.test(v.detail)),
    'an exempt helper must never produce an R4 violation'
  );
});

test('R4 STILL fires for an unextractable CANON helper (the exemption must not over-narrow)', () => {
  const html = readFixture('good-layout.html').replace(
    '</script>',
    'function hideChip(x) { if (a) { return 1; \n</script>'
  );
  const violations = checkContent(html, { file: '01-good-layout.html', group: 'layouts' });
  assert.ok(
    violations.some((v) => v.rule === 'R4' && /hideChip/.test(v.detail)),
    'a canon helper with an unbalanced body must still be flagged'
  );
});
