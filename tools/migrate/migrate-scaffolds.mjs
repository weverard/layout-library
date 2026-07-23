#!/usr/bin/env node
// tools/migrate/migrate-scaffolds.mjs
//
// Codemod: migrates one group of scaffolds (layouts/ or info-design/) to the
// canonical :root token vocabulary + canon helper bodies from tools/canon/,
// with zero intended visual/behavioral change. Zero deps, pure Node built-ins.
//
// CLI:
//   node tools/migrate/migrate-scaffolds.mjs --group layouts|info-design [--dry]
//     --group   required. Which scaffold group to migrate.
//     --dry     print the per-file change summary, write nothing.
//
// Per file (each a no-op if already canonical):
//   0. --panel -> --surface (info-design/ ONLY) — rename the :root decl and
//      every var(--panel) use to --surface, verbatim, before Step 1 runs.
//   1. Token block  — reorder the :root first-16 to canonical order, keeping
//      existing values; insert missing canon tokens at documented defaults;
//      preserve any extra file-specific tokens after the 16, order untouched.
//   2. Helper bodies — for each function named el/hideChip/escHtml (canon set
//      as of the 2026-07-21 amendment; showChip/attachHover are chart-
//      specific and exempt, like xOf/yOf): leave it alone if already
//      byte-for-byte (whitespace normalized) canon; if it differs only in
//      whitespace / var-vs-const / parameter names, replace the body with
//      the canon body (provably same behavior); if it differs in real
//      logic, RENAME the function (and every call site) so R4 doesn't
//      dishonestly certify a custom implementation as canon. escHtml is a
//      documented exception to the equivalence check — see the comment on
//      ESC_HTML_NOTE below.
//   3. Header fields — reorder the doc-comment block to the group's profile
//      order (values/wrapping untouched), in case any file's fields are out
//      of order.
//
// Programmatic API (consumed by tools/test/migrate.test.mjs):
//   migrateFile(html, { group }) -> { html, notes, changed }
//   migrateTokenBlock(html) -> { html, changed, notes }
//   migrateHelpers(html) -> { html, notes }
//   reorderHeaderIfNeeded(html, group) -> { html, changed }

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { listScaffolds, CANON_TOKENS, CANON_HELPERS } from '../lib/scaffolds.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// Small shared helpers (deliberately duplicated in spirit from check.mjs's
// private helpers rather than importing them — check.mjs exports nothing but
// checkContent/RULES/REPO_RULES, and these are simple enough not to warrant
// widening its public surface just for this codemod).
// ---------------------------------------------------------------------------

