#!/usr/bin/env node
// tools/build.mjs
//
// Regenerates the generated regions (marked by `gen:<name>` comment pairs) in
// README.md, info-design/chooser.html, and index.html from catalog.json — the
// single source of truth for all 107 scaffolds (71 layouts + 36 info-design
// charts) and all 20 categories. index.html carries one marker pair per
// category key (`gen:index-cards:<key>`), each holding that category's
// generated `.asset-card` grid.
// Idempotent: a second run produces zero diff. Zero dependencies — Node >=20
// built-ins only.
//
// CLI:
//   node tools/build.mjs
//
// Programmatic API (consumed by tools/test/build.test.mjs and
// tools/check.mjs's R11):
//   buildRegions(root) -> [{file, content}, ...]   in-memory, no writes
//   checkInSync(root)  -> [{file, inSync}, ...]     compares to on-disk bytes
//   build(root)        -> writes buildRegions(root) to disk, returns it

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CANON_FACETS } from './lib/scaffolds.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const README_FILE = 'README.md';
const CHOOSER_FILE = path.join('info-design', 'chooser.html');
const INDEX_FILE = 'index.html';

const LINE_WIDTH = 76;

// ---------------------------------------------------------------------------
// Hand-authored annotations that live inside the generated
// readme-layout-catalog region but aren't derivable from catalog.json — they
// carry editorial context (a scope note, a changelog aside), not scaffold
// metadata. Keyed by category `key`, emitted verbatim immediately after that
// category's entry line(s), no blank line in between (matching the pre-gen
// README). Mirrors the INTROS pattern in tools/migrate/extract-catalog.mjs.
// ---------------------------------------------------------------------------

const LAYOUT_CATEGORY_ANNOTATIONS = {
  'slides-frames':
    '> 16:9 slide *frames* — each renders as a centered slide stage\n' +
    '> (`aspect-ratio: 16/9`, scales to the viewport). These are layout mechanics\n' +
    '> for presentation-shaped pages; data *figures* (charts) are info-design\n' +
    '> territory and live in the separate info-design collection, not here.',
  'agentic-commerce':
    '> Set of 9 (grown 6 → 9 on 2026-07-04 with `61`–`63`). `55` (desktop) and `60`\n' +
    '> (mobile) are illustrative ChatGPT-style homages (fictional products/merchants);\n' +
    "> `60` reuses `55`'s flow in a phone frame with checkout as a slide-up bottom\n" +
    '> sheet. `61` pairs a chat rail with a persistent product canvas, `62` is an\n' +
    '> approve/edit/reject proposal queue, `63` grows a comparison tray from chat\n' +
    '> mentions.',
};

// ---------------------------------------------------------------------------
// catalog.json
// ---------------------------------------------------------------------------

export function readCatalog(root = ROOT) {
  const raw = readFileSync(path.join(root, 'catalog.json'), 'utf8');
  return JSON.parse(raw);
}

function itemsInCategory(catalog, key) {
  return catalog.items.filter((it) => it.category === key);
}

/**
 * Title as it reads in the prose catalogs (README, chooser). An optional
 * `alias` carries the common alternative name or a scope note — "Cover Flow
 * (3D)", "Ridgeline (joyplot)" — which the pre-generator README and chooser
 * both carried by hand. Deliberately NOT used by buildAssetCard: the index
 * card `<h3>` has always been the plain title, and one alias is long enough
 * to break a card heading.
 * @param {{title: string, alias?: string}} item
 * @returns {string}
 */
function displayTitle(item) {
  return item.alias ? `${item.title} (${item.alias})` : item.title;
}

// ---------------------------------------------------------------------------
// replaceRegion — generic marker-region engine.
//
// `kind` selects the marker comment syntax; `name` is the region name. Finds
// exactly one start + one end marker (throws otherwise), and replaces only
// the text strictly between the marker LINES with `newBody`, preserving the
// marker lines themselves and everything outside the region untouched.
// ---------------------------------------------------------------------------

const MARKER_SYNTAX = {
  html: (name) => ({ start: `<!-- gen:${name} start -->`, end: `<!-- gen:${name} end -->` }),
  js: (name) => ({ start: `// gen:${name} start`, end: `// gen:${name} end` }),
};

function countOccurrences(text, needle) {
  let count = 0;
  let idx = text.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = text.indexOf(needle, idx + needle.length);
  }
  return count;
}

