import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { migrateFile, migrateTokenBlock, migrateHelpers } from '../migrate/migrate-scaffolds.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures');

function readFixture(name) {
  return readFileSync(path.join(FIXTURES, name), 'utf8');
}

// ---------------------------------------------------------------------------
// (a) Idempotence — the critical safety property for a codemod Task 7 reuses
// verbatim against info-design/. Re-running on already-migrated content must
// be a byte-identical no-op, on both a fixture that started canonical and
// one that started with real violations.
// ---------------------------------------------------------------------------

test('idempotence: good-layout.html (already canonical) is untouched', () => {
  const html = readFixture('good-layout.html');
  const first = migrateFile(html, { group: 'layouts' });
  assert.equal(first.changed, false);
  assert.equal(first.html, html);
});

test('idempotence: migrating bad-layout.html twice is a no-op the second time', () => {
  const html = readFixture('bad-layout.html');
  const first = migrateFile(html, { group: 'layouts' });
  assert.equal(first.changed, true, 'first pass should have found real work to do');

  const second = migrateFile(first.html, { group: 'layouts' });
  assert.equal(second.changed, false, 'second pass on already-migrated output must be a no-op');
  assert.equal(second.html, first.html, 'output must be byte-identical across repeated runs');
});

// ---------------------------------------------------------------------------
// (b) Token block: canonical order, values preserved, missing tokens get the
// documented defaults, extra file tokens survive untouched after the 16.
// ---------------------------------------------------------------------------

function wrapRoot(rootBody) {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<style>',
    `  :root{${rootBody}}`,
    '</style>',
    '</head>',
    '<body></body>',
    '</html>',
    '',
  ].join('\n');
}

