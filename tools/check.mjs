#!/usr/bin/env node
// tools/check.mjs
//
// Contract checker for the 107 single-file scaffolds in layouts/ and
// info-design/. Enforces rules R1-R9 (head preamble, reset, canon tokens,
// canon helpers, title, header profile, badge, filename, clean tail).
// Zero dependencies — Node >=20 built-ins only.
//
// CLI:
//   node tools/check.mjs [--report] [files...]
//     no file args  -> check all 107 scaffolds (via listScaffolds) + repo rules
//     files...      -> check only the given files (group inferred from path)
//     --report      -> print violations, but always exit 0
//     (default)     -> print violations, exit 1 if any violation found
//
// Programmatic API (consumed by tools/test/check.test.mjs):
//   checkContent(html, { file, group }) -> [{ rule, file, detail }, ...]

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  listScaffolds,
  extractRoot,
  extractHeader,
  extractTitle,
  CANON_TOKENS,
  CANON_HELPERS,
  CANON_FACETS,
} from './lib/scaffolds.mjs';
import { checkInSync, readCatalog } from './build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Shared small helpers
// ---------------------------------------------------------------------------

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function normalizeWs(s) {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Extract `function name(...) { ... }` starting at `startIdx` (index of the
 * `function` keyword), returning the full source up to the balanced closing
 * brace. Returns null if no balanced body is found.
 */
function extractBalancedFunction(html, startIdx) {
  const braceStart = html.indexOf('{', startIdx);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let i = braceStart; i < html.length; i++) {
    const c = html[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return html.slice(startIdx, i + 1);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// R1 — head preamble
// ---------------------------------------------------------------------------

// The exact first 5 lines of layouts/01-split-panel.html (byte compare).
const R1_PREAMBLE = [
  '<!doctype html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="utf-8" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1" />',
].join('\n');

function ruleR1(html) {
  const first5 = html.split('\n').slice(0, 5).join('\n');
  if (first5 !== R1_PREAMBLE) {
    return ['first 5 lines do not byte-match the canonical head preamble'];
  }
  return [];
}

// ---------------------------------------------------------------------------
// R2 — reset present
// ---------------------------------------------------------------------------

// A universal-selector reset that applies box-sizing:border-box. Anchored on a
// literal `*` so a non-universal selector (e.g. `.foo{box-sizing:border-box}`)
// can't satisfy it; `[^{]*` then tolerates an optional pseudo-element list such
// as `, *::before, *::after` (and any whitespace) before the block opens; and
// `\s*` after the colon tolerates spaced declarations like `box-sizing: border-box`.
const R2_RESET_RE = /\*[^{]*\{[^}]*box-sizing:\s*border-box/;

function ruleR2(html) {
  if (!R2_RESET_RE.test(html)) {
    return ['missing universal-selector `box-sizing:border-box` reset rule'];
  }
  return [];
}

// ---------------------------------------------------------------------------
// R3 — :root token vocabulary
// ---------------------------------------------------------------------------

function ruleR3(html) {
  const { decls } = extractRoot(html);
  const names = decls.map((d) => d.name);
  const first16 = names.slice(0, CANON_TOKENS.length);
  if (!arraysEqual(first16, CANON_TOKENS)) {
    return [
      `:root token names/order mismatch — expected [${CANON_TOKENS.join(', ')}], got [${first16.join(', ')}]`,
    ];
  }
  return [];
}

// ---------------------------------------------------------------------------
// R4 — canon helper bodies
// ---------------------------------------------------------------------------

const HELPER_NAME_RE = /function (el|attachHover|showChip|hideChip|escHtml)\s*\(/g;

function ruleR4(html) {
  const violations = [];
  const re = new RegExp(HELPER_NAME_RE.source, HELPER_NAME_RE.flags);
  let m;
  while ((m = re.exec(html))) {
    const name = m[1];
    // showChip and attachHover match HELPER_NAME_RE but are EXEMPT from the
    // canon (spec amendment 2026-07-21: 13 and 8 distinct signatures
    // respectively). Resolve the canon first, so an exempt helper can never
    // reach the extraction branch below and be reported for a body this rule
    // has no opinion about.
    const canon = CANON_HELPERS[name];
    if (!canon) continue;
    const body = extractBalancedFunction(html, m.index);
    if (!body) {
      violations.push(`${name}: could not extract a balanced function body`);
      continue;
    }
    if (normalizeWs(body) !== normalizeWs(canon)) {
      violations.push(`${name}: body differs from the canon helper (behaviorally changed)`);
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// R5 — title
// ---------------------------------------------------------------------------

const TITLE_RE = {
  layouts: /^\d{2} · .+ — Layout scaffold$/,
  'info-design': /^i\d{2} · .+ — Info design scaffold$/,
};

function ruleR5(html, ctx) {
  const title = extractTitle(html);
  const re = TITLE_RE[ctx.group];
  if (!re || !re.test(title)) {
    return [`title "${title}" does not match the ${ctx.group} title pattern`];
  }
  return [];
}

// ---------------------------------------------------------------------------
// R6 — header field profile
// ---------------------------------------------------------------------------

const HEADER_KEYS = {
  layouts: ['PATTERN', 'NAV MODEL', 'BEST FOR', 'REGIONS', 'RE-SKIN'],
  'info-design': ['CHART', 'DATA SHAPE', 'INSIGHT', 'BEST FOR', 'RE-SKIN'],
};

function ruleR6(html, ctx) {
  const { fields } = extractHeader(html);
  const keys = fields.map((f) => f.key);
  const expected = HEADER_KEYS[ctx.group];
  if (!expected || !arraysEqual(keys, expected)) {
    return [`header keys ${JSON.stringify(keys)} !== expected ${JSON.stringify(expected)} for ${ctx.group}`];
  }
  return [];
}

// ---------------------------------------------------------------------------
// R7 — scaffold badge + gallery link
// ---------------------------------------------------------------------------

function ruleR7(html) {
  const violations = [];
  if (!html.includes('class="scaffold"')) violations.push('missing `class="scaffold"` badge');
  if (!html.includes('../index.html')) violations.push('missing gallery link `../index.html`');
  return violations;
}

// ---------------------------------------------------------------------------
// R8 — filename pattern
// ---------------------------------------------------------------------------

const FILENAME_RE = {
  layouts: /^\d{2}-[a-z0-9-]+\.html$/,
  'info-design': /^i\d{2}-[a-z0-9-]+\.html$/,
};

function ruleR8(html, ctx) {
  const base = path.basename(ctx.file);
  const re = FILENAME_RE[ctx.group];
  if (!re || !re.test(base)) {
    return [`filename "${base}" does not match the ${ctx.group} filename pattern`];
  }
  return [];
}

// ---------------------------------------------------------------------------
// R9 — clean tail (no trailing content, no tool-call-leak artifacts)
// ---------------------------------------------------------------------------

function ruleR9(html) {
  const problems = [];

  const idx = html.lastIndexOf('</html>');
  if (idx === -1) {
    problems.push('no </html> tag found');
  } else {
    const tail = html.slice(idx + '</html>'.length);
    if (tail.trim() !== '') {
      problems.push('non-whitespace content after </html>');
    }
  }

  if (/<\/content>|<\/invoke>|antml/.test(html)) {
    problems.push('tool-call-leak artifact found (</content>, </invoke>, or antml)');
  }

  if (problems.length === 0) return [];
  // Collapse to a single R9 finding per file, regardless of how many
  // sub-conditions tripped.
  return [problems.join('; ')];
}

// ---------------------------------------------------------------------------
// R10 — gen: marker pairs present (README×3, chooser×1, index×1-per-category)
// ---------------------------------------------------------------------------

function countOccurrences(text, needle) {
  let count = 0;
  let idx = text.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = text.indexOf(needle, idx + needle.length);
  }
  return count;
}

const STATIC_EXPECTED_MARKERS = [
  { file: 'README.md', name: 'readme-layout-catalog', kind: 'html' },
  { file: 'README.md', name: 'readme-info-catalog', kind: 'html' },
  { file: 'README.md', name: 'readme-facets', kind: 'html' },
  { file: path.join('info-design', 'chooser.html'), name: 'chooser-catalog', kind: 'js' },
  { file: 'index.html', name: 'facet-bar', kind: 'html' },
];

// index.html carries one marker pair per catalog category (not a fixed list —
// derived from catalog.json so a category added/removed there is picked up
// here without a hand-maintained enumeration going stale).
function expectedMarkers(root) {
  const catalog = readCatalog(root);
  const indexMarkers = catalog.categories.map((cat) => ({
    file: 'index.html',
    name: `index-cards:${cat.key}`,
    kind: 'html',
  }));
  return [...STATIC_EXPECTED_MARKERS, ...indexMarkers];
}

function ruleR10({ root }) {
  const violations = [];
  const cache = new Map();

  for (const { file, name, kind } of expectedMarkers(root)) {
    if (!cache.has(file)) {
      cache.set(file, readFileSync(path.join(root, file), 'utf8'));
    }
    const text = cache.get(file);
    const start = kind === 'html' ? `<!-- gen:${name} start -->` : `// gen:${name} start`;
    const end = kind === 'html' ? `<!-- gen:${name} end -->` : `// gen:${name} end`;

    const startCount = countOccurrences(text, start);
    if (startCount !== 1) {
      violations.push({
        rule: 'R10',
        file,
        detail: `expected exactly one "${start}", found ${startCount}`,
      });
    }
    const endCount = countOccurrences(text, end);
    if (endCount !== 1) {
      violations.push({
        rule: 'R10',
        file,
        detail: `expected exactly one "${end}", found ${endCount}`,
      });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// R11 — generated regions in sync with catalog.json; catalog<->disk bijection
// ---------------------------------------------------------------------------

// Which file owns a given generated region. Used only to attribute a
// malformed-marker error; the regions themselves are listed in build.mjs.
function fileForRegion(name) {
  if (!name) return 'index.html';
  if (name.startsWith('readme-')) return 'README.md';
  if (name === 'chooser-catalog') return path.join('info-design', 'chooser.html');
  return 'index.html'; // facet-bar + index-cards:<key>
}

function ruleR11({ root, entries }) {
  const violations = [];

  // checkInSync regenerates every region, so a marker pair that is missing or
  // out of order makes it throw. That must NOT escape: R10 exists precisely to
  // report malformed markers, and an uncaught throw here aborts main() before
  // ANY rule's findings are printed — the report vanishes behind a stack
  // trace. Downgrade it to a violation and carry on.
  try {
    for (const { file, inSync } of checkInSync(root)) {
      if (!inSync) {
        violations.push({ rule: 'R11', file, detail: 'out of sync — run node tools/build.mjs' });
      }
    }
  } catch (err) {
    violations.push({
      rule: 'R11',
      file: fileForRegion(err.regionName),
      detail: `could not regenerate regions — malformed marker: ${err.message}`,
    });
  }

  const catalog = JSON.parse(readFileSync(path.join(root, 'catalog.json'), 'utf8'));
  const normalize = (f) => f.split(path.sep).join('/');
  const catalogFiles = new Set(catalog.items.map((it) => normalize(it.file)));
  const diskFiles = new Set(entries.map((e) => normalize(e.file)));

  for (const f of catalogFiles) {
    if (!diskFiles.has(f)) {
      violations.push({
        rule: 'R11',
        file: 'catalog.json',
        detail: `catalog item "${f}" has no corresponding file on disk`,
      });
    }
  }
  for (const f of diskFiles) {
    if (!catalogFiles.has(f)) {
      violations.push({
        rule: 'R11',
        file: 'catalog.json',
        detail: `on-disk scaffold "${f}" is missing from catalog.json`,
      });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// R12 — the facet vocabulary stays closed and useful.
// Repo-level: reads catalog.json once and checks it against tools/canon/facets.json.
//   a) every item carries >=1 facet (no card is unreachable by the filter);
//   b) every facet used is in the closed vocabulary (no drift back to 160 tags);
//   c) every facet in the vocabulary is carried by >=1 item (no dead chips);
//   d) every facet spans >=2 categories — a facet confined to one category is
//      redundant with the rail, which is the whole reason facets exist;
//   e) every vocabulary key matches the delimiter-safe syntax the wire
//      formats assume — build.mjs joins keys with a SPACE into
//      `data-facets` and the URL joins with a COMMA, so a key containing
//      either character would generate a chip with a correct nonzero count
//      that silently selects zero cards. `before/after` (slash) is the one
//      existing key with a non-alnum character and must still pass.
// ---------------------------------------------------------------------------

const FACET_KEY_RE = /^[a-z0-9/+-]+$/;

// `facets` defaults to the real vocabulary but is injectable so tests can
// exercise a malformed-key vocabulary without touching tools/canon/facets.json.
function ruleR12({ root, facets = CANON_FACETS }) {
  const violations = [];
  const catalog = JSON.parse(readFileSync(path.join(root, 'catalog.json'), 'utf8'));
  const vocab = new Set(facets.map((f) => f.key));
  const spans = new Map(); // facet key -> Set of category keys

  for (const { key } of facets) {
    if (!FACET_KEY_RE.test(key)) {
      violations.push({
        rule: 'R12',
        file: path.join('tools', 'canon', 'facets.json'),
        detail: `facet "${key}" contains a character outside [a-z0-9/+-] — the space/comma wire delimiters must not appear in a key`,
      });
    }
  }

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

  for (const { key } of facets) {
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

// ---------------------------------------------------------------------------
// Rule registry — per-file rules R1-R9. Extensibility point: later tasks
// (Task 5+) add repo-level rules (rules that see the whole tree, not one
// file at a time) via REPO_RULES below, without touching this array.
// ---------------------------------------------------------------------------

export const RULES = [
  { id: 'R1', fn: ruleR1 },
  { id: 'R2', fn: ruleR2 },
  { id: 'R3', fn: ruleR3 },
  { id: 'R4', fn: ruleR4 },
  { id: 'R5', fn: ruleR5 },
  { id: 'R6', fn: ruleR6 },
  { id: 'R7', fn: ruleR7 },
  { id: 'R8', fn: ruleR8 },
  { id: 'R9', fn: ruleR9 },
];

/** Repo-level rules: fn({ root, entries }) -> [{ rule, file, detail }, ...]. */
export const REPO_RULES = [ruleR10, ruleR11, ruleR12];

// Rule ids implemented by REPO_RULES, purely so the CLI summary can print a
// "0" line for a repo-level rule even when it finds nothing to flag (mirrors
// the per-file RULES seeding just above).
const REPO_RULE_IDS = ['R10', 'R11', 'R12'];

/**
 * Run all per-file RULES against `html`.
 * @param {string} html
 * @param {{file: string, group: 'layouts'|'info-design'}} ctx
 * @returns {{rule: string, file: string, detail: string}[]}
 */
export function checkContent(html, ctx) {
  const violations = [];
  for (const { id, fn } of RULES) {
    const details = fn(html, ctx) || [];
    for (const detail of details) {
      violations.push({ rule: id, file: ctx.file, detail });
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function inferGroup(filePath) {
  const base = path.basename(filePath);
  const normalized = filePath.split(path.sep).join('/');
  if (normalized.includes('info-design/') || /^i\d+-/.test(base)) {
    return 'info-design';
  }
  return 'layouts';
}

function resolveEntries(fileArgs) {
  if (fileArgs.length > 0) {
    return fileArgs.map((f) => ({ file: f, group: inferGroup(f) }));
  }
  return listScaffolds(REPO_ROOT);
}

function main() {
  const args = process.argv.slice(2);
  const reportMode = args.includes('--report');
  const fileArgs = args.filter((a) => a !== '--report');

  const entries = resolveEntries(fileArgs);

  const allViolations = [];
  let readErrors = 0;
  for (const entry of entries) {
    const fullPath = path.isAbsolute(entry.file) ? entry.file : path.join(REPO_ROOT, entry.file);
    let html;
    try {
      html = readFileSync(fullPath, 'utf8');
    } catch (err) {
      // A bad path from the CLI (typo, missing file) must not throw a raw
      // stack. Report cleanly, count it as an error, and keep going.
      console.error(`check: cannot read ${entry.file}: ${err.code || err.message}`);
      readErrors++;
      continue;
    }
    allViolations.push(...checkContent(html, { file: entry.file, group: entry.group }));
  }

  for (const repoRule of REPO_RULES) {
    allViolations.push(...repoRule({ root: REPO_ROOT, entries }));
  }

  for (const v of allViolations) {
    console.log(`${v.rule}\t${v.file}\t${v.detail}`);
  }

  const byRule = {};
  for (const { id } of RULES) byRule[id] = 0;
  for (const id of REPO_RULE_IDS) byRule[id] = 0;
  for (const v of allViolations) byRule[v.rule] = (byRule[v.rule] || 0) + 1;
  const filesWithViolations = new Set(allViolations.map((v) => v.file)).size;

  console.log('--- summary ---');
  for (const [rule, count] of Object.entries(byRule)) {
    console.log(`${rule}: ${count}`);
  }
  console.log(`TOTAL: ${allViolations.length} violations across ${filesWithViolations} files`);

  // A file that couldn't be read is an operational error (bad CLI input), not
  // a scaffold violation, so it fails the run even under --report. --report
  // still only *suppresses* the exit-1 for actual violations.
  if (readErrors > 0) {
    process.exitCode = 1;
    return;
  }
  if (!reportMode && allViolations.length > 0) {
    process.exitCode = 1;
    return;
  }
  process.exitCode = 0;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