function normalizeWs(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Extract `function name(...) { ... }` starting at `startIdx` (index of the
 * `function` keyword), returning the full source up to the balanced closing
 * brace. Mirrors check.mjs's extractBalancedFunction.
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
// Step 0 (info-design only): --panel -> --surface
// ---------------------------------------------------------------------------

// info-design/'s legacy name for its card-background token; tools/canon/
// tokens.css calls this --surface (layouts/ already used that name before
// Task 6 ever ran). This must run — and be renamed — BEFORE migrateTokenBlock
// (Step 1) sees the :root block, so the renamed decl is recognized as an
// ordinary already-present `--surface` (keeping the file's own value)
// instead of a foreign extra token, which would leave the real --surface
// slot to be filled with a fabricated default.
//
// Scoped strictly to group === 'info-design': layouts/10-timeline-scrubber.html,
// layouts/13-command-palette.html, and layouts/61-agent-canvas.html each
// declare their OWN unrelated file-specific `--panel` extra token (preserved
// untouched after the canonical 16 per Task 6) — renaming those would be
// wrong, so this step must never run against the layouts/ group.
const PANEL_RE = /--panel\b/g;

/**
 * Rename every `--panel` occurrence — the :root declaration name and every
 * `var(--panel)` use, verbatim elsewhere in the file — to `--surface`.
 * No-op if `--panel` is absent.
 * @param {string} html
 * @returns {{html: string, changed: boolean, varCount: number, totalCount: number}}
 */
function renamePanelToSurface(html) {
  const totalCount = (html.match(PANEL_RE) || []).length;
  if (totalCount === 0) return { html, changed: false, varCount: 0, totalCount: 0 };
  const varCount = (html.match(/var\(--panel\)/g) || []).length;
  const newHtml = html.replace(PANEL_RE, '--surface');
  return { html: newHtml, changed: true, varCount, totalCount };
}

// ---------------------------------------------------------------------------
// Step 1: :root token block
// ---------------------------------------------------------------------------

// Defaults for tokens the brief documents explicitly (Step 1 bullet 1),
// applied ONLY when the token is entirely absent from a file's :root.
// TOKEN_DEFAULTS below also covers the remaining 8 canon token names for the
// rarer case where a layouts/ file omits them too (e.g. a pure-monochrome
// scaffold with no --accent at all). Verified before writing this codemod
// (see task-6-report.md) that none of these names are referenced via
// `var(--name)` anywhere in a file that omits their declaration — so an
// inserted default is inert: it cannot change anything rendered.
const TOKEN_DEFAULTS = {
  '--accent': '#000',
  '--accent-ink': '#fff',
  '--bg': '#fff',
  '--surface': '#fff',
  '--ink': '#000',
  '--muted': '#666',
  '--line': 'rgba(0,0,0,.12)',
  '--pos': 'var(--accent)',
  '--neg': '#B3261E',
  '--serif': 'Georgia,"Times New Roman",serif',
  '--sans': 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  '--mono': 'ui-monospace,SFMono-Regular,Menlo,monospace',
  '--s1': '8px',
  '--s2': '14px',
  '--s3': '24px',
  '--s4': '40px',
};

// Visual grouping mirrors tools/canon/tokens.css's own line breaks.
const TOKEN_GROUPS = [
  ['--accent', '--accent-ink'],
  ['--bg', '--surface', '--ink', '--muted', '--line'],
  ['--pos', '--neg'],
  ['--serif'],
  ['--sans', '--mono'],
  ['--s1', '--s2', '--s3', '--s4'],
];

const ROOT_RE = /:root\s*\{[^}]*\}/;

function parseDeclBlock(block) {
  const stripped = block.replace(/\/\*[\s\S]*?\*\//g, '');
  return stripped
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const idx = s.indexOf(':');
      if (idx === -1) return null;
      return { name: s.slice(0, idx).trim(), value: s.slice(idx + 1).trim() };
    })
    .filter(Boolean);
}

/**
 * Reorder a scaffold's :root first-16 into canonical order, preserving
 * existing values, inserting documented defaults for absent canon tokens,
 * and preserving any extra file tokens (order untouched) after the 16.
 * @param {string} html
 * @returns {{html: string, changed: boolean, notes: string[]}}
 */
export function migrateTokenBlock(html) {
  const m = html.match(ROOT_RE);
  if (!m) return { html, changed: false, notes: [] };

  const decls = parseDeclBlock(m[0].slice(m[0].indexOf('{') + 1, -1));
  const byName = new Map(decls.map((d) => [d.name, d.value]));
  const notes = [];

  const idx = html.indexOf(m[0]);
  const lineStart = html.lastIndexOf('\n', idx) + 1;
  const indent = html.slice(lineStart, idx);
  const innerIndent = `${indent}  `;

  const lines = [`${indent}:root{`];
  for (const group of TOKEN_GROUPS) {
    const parts = group.map((name) => {
      if (byName.has(name)) return `${name}:${byName.get(name)};`;
      const def = TOKEN_DEFAULTS[name];
      notes.push(`tokens: inserted missing ${name}:${def} (default; absent + unused in this file)`);
      return `${name}:${def};`;
    });
    lines.push(`${innerIndent}${parts.join(' ')}`);
  }

  const extra = decls.filter((d) => !CANON_TOKENS.includes(d.name));
  for (let i = 0; i < extra.length; i += 3) {
    const chunk = extra
      .slice(i, i + 3)
      .map((d) => `${d.name}:${d.value};`)
      .join(' ');
    lines.push(`${innerIndent}${chunk}`);
  }
  lines.push(`${indent}}`);

  const newRoot = lines.join('\n');
  const changed = newRoot !== html.slice(lineStart, idx + m[0].length);
  if (changed) notes.unshift('tokens: reordered :root to canonical order');

  const newHtml = html.slice(0, lineStart) + newRoot + html.slice(idx + m[0].length);
  return { html: newHtml, changed, notes };
}