test('token block: reorders to canonical order, keeps existing values, inserts documented defaults, preserves extras', () => {
  const html = wrapRoot(
    '--surface:#fff; --bg:#111; --ink:#eee; --muted:#999; --line:#222; --accent:#4F46E5; --sidebar:#000;'
  );
  const { html: out, changed, notes } = migrateTokenBlock(html);
  assert.equal(changed, true);

  const rootMatch = out.match(/:root\{([^}]*)\}/);
  assert.ok(rootMatch, 'expected a :root block in the output');
  const names = rootMatch[1]
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.split(':')[0].trim());

  // First 16 names are the canon vocabulary, in canonical order.
  assert.deepEqual(names.slice(0, 16), [
    '--accent', '--accent-ink',
    '--bg', '--surface', '--ink', '--muted', '--line',
    '--pos', '--neg',
    '--serif',
    '--sans', '--mono',
    '--s1', '--s2', '--s3', '--s4',
  ]);
  // Extra file-specific token survives, after the 16.
  assert.deepEqual(names.slice(16), ['--sidebar']);

  // Existing values are kept verbatim, not overwritten.
  assert.match(out, /--accent:#4F46E5/);
  assert.match(out, /--bg:#111/);
  assert.match(out, /--surface:#fff/);
  assert.match(out, /--ink:#eee/);
  assert.match(out, /--muted:#999/);
  assert.match(out, /--line:#222/);
  assert.match(out, /--sidebar:#000/);

  // Missing tokens get the documented defaults.
  assert.match(out, /--accent-ink:#fff/);
  assert.match(out, /--pos:var\(--accent\)/);
  assert.match(out, /--neg:#B3261E/);
  assert.match(out, /--serif:Georgia/);
  assert.match(out, /--s1:8px/);
  assert.match(out, /--s2:14px/);
  assert.match(out, /--s3:24px/);
  assert.match(out, /--s4:40px/);

  assert.ok(notes.some((n) => n.startsWith('tokens: reordered')));
  assert.ok(notes.some((n) => n.includes('inserted missing --pos')));
});

test('token block: already-canonical input is reported unchanged', () => {
  const html = readFixture('good-layout.html');
  const { changed, notes } = migrateTokenBlock(html);
  assert.equal(changed, false);
  assert.deepEqual(notes, []);
});

// ---------------------------------------------------------------------------
// (c) Helper bodies: a behaviorally-different canon-named helper is renamed,
// not silently overwritten, and every call site follows the rename.
//
// showChip/attachHover were the original vehicles for these tests (Task 6
// anticipating Task 7's info-design/ scope), but the 2026-07-21 spec
// amendment made them EXEMPT from canon (13/8 distinct real signatures,
// only one file each matching) — see
// docs/superpowers/specs/2026-07-11-consistency-cleanup-design.md and
// tools/canon/helpers.js. They no longer flow through migrateHelpers at
// all, so these tests are rewritten against `el` (the one helper that is
// genuinely uniform in production — all 30 info-design/ occurrences share
// `el(name, attrs)`), which still exercises every branch: replace-in-place
// for cosmetic differences, and rename for real ones.
// ---------------------------------------------------------------------------

test('helpers: a genuinely different el (extra parameter) is renamed, not overwritten', () => {
  // Genuinely different signature (an extra `ns` param) — must not be
  // swallowed by param-name/whitespace tolerance.
  const html = [
    '<!doctype html>',
    '<html lang="en">',
    '<head></head>',
    '<body>',
    '<script>',
    '  function el(name, attrs, ns){',
    '    var e = document.createElementNS(ns, name);',
    '    for(var k in attrs){ e.setAttribute(k, attrs[k]); }',
    '    return e;',
    '  }',
    "  el('rect', {}, svgns);",
    '</script>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
  const { html: out, notes } = migrateHelpers(html);

  assert.ok(
    notes.some((n) => n.includes('el:') && n.includes('RENAMED to elCustom')),
    `expected an el rename note, got: ${JSON.stringify(notes)}`
  );
  assert.ok(!/function el\(/.test(out), 'old name must not remain as a declaration');
  assert.ok(!/\bel\(/.test(out.replace(/elCustom\(/g, '')), 'old name must not remain at any call site');
  assert.match(out, /function elCustom\(/);
  assert.match(out, /elCustom\('rect', \{\}, svgns\)/, 'the call site must follow the rename');
});

test('helpers: an el with renamed (but positionally equivalent) params is upgraded to the canon body in place, not renamed', () => {
  // Renamed params (name/attrs -> tag/opts) — tolerated as "behaviorally the
  // same" per Step 1.2.
  const html = [
    '<!doctype html>',
    '<html lang="en">',
    '<head></head>',
    '<body>',
    '<script>',
    '  function el(tag, opts){',
    '    var e = document.createElementNS(svgns, tag);',
    '    for(var k in opts){ e.setAttribute(k, opts[k]); }',
    '    return e;',
    '  }',
    '</script>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
  const { html: out, notes } = migrateHelpers(html);

  assert.ok(!notes.some((n) => n.includes('RENAMED')), 'an equivalent body must not be renamed');
  assert.ok(notes.some((n) => n.includes('el:') && n.includes('replaced body with canon')));
  assert.match(out, /function el\(name, attrs\)/, 'canon name and params must be preserved for an equivalent body');
});

// ---------------------------------------------------------------------------
// Regression: a punctuation/operator-spacing-only difference must be
// REPLACED, not RENAMED. Task-6 review caught this live in info-design/
// (Task 7's scope): `isBehaviorallyEquivalent` used to fall back to a plain
// whitespace-run collapse (normalizeWs) as its final comparison step, which
// cannot equate `r.width/2` with canon's `r.width / 2` (no space to collapse
// on one side), or `for (var k in attrs)` with canon's `for(var k in
// attrs)` — real bodies found in info-design/ (i01-grouped-bars.html's
// showChip — since made canon-exempt — and i25-calendar-heatmap.html's el)
// that were being wrongly renamed to `showChipCustom`/`elCustom`. Fixed by
// tokenizing before comparing (TOKEN_RE/joinTokensTight), so spacing around
// operators/punctuation is ignored on both sides rather than merely
// collapsed. This test reproduces that exact shape directly via `el`
// (comma/brace spacing, the same regression class the division-operator
// case exercised), not just via the real files.
// ---------------------------------------------------------------------------

test('helpers: el differing only in comma/brace spacing is replaced, not renamed', () => {
  // Byte-identical to canon except no spaces after commas / around braces.
  const html = [
    '<!doctype html>',
    '<html lang="en">',
    '<head></head>',
    '<body>',
    '<script>',
    '  function el(name,attrs){',
    '    var e=document.createElementNS(svgns,name);',
    '    for(var k in attrs){e.setAttribute(k,attrs[k]);}',
    '    return e;',
    '  }',
    '</script>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
  const { html: out, notes } = migrateHelpers(html);

  assert.ok(
    !notes.some((n) => n.includes('RENAMED')),
    `punctuation-spacing-only difference must not be renamed, got: ${JSON.stringify(notes)}`
  );
  assert.ok(notes.some((n) => n.includes('el:') && n.includes('replaced body with canon')));
  assert.match(out, /function el\(/, 'canon name must be preserved');
  assert.match(out, /createElementNS\(svgns, name\)/, "body text itself is replaced with canon's own spacing");
});

test('helpers: el differing only in whitespace around for(...) is replaced, not renamed', () => {
  // Mirrors info-design/i25-calendar-heatmap.html's real el: identical to
  // canon except a space between `for` and `(`.
  const html = [
    '<!doctype html>',
    '<html lang="en"><head></head><body>',
    '<script>',
    '  function el(name, attrs){',
    '    var e = document.createElementNS(svgns, name);',
    '    for (var k in attrs) { e.setAttribute(k, attrs[k]); }',
    '    return e;',
    '  }',
    '</script>',
    '</body></html>',
    '',
  ].join('\n');
  const { html: out, notes } = migrateHelpers(html);

  assert.ok(
    !notes.some((n) => n.includes('RENAMED')),
    `whitespace-only difference must not be renamed, got: ${JSON.stringify(notes)}`
  );
  assert.ok(notes.some((n) => n.includes('el:') && n.includes('replaced body with canon')));
  assert.match(out, /function el\(/, 'canon name must be preserved');
});

// ---------------------------------------------------------------------------
// Regression: a consistently-renamed BOUND local (a var/let/const-declared
// identifier, not just a parameter) must be REPLACED, not RENAMED — and a
// genuine FREE-identifier difference must still be RENAMED. Task-6 review
// caught this live: info-design/i32-area-shapes.html and
// i33-big-number.html both define `el` identical to canon except the
// for-loop variable is named `key` instead of canon's `k` — `key` is bound
// (declared by `for(var key in attrs)`), not a parameter, so the earlier
// param-only substitution missed it and both were wrongly renamed to
// `elCustom`. Fixed by finding every var/let/const-declared identifier
// (findDeclaredLocals) and alpha-renaming it alongside parameters, while
// leaving free identifiers (module-level vars the helper closes over, or
// calls to other functions) untouched on both sides.
// ---------------------------------------------------------------------------

test('helpers: el differing only by a renamed bound loop variable (key vs k) is replaced, not renamed', () => {
  // Mirrors info-design/i32-area-shapes.html / i33-big-number.html's real el.
  const html = [
    '<!doctype html>',
    '<html lang="en"><head></head><body>',
    '<script>',
    '  function el(name, attrs){',
    '    var e = document.createElementNS(svgns, name);',
    '    for(var key in attrs){ e.setAttribute(key, attrs[key]); }',
    '    return e;',
    '  }',
    '</script>',
    '</body></html>',
    '',
  ].join('\n');
  const { html: out, notes } = migrateHelpers(html);

  assert.ok(
    !notes.some((n) => n.includes('RENAMED')),
    `a consistently-renamed bound local must not be renamed, got: ${JSON.stringify(notes)}`
  );
  assert.ok(notes.some((n) => n.includes('el:') && n.includes('replaced body with canon')));
  assert.match(out, /function el\(/, 'canon name must be preserved');
  assert.match(out, /for\(var k in attrs\)/, "body is replaced with canon's own `k`, not left as `key`");
});

test('helpers: el differing in a FREE identifier (a different namespace var) is still renamed', () => {
  // Same shape as the bound-local case above, except `svgns` — a free
  // identifier the function closes over, not a declared/bound local — is
  // swapped for a different name. This is a genuine behavioral difference
  // (a different namespace constant) and must not be swallowed by bound-
  // identifier alpha-renaming.
  const html = [
    '<!doctype html>',
    '<html lang="en"><head></head><body>',
    '<script>',
    '  function el(name, attrs){',
    '    var e = document.createElementNS(svgnsAlt, name);',
    '    for(var k in attrs){ e.setAttribute(k, attrs[k]); }',
    '    return e;',
    '  }',
    "  el('rect', {});",
    '</script>',
    '</body></html>',
    '',
  ].join('\n');
  const { html: out, notes } = migrateHelpers(html);

  assert.ok(
    notes.some((n) => n.includes('el:') && n.includes('RENAMED to elCustom')),
    `a free-identifier difference must still be renamed, got: ${JSON.stringify(notes)}`
  );
  assert.ok(!/function el\(/.test(out), 'old name must not remain as a declaration');
  assert.match(out, /function elCustom\(/);
  assert.match(out, /elCustom\('rect', \{\}\);/, 'the call site must follow the rename');
});

// (The former "genuine 4-param attachHover variant is still renamed" test
// lived here — attachHover is now canon-exempt per the 2026-07-21 amendment,
// so that scenario can no longer occur; the "different signature still
// renames, standalone call site included" case is covered above by the
// el-extra-parameter test.)

// ---------------------------------------------------------------------------
// escHtml special case (Step 1.3): always canonicalized, never renamed, even
// though its extra `"` escaping + String() coercion make it technically
// behaviorally different from the pre-existing `escHtml(str)` bodies.
// ---------------------------------------------------------------------------

test('helpers: escHtml(str) without quote-escaping is canonicalized to escHtml(s), not renamed', () => {
  const html = [
    '<!doctype html>',
    '<html lang="en"><head></head><body>',
    '<script>',
    "  function escHtml(str) { return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }",
    '</script>',
    '</body></html>',
    '',
  ].join('\n');

  const { html: out, notes } = migrateHelpers(html);
  assert.ok(notes.some((n) => n.startsWith('escHtml: canonicalized')));
  assert.ok(!notes.some((n) => n.includes('RENAMED')));
  assert.match(out, /function escHtml\(s\)/);
  assert.match(out, /String\(s\)/);
  assert.match(out, /replace\(\/"\/g,'&quot;'\)/);
});
