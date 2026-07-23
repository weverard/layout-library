import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  listScaffolds,
  extractRoot,
  extractHeader,
  extractTitle,
  CANON_TOKENS,
  CANON_HELPERS,
  CANON_FACETS,
} from '../lib/scaffolds.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

function readScaffold(rel) {
  return readFileSync(path.join(REPO_ROOT, rel), 'utf8');
}

test('listScaffolds returns 107 entries split 71 layouts / 36 info-design, excludes chooser/index', () => {
  const entries = listScaffolds(REPO_ROOT);
  assert.equal(entries.length, 107);

  const layouts = entries.filter((e) => e.group === 'layouts');
  const infoDesign = entries.filter((e) => e.group === 'info-design');
  assert.equal(layouts.length, 71);
  assert.equal(infoDesign.length, 36);

  const files = entries.map((e) => e.file);
  assert.ok(!files.some((f) => f.includes('chooser.html')), 'chooser.html must be excluded');
  assert.ok(!files.some((f) => f.includes('index.html')), 'index.html must be excluded');

  // every entry's group matches a real "layouts" or "info-design" bucket
  for (const e of entries) {
    assert.ok(e.group === 'layouts' || e.group === 'info-design');
  }
});

test('extractRoot on layouts/01-split-panel.html: first decl is --accent (post Task-6 migration order)', () => {
  const html = readScaffold('layouts/01-split-panel.html');
  const root = extractRoot(html);
  assert.ok(root.raw.length > 0);
  assert.ok(Array.isArray(root.decls));
  assert.ok(root.decls.length > 0);
  assert.equal(root.decls[0].name, '--accent');
});

test('extractRoot on info-design/i01-grouped-bars.html: includes --surface and starts with --accent (post Task-7 migration order)', () => {
  const html = readScaffold('info-design/i01-grouped-bars.html');
  const root = extractRoot(html);
  assert.equal(root.decls[0].name, '--accent');
  assert.ok(
    root.decls.some((d) => d.name === '--surface'),
    ':root block should include --surface (renamed from --panel by Task 7)'
  );
  assert.ok(
    !root.decls.some((d) => d.name === '--panel'),
    '--panel should no longer be present post-migration'
  );
});

test('extractHeader on info-design/i01-grouped-bars.html yields CHART/DATA SHAPE/INSIGHT/BEST FOR/RE-SKIN in order', () => {
  const html = readScaffold('info-design/i01-grouped-bars.html');
  const header = extractHeader(html);
  const keys = header.fields.map((f) => f.key);
  assert.deepEqual(keys, ['CHART', 'DATA SHAPE', 'INSIGHT', 'BEST FOR', 'RE-SKIN']);
});

test('extractHeader on layouts/01-split-panel.html yields PATTERN/NAV MODEL/BEST FOR/REGIONS/RE-SKIN in order', () => {
  const html = readScaffold('layouts/01-split-panel.html');
  const header = extractHeader(html);
  const keys = header.fields.map((f) => f.key);
  assert.deepEqual(keys, ['PATTERN', 'NAV MODEL', 'BEST FOR', 'REGIONS', 'RE-SKIN']);
});

test('extractTitle on info-design/i01-grouped-bars.html matches info-design title pattern', () => {
  const html = readScaffold('info-design/i01-grouped-bars.html');
  const title = extractTitle(html);
  assert.match(title, /^i\d{2} · .+ — Info design scaffold$/);
});

test('CANON_TOKENS has 16 names in canonical order', () => {
  assert.equal(CANON_TOKENS.length, 16);
  assert.deepEqual(CANON_TOKENS, [
    '--accent', '--accent-ink',
    '--bg', '--surface', '--ink', '--muted', '--line',
    '--pos', '--neg',
    '--serif',
    '--sans', '--mono',
    '--s1', '--s2', '--s3', '--s4',
  ]);
});

test('CANON_HELPERS has exactly the 3 canonical helper names (xOf/yOf/showChip/attachHover absent)', () => {
  const names = Object.keys(CANON_HELPERS).sort();
  assert.deepEqual(names, ['el', 'escHtml', 'hideChip']);
  assert.ok(!('xOf' in CANON_HELPERS));
  assert.ok(!('yOf' in CANON_HELPERS));
  assert.ok(!('showChip' in CANON_HELPERS));
  assert.ok(!('attachHover' in CANON_HELPERS));
  for (const name of names) {
    assert.equal(typeof CANON_HELPERS[name], 'string');
    assert.ok(CANON_HELPERS[name].length > 0);
  }
});

test('CANON_FACETS: 15 facets, unique keys, every field non-empty', () => {
  assert.equal(CANON_FACETS.length, 15);

  const keys = CANON_FACETS.map((f) => f.key);
  assert.equal(new Set(keys).size, 15, 'facet keys must be unique');

  for (const f of CANON_FACETS) {
    assert.ok(f.key && typeof f.key === 'string', `facet key missing: ${JSON.stringify(f)}`);
    assert.ok(f.label && typeof f.label === 'string', `facet label missing: ${f.key}`);
    assert.ok(f.blurb && typeof f.blurb === 'string', `facet blurb missing: ${f.key}`);
    assert.ok(!/[<>"]/.test(f.key), `facet key "${f.key}" must be plain text`);
  }

  assert.deepEqual(
    [...keys].sort(),
    [
      'animated', 'before/after', 'commerce', 'conversational',
      'dashboard', 'editorial', 'gallery',
      'geospatial', 'hierarchy', 'keyboard-driven', 'mobile',
      'narrative', 'playful', 'ranking', 'time',
    ],
    'facet key set must match the canonical 15 exactly'
  );
});