// ---------------------------------------------------------------------------
// Step 2: canon helper bodies
// ---------------------------------------------------------------------------

// Step 1.3 of the brief explicitly directs converting `escHtml(str)` to the
// canon `escHtml(s)` body as an unconditional rule, distinct from (and
// governing over) the general equivalence-or-rename rule below — see
// task-6-report.md resolution #2 for the verified-safe reasoning (all call
// sites insert into text-content contexts only, so the extra `"` escaping
// and String() coercion the canon body adds cannot change rendered output).
const ESC_HTML_NOTE =
  'escHtml: canonicalized body per Step 1.3 (param str→s; adds String() coercion + `"` escaping — verified inert at every call site)';

function reindentCanonBody(canonBody, indent) {
  return canonBody
    .split('\n')
    .map((line, i) => (i === 0 || line === '' ? line : indent + line))
    .join('\n');
}

// Splits source into: string literals, identifier/keyword/number runs, or a
// single non-whitespace punctuation/operator character. Whitespace itself is
// never captured — it's simply skipped between matches — which is what lets
// tokenCompare() below ignore incidental spacing around operators
// (`r.width/2` vs `r.width / 2`) and inside call parens (`for(var k in
// attrs)` vs `for (var k in attrs)`), not just runs of whitespace between
// otherwise-identical tokens the way a plain regex-collapse (normalizeWs)
// does.
const TOKEN_RE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|\S/g;

function tokenize(s) {
  return s.match(TOKEN_RE) || [];
}

// Re-joins tokens with exactly one space between two word-like tokens (so
// `var`/`k` stays distinguishable as two identifiers, not "vark") and no
// space anywhere else — collapsing any original spacing difference around
// punctuation/operators down to nothing, on both sides symmetrically, so two
// bodies that differ only in that spacing tokenize to the identical string.
function joinTokensTight(tokens) {
  const isWordChar = (ch) => /[A-Za-z0-9_$]/.test(ch);
  let out = '';
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (i > 0) {
      const prev = tokens[i - 1];
      if (isWordChar(prev[prev.length - 1]) && isWordChar(t[0])) out += ' ';
    }
    out += t;
  }
  return out;
}

const OPEN_BRACKETS = new Set(['(', '[', '{']);
const CLOSE_BRACKETS = new Set([')', ']', '}']);
const IDENT_RE = /^[A-Za-z_$][\w$]*$/;

/**
 * Extract the parameter names from a `function name(a, b, c){` signature, in
 * declaration order. These are bound identifiers — safe to alpha-rename.
 */
function getSignatureParams(s) {
  const sig = s.match(/^function\s+\w+\s*\(([^)]*)\)/);
  if (!sig) return [];
  return sig[1]
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Walk a token stream and collect every identifier declared by a `var`/
 * `let`/`const` statement, in declaration order — covering both an ordinary
 * `var e = ...;` and a `for(var k in attrs)`/`for(var i = 0; ...)` header.
 * These are also bound identifiers, safe to alpha-rename consistently.
 *
 * This is a small hand-rolled scan, not a real parser: it tracks bracket
 * depth only to skip over an initializer's own commas/parens (e.g. the
 * `(svgns, name)` call inside `var e = document.createElementNS(svgns,
 * name);` must not be mistaken for a second declarator), and stops a
 * declaration list at `;`, `in`, `of`, or a bracket that closes past where
 * the declaration started (the `)` ending a `for(...)` header, or the `}`
 * ending a block with no trailing `;`). It is intentionally narrow — these
 * canon helper bodies are a handful of straight-line statements — rather
 * than a general JS declarator parser.
 */
