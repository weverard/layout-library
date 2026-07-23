#!/usr/bin/env node
// tools/migrate/extract-catalog.mjs
//
// Extracts catalog.json — the single source of truth for all 107 scaffolds
// (71 layouts + 36 info-design charts) — from index.html (cards + category
// headings), merged with info-design/chooser.html (chart metadata:
// cat/shape/verbs/when). Zero deps, pure Node built-ins.
//
// Idempotent: category intros and title aliases are authored inline (INTROS
// and ALIASES below), injected during generation, so re-running reproduces the
// same catalog.json.
//
// Read-only sources: index.html, info-design/chooser.html. Never edited.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const INDEX_HTML = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CHOOSER_HTML = readFileSync(path.join(ROOT, 'info-design', 'chooser.html'), 'utf8');

// ---------------------------------------------------------------------------
// Category intros — authored by hand, keyed by category `key`. 1-2 sentences
// each, extending the heading with a concrete "what's in it" / "reach for
// this when" pattern (matching the two worked examples in the task brief).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Title aliases — authored by hand, keyed by item `id`. The common alternative
// name, or a scope note, that the pre-generator README and chooser carried in
// parentheses after the title. Not derivable from index.html: the card `<h3>`
// has always been the plain title, and stays that way. build.mjs appends these
// in the README and chooser listings only.
// ---------------------------------------------------------------------------

const ALIASES = {
  24: '3D',
  52: 'deck',
  55: 'Shopping Research + Instant Checkout',
  60: 'mobile chat + bottom-sheet checkout',
  i11: 'joyplot',
};

const INTROS = {
  foundations:
    'The app and document shells most products start from — sidebars, top bars, split panes. Fork one of these when the structure should disappear behind the content.',
  spatial:
    'Layouts where the interface is literally a space you move through — canvases, maps, floors, isometric scenes. Reach for these when "where am I" matters as much as what\'s on screen.',
  'sequence-story':
    'Layouts where moving through content in order, start to finish, is the whole point — timelines, filmstrips, page-turns. Fork one when the content is a story, not a menu.',
  'command-conversation':
    'Interfaces you drive by typing or talking instead of clicking — command palettes, terminals, chat, voice. Fork one when the fastest way in is a keyboard or a microphone.',
  'objects-cards':
    'Layouts that treat each piece of content as a physical thing — cards, decks, boards, a departure display. Reach for these when items should feel handled, not just listed.',
  immersive:
    'Full-bleed, cinematic layouts built to hold attention — flythroughs, spotlights, posters. Fork one for a launch page or a moment that should feel like a scene, not a form.',
  'slides-frames':
    "16:9 presentation frames — a KPI slide, a quadrant matrix, a roadmap lane. These are layout mechanics for a deck, not a chart; reach for one when the deliverable is something someone will present.",
  'agentic-commerce':
    'Chat surfaces built around an agent that can actually buy things — shopping chat, checkout journeys, approval queues. Fork one when the product is commerce conducted in conversation.',
  comparison:
    'Charts that set two or more things side by side so the gap is the message. Reach for these when someone asks "which is bigger, and by how much?"',
  'trend-time-series':
    'Charts about the shape of change over time — a line with a confidence band, a streamgraph, a bump chart of ranks. Reach for these when the question is how something got here.',
  'part-to-whole':
    'Charts that break one total into its named pieces — a waffle grid, a treemap, a stacked bar with leader labels. Reach for these when the whole matters as much as any single part.',
  distribution:
    'Charts that show the spread and shape of many values, not just their average — histograms, ridgelines, beeswarms. Reach for these when the outliers are the story, not the mean.',
  correlation:
    'Charts that show how two or more measures move together — a scatter with a trendline, a bubble quadrant, a connected scatter. Reach for these when the relationship matters more than either metric alone.',
  ranking:
    'Charts built to put things in order, best to worst — ordered bars, a lollipop against a benchmark, a league table. Reach for these when "where do we stand" is the whole question.',
  'flow-process':
    'Charts that trace where something moves or drops off — a sankey, a funnel, a chord diagram. Reach for these when the path between stages matters more than any single stage.',
  'hierarchy-network':
    'Charts for structure — a radial tree, a network graph, an icicle partition. Reach for these when the data has parents, children, or connections worth drawing.',
  'table-heatmap':
    'Dense, exact views for reading many values at once — a calendar heatmap, a matrix with marginal totals, a sparkline table. Reach for these when a reader needs the precise number, not just the shape.',
  geospatial:
    'Charts that put data on a map or a map-like grid — a tile cartogram, a symbol map, a flow map of arcs. Reach for these when where something happens is the insight.',
  pictorial:
    'Charts that make a number feel human — an icon array, proportional shapes, a big-number lead. Reach for these when a reader should feel a rate, not just read it.',
  'dashboard-multi-chart':
    "Multi-chart views built for a recurring review — a KPI wall, small multiples, a narrative dashboard with annotations. Reach for these when one chart alone can't carry the whole update.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decodeEntities(s) {
  // The only entity present anywhere in index.html is &amp; (in category
  // headings, e.g. "Slides &amp; frames").
  return s.replace(/&amp;/g, '&');
}

