import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { listScaffolds } from '../lib/scaffolds.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const catalog = JSON.parse(readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));

test('exactly 107 items: 71 layouts + 36 info-design', () => {
  assert.equal(catalog.items.length, 107);
  const layouts = catalog.items.filter((i) => i.group === 'layouts');
  const infoDesign = catalog.items.filter((i) => i.group === 'info-design');
  assert.equal(layouts.length, 71);
  assert.equal(infoDesign.length, 36);
});

test('every item file exists on disk, and every scaffold on disk is represented (bijection)', () => {
  const onDisk = listScaffolds(ROOT)
    .map((e) => e.file)
    .sort();
  const inCatalog = catalog.items.map((i) => i.file).sort();
  for (const file of inCatalog) {
    assert.ok(existsSync(path.join(ROOT, file)), `catalog references missing file: ${file}`);
  }
  assert.deepEqual(inCatalog, onDisk);
});

test('every item category key exists in categories', () => {
  const keys = new Set(catalog.categories.map((c) => c.key));
  for (const item of catalog.items) {
    assert.ok(keys.has(item.category), `item ${item.id} has unknown category "${item.category}"`);
  }
});

test('every chart item (group=info-design) has non-empty chooserCat, shape, verbs[], when', () => {
  for (const item of catalog.items.filter((i) => i.group === 'info-design')) {
    assert.ok(
      typeof item.chooserCat === 'string' && item.chooserCat.length > 0,
      `${item.id} missing chooserCat`
    );
    assert.ok(typeof item.shape === 'string' && item.shape.length > 0, `${item.id} missing shape`);
    assert.ok(Array.isArray(item.verbs) && item.verbs.length >= 1, `${item.id} missing verbs`);
    assert.ok(typeof item.when === 'string' && item.when.length > 0, `${item.id} missing when`);
  }
});

test('every item has a non-empty thumb and a valid #hex accent', () => {
  const hexRe = /^#[0-9A-Fa-f]{3,8}$/;
  for (const item of catalog.items) {
    assert.ok(typeof item.thumb === 'string' && item.thumb.length > 0, `${item.id} missing thumb`);
    assert.match(item.accent, hexRe, `${item.id} has invalid accent "${item.accent}"`);
  }
});

test('every category intro is a non-empty string >= 40 chars', () => {
  for (const cat of catalog.categories) {
    assert.ok(typeof cat.intro === 'string', `${cat.key} intro is not a string`);
    assert.ok(cat.intro.length >= 40, `${cat.key} intro too short (${cat.intro.length} chars)`);
  }
});

test('every category key is unique', () => {
  const keys = catalog.categories.map((c) => c.key);
  assert.equal(new Set(keys).size, keys.length);
});

test('i04 carries the chooser-authoritative shape (drift reconciliation)', () => {
  const i04 = catalog.items.find((i) => i.id === 'i04');
  assert.equal(i04.shape, '1 series × 36 monthly points + band');
});