function findDeclaredLocals(tokens) {
  const locals = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t !== 'var' && t !== 'let' && t !== 'const') {
      i++;
      continue;
    }
    i++; // step past the keyword
    let depth = 0;
    let expectName = true;
    while (i < tokens.length) {
      const tok = tokens[i];
      if (depth === 0 && (tok === ';' || tok === 'in' || tok === 'of' || CLOSE_BRACKETS.has(tok))) {
        break; // end of this declaration list — don't consume the terminator
      }
      if (OPEN_BRACKETS.has(tok)) {
        depth++;
        i++;
        continue;
      }
      if (CLOSE_BRACKETS.has(tok)) {
        depth--;
        i++;
        continue;
      }
      if (depth === 0 && tok === ',') {
        expectName = true;
        i++;
        continue;
      }
      if (depth === 0 && tok === '=') {
        expectName = false;
        i++;
        continue;
      }
      if (depth === 0 && expectName && IDENT_RE.test(tok)) {
        locals.push(tok);
        expectName = false;
        i++;
        continue;
      }
      i++; // part of an initializer expression — not a declarator
    }
    // don't advance past the terminator token here; the outer loop's next
    // pass will see it (harmlessly, since it's never itself var/let/const)
  }
  return locals;
}

/**
 * True if `body` and `canon` compute the same thing up to alpha-renaming of
 * bound identifiers (parameters, and any `var`/`let`/`const`-declared local
 * — including a `for(var k in attrs)` loop variable) plus `var`/`let` vs
 * `const` and incidental whitespace (including whitespace around operators/
 * punctuation, not just runs of it — see TOKEN_RE above). These are the only
 * differences Step 1.2 allows a blind body-replacement to paper over.
 *
 * Only identifiers that are genuinely BOUND within the function (declared as
 * a parameter or a var/let/const local) are eligible for this renaming. A
 * free identifier — a module-level var the helper closes over (`svgns`,
 * `chip`, `figureEl`), or a call to another function — is left completely
 * untouched by both sides, so any genuine difference there (a different
 * free variable, a different number of bound params that are actually
 * referenced, different statements/property names) still makes the two
 * bodies compare unequal — a genuine variant is
 * renamed rather than silently overwritten.
 */
function isBehaviorallyEquivalent(body, canon) {
  const normalize = (s) => {
    const params = getSignatureParams(s);
    const tokens = tokenize(s);
    const locals = findDeclaredLocals(tokens);

    // Bound identifiers, in binding order: parameters first (signature
    // order), then each var/let/const local in the order it's declared.
    // First occurrence of a name wins its placeholder slot.
    const placeholder = new Map();
    let idx = 0;
    for (const name of [...params, ...locals]) {
      if (!placeholder.has(name)) {
        placeholder.set(name, `__L${idx}__`);
        idx++;
      }
    }

    const outTokens = tokens.map((t) => {
      if (placeholder.has(t)) return placeholder.get(t);
      if (t === 'var' || t === 'let') return 'const';
      return t; // free identifiers, keywords, literals, punctuation: as-is
    });
    return joinTokensTight(outTokens);
  };
  return normalize(body) === normalize(canon);
}

/**
 * Pick a new name for a canon-named helper whose body is behaviorally
 * different (so R4 stays honest about it no longer being canon `name`).
 */
function deriveRenamedName(name) {
  return `${name}Custom`;
}

/**
 * Migrate every el/hideChip/escHtml declaration in `html` (canon set as of
 * the 2026-07-21 amendment; showChip/attachHover are chart-specific and
 * exempt): already-canon bodies are left alone, behaviorally-equivalent
 * bodies are swapped for the canon text, and behaviorally-different bodies
 * are renamed (declaration + every call site in the file).
 * @param {string} html
 * @returns {{html: string, notes: string[]}}
 */