/**
 * @param {string} text
 * @param {string} name
 * @param {'html'|'js'} kind
 * @param {string} newBody
 * @returns {string}
 */
export function replaceRegion(text, name, kind, newBody) {
  const makeMarkers = MARKER_SYNTAX[kind];
  if (!makeMarkers) throw new Error(`replaceRegion: unknown kind "${kind}"`);
  const { start, end } = makeMarkers(name);

  // Malformed-marker errors carry `regionName` so a caller (check.mjs's R11)
  // can turn them into a reported violation attributed to the right file,
  // rather than letting the throw escape and abort the whole run.
  const markerError = (marker, count) => {
    const err = new Error(`replaceRegion: expected exactly one "${marker}", found ${count}`);
    err.regionName = name;
    return err;
  };

  const startCount = countOccurrences(text, start);
  if (startCount !== 1) throw markerError(start, startCount);
  const endCount = countOccurrences(text, end);
  if (endCount !== 1) throw markerError(end, endCount);

  const startIdx = text.indexOf(start);
  const endIdx = text.indexOf(end);
  if (endIdx <= startIdx) {
    const err = new Error(`replaceRegion: end marker for "${name}" appears before start marker`);
    err.regionName = name;
    throw err;
  }

  // Keep the start marker's own line intact; the region begins on the line
  // right after it.
  const startLineEnd = text.indexOf('\n', startIdx + start.length) + 1;
  // Keep the end marker's own line intact; the region ends right before it
  // (lastIndexOf so a marker line with leading indentation is preserved).
  const endLineStart = text.lastIndexOf('\n', endIdx) + 1;

  const before = text.slice(0, startLineEnd);
  const after = text.slice(endLineStart);
  const body = newBody.replace(/\n+$/, ''); // single trailing-newline convention, added back below

  return `${before}${body}\n${after}`;
}

// ---------------------------------------------------------------------------
// readme-layout-catalog
// ---------------------------------------------------------------------------

function wrapCategoryEntries(tokens, width = LINE_WIDTH) {
  const lines = [];
  let current = [];
  for (const tok of tokens) {
    if (current.length === 0) {
      current = [tok];
      continue;
    }
    // Conservative check: assumes a trailing " ·" may still be appended if
    // more tokens follow, so a line we push is always <= width.
    const candidate = `${current.join(' · ')} · ${tok} ·`;
    if (candidate.length <= width) {
      current.push(tok);
    } else {
      lines.push(`${current.join(' · ')} ·`);
      current = [tok];
    }
  }
  if (current.length > 0) lines.push(current.join(' · '));
  return lines;
}

function buildReadmeLayoutCatalog(catalog) {
  const layoutCategories = catalog.categories.filter((c) => c.group === 'layouts');

  const blocks = layoutCategories.map((cat) => {
    const items = itemsInCategory(catalog, cat.key);
    const tokens = items.map((it) => `\`${it.id}\` ${displayTitle(it)}`);
    const lines = wrapCategoryEntries(tokens);
    const annotation = LAYOUT_CATEGORY_ANNOTATIONS[cat.key];
    const parts = [`**${cat.name}**`, ...lines];
    if (annotation) parts.push(annotation);
    return parts.join('\n');
  });

  return blocks.join('\n\n');
}

// ---------------------------------------------------------------------------
// readme-info-catalog
// ---------------------------------------------------------------------------

function capitalizeFirstLetter(s) {
  const idx = s.search(/[a-zA-Z]/);
  if (idx === -1) return s;
  return s.slice(0, idx) + s[idx].toUpperCase() + s.slice(idx + 1);
}

function toBestFor(when) {
  return capitalizeFirstLetter(when).replace(/\.$/, '');
}

function escapeCell(s) {
  return String(s).replace(/\|/g, '\\|');
}

function buildReadmeInfoCatalog(catalog) {
  const infoCategories = catalog.categories.filter((c) => c.group === 'info-design');

  const blocks = infoCategories.map((cat) => {
    const items = itemsInCategory(catalog, cat.key);
    const rows = items.map((it) => {
      const title = escapeCell(displayTitle(it));
      const shape = escapeCell(it.shape);
      const bestFor = escapeCell(toBestFor(it.when));
      return `| \`${it.id}\` | ${title} | ${shape} | ${bestFor} |`;
    });
    return [
      `**${cat.name}**`,
      '',
      '| # | Chart | Data shape | Best for |',
      '|---|---|---|---|',
      ...rows,
    ].join('\n');
  });

  return blocks.join('\n\n');
}