function kebabKey(headingUpToDash) {
  return headingUpToDash
    .toLowerCase()
    .replace(/[\s&/]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Extract the full `<div class="tw ...">...</div>` node verbatim from a
// card's inner HTML, balancing nested <div>s (several thumbs nest 2-3 divs
// deep, e.g. t-side: rail + colx > top + g2 > b2, b2).
function extractThumb(cardHtml) {
  const startIdx = cardHtml.indexOf('<div class="tw');
  if (startIdx === -1) throw new Error('no .tw thumb found in card html');
  const tagRe = /<div\b[^>]*>|<\/div>/g;
  tagRe.lastIndex = startIdx;
  let depth = 0;
  let m;
  while ((m = tagRe.exec(cardHtml))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return cardHtml.slice(startIdx, tagRe.lastIndex);
  }
  throw new Error('unbalanced .tw div in card html');
}

function sentenceCase(s) {
  const withCap = s.charAt(0).toUpperCase() + s.slice(1);
  return /[.!?]$/.test(withCap) ? withCap : `${withCap}.`;
}

// ---------------------------------------------------------------------------
// Step 1a/1b: walk index.html top-to-bottom, tracking the current category
// heading as we pass it, so every card is assigned to the most recent
// preceding <p class="cat">.
// ---------------------------------------------------------------------------

const categories = [];
const items = [];

const walkRe =
  /<p class="cat">([^<]+)<\/p>|<a class="card" href="([^"]+)" style="--accent:([^"]+)">([\s\S]*?)<\/a>/g;
let currentCategoryKey = null;
let m;

while ((m = walkRe.exec(INDEX_HTML))) {
  if (m[1] !== undefined) {
    // --- category heading ---
    const fullText = decodeEntities(m[1]).trim();
    const dashIdx = fullText.indexOf('—');
    const upToDash = dashIdx === -1 ? fullText : fullText.slice(0, dashIdx).trim();
    const key = kebabKey(upToDash);
    currentCategoryKey = key;
    categories.push({ key, group: null, name: fullText, intro: INTROS[key] });
  } else {
    // --- card ---
    const href = m[2];
    const accent = m[3];
    const cardHtml = m[4];
    const group = href.startsWith('layouts/') ? 'layouts' : 'info-design';

    const idMatch = cardHtml.match(/<p class="n">([^<]+)<\/p>/);
    const titleMatch = cardHtml.match(/<h3>([^<]*)<\/h3>/);
    const onelinerMatch = cardHtml.match(/<p class="nav">([\s\S]*?)<\/p>/);
    if (!idMatch || !titleMatch || !onelinerMatch) {
      throw new Error(`card parse failed for href=${href}`);
    }
    const tags = [...cardHtml.matchAll(/<span class="tag">([^<]*)<\/span>/g)].map((t) => t[1]);
    const thumb = extractThumb(cardHtml);

    const cat = categories[categories.length - 1];
    if (cat.group === null) cat.group = group; // all cards under one heading share a group

    const id = idMatch[1].trim();

    items.push({
      id,
      group,
      file: href,
      title: titleMatch[1].trim(),
      ...(ALIASES[id] ? { alias: ALIASES[id] } : {}),
      category: currentCategoryKey,
      accent,
      oneliner: onelinerMatch[1],
      tags,
      thumb,
    });
  }
}

// ---------------------------------------------------------------------------
// Step 1c/1d: parse info-design/chooser.html's CATALOG array, merge
// shape/verbs/when onto the matching iNN item, and re-derive the chart
// oneliner (sentence-cased `when`, trailing period). Layout onliners stay
// the verbatim .nav HTML captured above.
// ---------------------------------------------------------------------------

const CATALOG_MARKER = 'CATALOG = ';
const catalogStart = CHOOSER_HTML.indexOf(CATALOG_MARKER);
if (catalogStart === -1) throw new Error('CATALOG marker not found in chooser.html');
const arrayStart = catalogStart + CATALOG_MARKER.length;
const arrayEndIdx = CHOOSER_HTML.indexOf('];', arrayStart);
if (arrayEndIdx === -1) throw new Error('closing "];" not found after CATALOG in chooser.html');
const arrayLiteral = CHOOSER_HTML.slice(arrayStart, arrayEndIdx + 1); // include closing ']'
const chooserCatalog = new Function('return ' + arrayLiteral)();

const itemsById = new Map(items.map((it) => [it.id, it]));

for (const entry of chooserCatalog) {
  const item = itemsById.get(entry.id);
  if (!item) throw new Error(`chooser.html entry ${entry.id} has no matching index.html card`);
  item.chooserCat = entry.cat;
  item.shape = entry.shape;
  item.verbs = entry.verbs;
  item.when = entry.when;
  item.oneliner = sentenceCase(entry.when);
}

// ---------------------------------------------------------------------------
// Step 1e: write pretty-printed catalog.json — categories first (document
// order), then items (document order).
// ---------------------------------------------------------------------------

const outCategories = categories.map(({ key, group, name, intro }) => ({ key, group, name, intro }));
const outItems = items.map((it) => {
  const base = {
    id: it.id,
    group: it.group,
    file: it.file,
    title: it.title,
    category: it.category,
    accent: it.accent,
    oneliner: it.oneliner,
    tags: it.tags,
    thumb: it.thumb,
  };
  if (it.group === 'info-design') {
    // chooserCat = the chooser's short display label (e.g. "Flow",
    // "Hierarchy") — NOT derivable from `category` by any rule, and needed
    // to regenerate chooser.html's CATALOG byte-faithfully in Task 5.
    base.chooserCat = it.chooserCat;
    base.shape = it.shape;
    base.verbs = it.verbs;
    base.when = it.when;
  }
  return base;
});

const catalog = { categories: outCategories, items: outItems };
writeFileSync(path.join(ROOT, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');

const layoutCount = outItems.filter((i) => i.group === 'layouts').length;
const infoDesignCount = outItems.filter((i) => i.group === 'info-design').length;
console.log(
  `Wrote catalog.json: ${outCategories.length} categories, ${outItems.length} items ` +
    `(${layoutCount} layouts, ${infoDesignCount} info-design).`
);