export function migrateHelpers(html) {
  const notes = [];
  const names = Object.keys(CANON_HELPERS);
  const nameRe = new RegExp(`function\\s+(${names.join('|')})\\s*\\(`, 'g');

  const occurrences = [];
  let m;
  while ((m = nameRe.exec(html))) {
    const name = m[1];
    const startIdx = m.index;
    const body = extractBalancedFunction(html, startIdx);
    if (!body) continue;
    occurrences.push({ name, startIdx, endIdx: startIdx + body.length, body });
  }

  const replacements = [];
  const renames = [];

  for (const occ of occurrences) {
    const canon = CANON_HELPERS[occ.name];
    if (normalizeWs(occ.body) === normalizeWs(canon)) continue; // already canon

    if (occ.name === 'escHtml') {
      const lineStart = html.lastIndexOf('\n', occ.startIdx) + 1;
      const indent = html.slice(lineStart, occ.startIdx);
      replacements.push({
        startIdx: occ.startIdx,
        endIdx: occ.endIdx,
        text: reindentCanonBody(canon, indent),
      });
      notes.push(ESC_HTML_NOTE);
      continue;
    }

    if (isBehaviorallyEquivalent(occ.body, canon)) {
      const lineStart = html.lastIndexOf('\n', occ.startIdx) + 1;
      const indent = html.slice(lineStart, occ.startIdx);
      replacements.push({
        startIdx: occ.startIdx,
        endIdx: occ.endIdx,
        text: reindentCanonBody(canon, indent),
      });
      notes.push(`${occ.name}: replaced body with canon (whitespace / var-const / param-name only differences)`);
    } else {
      const newName = deriveRenamedName(occ.name);
      renames.push({ oldName: occ.name, newName });
      notes.push(`${occ.name}: RENAMED to ${newName} (behaviorally different from canon body — all call sites updated)`);
    }
  }

  replacements.sort((a, b) => a.startIdx - b.startIdx);
  let out = '';
  let cursor = 0;
  for (const r of replacements) {
    out += html.slice(cursor, r.startIdx) + r.text;
    cursor = r.endIdx;
  }
  out += html.slice(cursor);

  for (const { oldName, newName } of renames) {
    out = out.replace(new RegExp(`\\b${oldName}\\b`, 'g'), newName);
  }

  return { html: out, notes };
}

// ---------------------------------------------------------------------------
// Step 3: header field order
// ---------------------------------------------------------------------------

const HEADER_PROFILES = {
  layouts: ['PATTERN', 'NAV MODEL', 'BEST FOR', 'REGIONS', 'RE-SKIN'],
  'info-design': ['CHART', 'DATA SHAPE', 'INSIGHT', 'BEST FOR', 'RE-SKIN'],
};

const HEADER_KEY_LINE = /^[ \t]*([A-Z][A-Z\- ]*?)[ \t]{2,}(.*)$/;

/**
 * Reorder the doc-comment header's fields to the group's profile order.
 * Values/wrapping are untouched — only whole-field blocks are reordered.
 * No-op if the header is missing or already in profile order.
 * @param {string} html
 * @param {'layouts'|'info-design'} group
 * @returns {{html: string, changed: boolean}}
 */
export function reorderHeaderIfNeeded(html, group) {
  const profile = HEADER_PROFILES[group];
  if (!profile) return { html, changed: false };

  const titleIdx = html.indexOf('</title>');
  if (titleIdx === -1) return { html, changed: false };
  const searchFrom = titleIdx + '</title>'.length;
  const rest = html.slice(searchFrom);
  const cm = rest.match(/<!--([\s\S]*?)-->/);
  if (!cm) return { html, changed: false };

  const raw = cm[1];
  const lines = raw.split('\n');
  const blocks = []; // { key: string|null, lines: string[] }
  for (const line of lines) {
    const km = line.match(HEADER_KEY_LINE);
    if (km) {
      blocks.push({ key: km[1].trim(), lines: [line] });
    } else if (blocks.length > 0) {
      blocks[blocks.length - 1].lines.push(line);
    } else {
      blocks.push({ key: null, lines: [line] });
    }
  }

  const currentOrder = blocks.filter((b) => b.key).map((b) => b.key);
  if (arraysEqual(currentOrder, profile)) return { html, changed: false };

  const preamble = blocks.filter((b) => !b.key);
  const byKey = new Map(blocks.filter((b) => b.key).map((b) => [b.key, b]));
  const reordered = [...preamble, ...profile.map((k) => byKey.get(k)).filter(Boolean)];
  // Defensive: any unexpected field not in the profile is kept, appended, so
  // we never silently drop content — but this is not expected to trigger.
  for (const b of blocks) {
    if (b.key && !profile.includes(b.key)) reordered.push(b);
  }

  const newRaw = reordered.map((b) => b.lines.join('\n')).join('\n');
  const newRest = rest.replace(cm[0], `<!--${newRaw}-->`);
  return { html: html.slice(0, searchFrom) + newRest, changed: true };
}