// ---------------------------------------------------------------------------
// readme-facets
// ---------------------------------------------------------------------------

// One line per vocabulary facet, in CANON_FACETS display order — mirrors the
// hand-written list this region replaced. Driven by tools/canon/facets.json,
// not catalog.json, so it lists the vocabulary itself (including a facet
// that briefly carried zero items would still show up here; R12 is what
// catches that, this region just mirrors the closed vocabulary verbatim).
function buildReadmeFacets() {
  return CANON_FACETS.map(({ key, blurb }) => `- \`${key}\` — ${blurb}`).join('\n');
}

// ---------------------------------------------------------------------------
// chooser-catalog
// ---------------------------------------------------------------------------

function jsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function buildChooserCatalog(catalog) {
  const infoItems = catalog.items.filter((it) => it.group === 'info-design');

  const lines = infoItems.map((it) => {
    const href = path.basename(it.file);
    const verbs = it.verbs.map((v) => `'${jsEscape(v)}'`).join(',');
    return (
      `    {id:'${jsEscape(it.id)}', title:'${jsEscape(displayTitle(it))}', cat:'${jsEscape(it.chooserCat)}', ` +
      `href:'${jsEscape(href)}', shape:'${jsEscape(it.shape)}', verbs:[${verbs}], when:'${jsEscape(it.when)}'},`
    );
  });

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// index-cards (one marker pair per catalog category, in index.html)
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

function buildIndexCardsRegion(catalog, key) {
  return itemsInCategory(catalog, key)
    .map(buildAssetCard)
    .join('\n');
}

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

// ---------------------------------------------------------------------------
// buildRegions / checkInSync / build
// ---------------------------------------------------------------------------

/**
 * Regenerate all three regions in memory. Never writes.
 * @param {string} root
 * @returns {{file: string, content: string}[]}
 */
export function buildRegions(root = ROOT) {
  const catalog = readCatalog(root);

  const readmePath = path.join(root, README_FILE);
  const chooserPath = path.join(root, CHOOSER_FILE);
  const indexPath = path.join(root, INDEX_FILE);
  const readmeSrc = readFileSync(readmePath, 'utf8');
  const chooserSrc = readFileSync(chooserPath, 'utf8');
  const indexSrc = readFileSync(indexPath, 'utf8');

  let readmeOut = replaceRegion(readmeSrc, 'readme-layout-catalog', 'html', buildReadmeLayoutCatalog(catalog));
  readmeOut = replaceRegion(readmeOut, 'readme-info-catalog', 'html', buildReadmeInfoCatalog(catalog));
  readmeOut = replaceRegion(readmeOut, 'readme-facets', 'html', buildReadmeFacets());
  const chooserOut = replaceRegion(chooserSrc, 'chooser-catalog', 'js', buildChooserCatalog(catalog));

  let indexOut = replaceRegion(indexSrc, 'facet-bar', 'html', buildFacetBar(catalog));
  for (const cat of catalog.categories) {
    indexOut = replaceRegion(indexOut, `index-cards:${cat.key}`, 'html', buildIndexCardsRegion(catalog, cat.key));
  }

  return [
    { file: README_FILE, content: readmeOut },
    { file: CHOOSER_FILE, content: chooserOut },
    { file: INDEX_FILE, content: indexOut },
  ];
}

/**
 * Compare in-memory regeneration to on-disk bytes, without writing.
 * @param {string} root
 * @returns {{file: string, inSync: boolean}[]}
 */
export function checkInSync(root = ROOT) {
  return buildRegions(root).map(({ file, content }) => {
    const onDisk = readFileSync(path.join(root, file), 'utf8');
    return { file, inSync: onDisk === content };
  });
}

/**
 * Regenerate and write to disk.
 * @param {string} root
 * @returns {{file: string, content: string}[]}
 */
export function build(root = ROOT) {
  const regions = buildRegions(root);
  for (const { file, content } of regions) {
    writeFileSync(path.join(root, file), content);
  }
  return regions;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const regions = build(ROOT);
  for (const { file } of regions) {
    console.log(`Regenerated ${file}`);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
