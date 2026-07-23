// Canonical shared helpers. A scaffold inlines only what it uses, but any function
// bearing one of these names must match these bodies (whitespace-normalized).
// xOf/yOf are chart-specific and exempt. Module vars used: svgns, chip, figureEl.
// showChip/attachHover are ALSO chart-specific and exempt (Amended 2026-07-21;
// see docs/superpowers/specs/2026-07-11-consistency-cleanup-design.md) — removed
// together since canon attachHover's body called showChip.
function el(name, attrs){
  var e = document.createElementNS(svgns, name);
  for(var k in attrs){ e.setAttribute(k, attrs[k]); }
  return e;
}
function hideChip(){ chip.classList.remove('on'); }
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
