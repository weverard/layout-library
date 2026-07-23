# Scaffold header comment profiles

Every scaffold's `<head>` carries one `<!-- ... -->` doc comment immediately
after `<title>`, before `<style>`. It is a fixed-order key/value block. Each
field starts with an UPPERCASE key (letters and spaces only) followed by two
or more spaces, then its value. A value may wrap onto following lines; wrapped
lines are indented to align under the value column and carry no key — they are
appended to the previous field's value.

There are two profiles, sharing a `BEST FOR` / `RE-SKIN` core:

## `layouts/` profile

Order: `PATTERN`, `NAV MODEL`, `BEST FOR`, `REGIONS`, `RE-SKIN`.

Real example — `layouts/01-split-panel.html:7-15`:

```
<!--
  PATTERN    Split Panel
  NAV MODEL  Navigation lives in a fixed identity panel that never scrolls;
             content scrolls independently beside it.
  BEST FOR   Landing pages, product overviews, portfolios, single-skill pages —
             anywhere one persistent "statement" should anchor the page.
  REGIONS    .panel (fixed brand + nav + CTA)  |  .content (scrolling column)
  RE-SKIN    Change --accent and the panel background. Stacks below 900px.
-->
```

## `info-design/` profile

Order: `CHART`, `DATA SHAPE`, `INSIGHT`, `BEST FOR`, `RE-SKIN`.

Real example — `info-design/i01-grouped-bars.html:7-15`:

```
<!--
  CHART       Grouped Bars with Annotation
  DATA SHAPE  4 categories x 2 series — {label, a, b}[]
  INSIGHT     compare
  BEST FOR    Two-series category comparisons; plan-vs-actual.
  RE-SKIN     --accent = series A + the annotation (series B stays neutral
              gray). Bars go thinner and category labels rotate under ~520px.
-->
```
