// tools/lib/scaffolds.mjs
//
// Shared parsing library for the 107 single-file scaffolds in layouts/ and
// info-design/. Zero dependencies — Node >=20 built-ins only. Consumed by the
// contract checker, catalog extractor, and codemods (Tasks 3-7 of the
// consistency-cleanup plan).

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CANON_DIR = path.join(__dirname, '..', 'canon');

// ---------------------------------------------------------------------------
// listScaffolds
// ---------------------------------------------------------------------------

/**
 * List every scaffold HTML file under `root`.
 * @param {string} root - repo root (contains layouts/ and info-design/).
 * @returns {{file: string, group: 'layouts'|'info-design'}[]}
 */
export function listScaffolds(root) {
  const entries = [];

  const layoutsDir = path.join(root, 'layouts');
  for (const f of readdirSync(layoutsDir).sort()) {
    if (!f.endsWith('.html')) continue;
    entries.push({ file: path.join('layouts', f), group: 'layouts' });
  }

  const infoDir = path.join(root, 'info-design');
  for (const f of readdirSync(infoDir).sort()) {
    // Info-design scaffolds are named i<NN>-slug.html. This naturally
    // excludes chooser.html (and any future non-scaffold file).
    if (!/^i\d+-.*\.html$/.test(f)) continue;
    entries.push({ file: path.join('info-design', f), group: 'info-design' });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// CSS declaration-block parsing (shared by extractRoot and the canon loader)
// ---------------------------------------------------------------------------

/**
 * Parse a `name:value;` declaration block (the inside of a :root{...}),
 * stripping CSS comments first so comments containing literal `;` (as used
 * in tools/canon/tokens.css's placeholder annotations) don't corrupt the
 * split.
 * @param {string} block
 * @returns {{name: string, value: string}[]}
 */
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

// ---------------------------------------------------------------------------
// extractRoot
// ---------------------------------------------------------------------------

/**
 * Extract the first `:root{...}` block from a scaffold's HTML.
 * @param {string} html
 * @returns {{raw: string, decls: {name: string, value: string}[]}}
 */
export function extractRoot(html) {
  const m = html.match(/:root\s*\{([^}]*)\}/);
  if (!m) return { raw: '', decls: [] };
  const raw = m[1];
  return { raw, decls: parseDeclBlock(raw) };
}

// ---------------------------------------------------------------------------
// extractHeader
// ---------------------------------------------------------------------------

// A field-start line: leading whitespace, an UPPERCASE key (letters, spaces,
// hyphens — e.g. "RE-SKIN", "NAV MODEL"), then 2+ spaces, then the value.
const HEADER_KEY_LINE = /^[ \t]*([A-Z][A-Z\- ]*?)[ \t]{2,}(.*)$/;

/**
 * Extract the doc-comment header (the `<!-- ... -->` block immediately
 * after `<title>`) from a scaffold's HTML.
 * @param {string} html
 * @returns {{raw: string, fields: {key: string, value: string}[]}}
 */
export function extractHeader(html) {
  const titleIdx = html.indexOf('</title>');
  const searchFrom = titleIdx === -1 ? html : html.slice(titleIdx + '</title>'.length);
  const m = searchFrom.match(/<!--([\s\S]*?)-->/);
  if (!m) return { raw: '', fields: [] };

  const raw = m[1];
  const fields = [];
  for (const line of raw.split('\n')) {
    if (line.trim() === '') continue;
    const km = line.match(HEADER_KEY_LINE);
    if (km) {
      fields.push({ key: km[1].trim(), value: km[2].trim() });
    } else if (fields.length > 0) {
      const last = fields[fields.length - 1];
      last.value = `${last.value} ${line.trim()}`.trim();
    }
  }
  return { raw, fields };
}

// ---------------------------------------------------------------------------
// extractTitle
// ---------------------------------------------------------------------------

/**
 * Extract the <title> text of a scaffold.
 * @param {string} html
 * @returns {string}
 */
export function extractTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/);
  return m ? m[1].trim() : '';
}

// ---------------------------------------------------------------------------
// Canon reference data — parsed once at module load from tools/canon/*.
// ---------------------------------------------------------------------------

/** @type {string[]} 16 canonical :root token names, in canonical order. */
export const CANON_TOKENS = parseCanonTokens(
  readFileSync(path.join(CANON_DIR, 'tokens.css'), 'utf8')
);

/** @type {Record<string, string>} helper name -> canonical body source. */
export const CANON_HELPERS = parseCanonHelpers(
  readFileSync(path.join(CANON_DIR, 'helpers.js'), 'utf8')
);

/** @type {{key: string, label: string, blurb: string}[]} closed facet vocabulary, display order. */
export const CANON_FACETS = loadCanonFacets(path.join(CANON_DIR, 'facets.json'));

/**
 * Load and validate tools/canon/facets.json. Throws a clear, file-naming
 * error for the two ways this file can go wrong — bad JSON, or valid JSON
 * missing the `facets` array — instead of a raw JSON.parse SyntaxError or a
 * "Cannot read properties of undefined (reading 'map')" surfacing from deep
 * inside buildFacetBar/ruleR12 with no clue where the real problem is.
 * @param {string} facetsPath
 * @returns {{key: string, label: string, blurb: string}[]}
 */
function loadCanonFacets(facetsPath) {
  const raw = readFileSync(facetsPath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${facetsPath}: invalid JSON — ${err.message}`);
  }
  if (!Array.isArray(parsed.facets)) {
    throw new Error(`${facetsPath}: expected a top-level "facets" array, found ${JSON.stringify(parsed.facets)}`);
  }
  return parsed.facets;
}

function parseCanonTokens(cssSource) {
  const m = cssSource.match(/:root\s*\{([^}]*)\}/);
  if (!m) return [];
  return parseDeclBlock(m[1]).map((d) => d.name);
}

function parseCanonHelpers(jsSource) {
  // Drop leading `//` comment lines, then split into chunks that each start
  // at a line beginning with `function `.
  const body = jsSource.replace(/^\/\/.*$/gm, '').trim();
  const chunks = body.split(/(?=^function )/m).filter((s) => s.trim());

  const helpers = {};
  for (const chunk of chunks) {
    const m = chunk.match(/^function\s+(\w+)/);
    if (m) helpers[m[1]] = chunk.trim();
  }
  return helpers;
}