// ---------------------------------------------------------------------------
// Per-file orchestration
// ---------------------------------------------------------------------------

/**
 * Run all three migration steps on one scaffold's HTML.
 * @param {string} html
 * @param {{group: 'layouts'|'info-design'}} ctx
 * @returns {{html: string, notes: string[], changed: boolean}}
 */
export function migrateFile(html, ctx) {
  const notes = [];

  let working = html;
  if (ctx.group === 'info-design') {
    const panelResult = renamePanelToSurface(working);
    if (panelResult.changed) {
      notes.push(
        `tokens: renamed --panel to --surface (${panelResult.totalCount} occurrence` +
          `${panelResult.totalCount === 1 ? '' : 's'}: 1 declaration + ${panelResult.varCount} var() use` +
          `${panelResult.varCount === 1 ? '' : 's'})`
      );
      working = panelResult.html;
    }
  }

  const tokenResult = migrateTokenBlock(working);
  notes.push(...tokenResult.notes);

  const helperResult = migrateHelpers(tokenResult.html);
  notes.push(...helperResult.notes);

  const headerResult = reorderHeaderIfNeeded(helperResult.html, ctx.group);
  if (headerResult.changed) notes.push('header: reordered fields to profile order');

  return { html: headerResult.html, notes, changed: headerResult.html !== html };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const groupFlagIdx = args.indexOf('--group');
  const group = groupFlagIdx !== -1 ? args[groupFlagIdx + 1] : null;

  if (!group || !['layouts', 'info-design'].includes(group)) {
    console.error('Usage: node tools/migrate/migrate-scaffolds.mjs --group layouts|info-design [--dry]');
    process.exitCode = 1;
    return;
  }

  const entries = listScaffolds(REPO_ROOT).filter((e) => e.group === group);

  let filesChanged = 0;
  let tokenRewrites = 0;
  let helperEdits = 0;
  let renameCount = 0;
  let panelFiles = 0;
  let panelVarUses = 0;

  for (const entry of entries) {
    const fullPath = path.join(REPO_ROOT, entry.file);
    const html = readFileSync(fullPath, 'utf8');
    const { html: newHtml, notes, changed } = migrateFile(html, entry);

    if (changed) filesChanged++;
    if (notes.some((n) => n.startsWith('tokens: reordered'))) tokenRewrites++;
    helperEdits += notes.filter((n) => n.includes('replaced body') || n.startsWith('escHtml: canonicalized')).length;
    renameCount += notes.filter((n) => n.includes('RENAMED')).length;
    const panelNote = notes.find((n) => n.startsWith('tokens: renamed --panel'));
    if (panelNote) {
      panelFiles++;
      const vm = panelNote.match(/(\d+) var\(\) use/);
      if (vm) panelVarUses += Number(vm[1]);
    }

    if (notes.length > 0) {
      console.log(`${entry.file}${dry ? ' (dry-run)' : ''}`);
      for (const n of notes) console.log(`  - ${n}`);
    }

    if (!dry && changed) {
      writeFileSync(fullPath, newHtml, 'utf8');
    }
  }

  console.log('--- summary ---');
  console.log(`group: ${group}`);
  console.log(`files scanned: ${entries.length}`);
  console.log(`files changed: ${filesChanged}`);
  console.log(`--panel -> --surface renames: ${panelFiles} files, ${panelVarUses} var() uses`);
  console.log(`token-block rewrites: ${tokenRewrites}`);
  console.log(`helper body replacements: ${helperEdits}`);
  console.log(`helper renames: ${renameCount}`);
  if (dry) console.log('(dry-run — nothing written)');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
