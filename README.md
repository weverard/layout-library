# Layout Scaffold Library

A collection of **standalone HTML layout + navigation scaffolds**. Each file is a
self-contained mock of one *navigation paradigm* — fork it as the starting point
for a real build. There is no framework, no build step, and no dependencies: every
scaffold is a single `.html` file with inline `<style>` and `<script>`.

A gallery (`index.html`) links to all of them with mini wireframe thumbnails.

> **For the new project:** treat this README as the contract. Keep every new
> scaffold faithful to the **Conventions** below, and keep the gallery in sync.
> If you want it to act as agent instructions, copy it to `CLAUDE.md`.

> **Status — done for the day (2026-06-23).** Grew the library 30 → **60 scaffolds**
> across **7 categories**. Filled the six original categories to 9 each (`31`–`50`,
> `56`–`59`) and added a new **Agentic commerce** category of 6 (`51`–`55`, `60`),
> including two ChatGPT-style homages: `55` (desktop, Shopping Research + Instant
> Checkout) and `60` (mobile, bottom-sheet checkout). Every scaffold was
> browser-verified (clean console + working interaction). Catalog/backlog/counts
> below are current. Not a git repo (nothing committed). **Open follow-ups:** take
> Agentic commerce from 6 → 9 (backlog ideas listed below); optional `git init`.

---

## Quick start

```bash
# from this folder
python3 -m http.server 8800
# open http://localhost:8800/index.html
```

Most files also work by double-clicking (opening `file://…`). The few that fetch
nothing but rely on JS still work offline. **Heads-up:** `http.server` caches
aggressively — after editing a file, append a cache-buster (`?v=2`) to force a
fresh load in the browser.

---

## Conventions — the contract every scaffold follows

1. **One file, fully self-contained.** All CSS in a single `<style>`, all JS in a
   single `<script>`. No imports, no CDNs, no build. It must open and run from a
   bare file server.
2. **Design tokens in `:root`.** Color, type, and spacing live as CSS custom
   properties at the top. Re-skinning starts with **`--accent`** (one variable
   changes the identity). Keep a neutral base palette so the structure — not the
   colour — is the point.
3. **A documentation header comment** at the very top of `<body>`/`<head>`:
   ```html
   <!--
     PATTERN    <name>
     NAV MODEL  <how the user moves through it, in 1–2 sentences>
     BEST FOR   <use cases>
     REGIONS    <the named structural parts>
     RE-SKIN    <what to change first; responsive note>
   -->
   ```
4. **Responsive.** Stack / collapse gracefully on small screens. State the
   breakpoint behaviour in the header comment.
5. **Neutral placeholder content.** Enough realism to read the pattern; nothing
   tied to a specific brand or domain.
6. **A removable scaffold badge.** A small fixed pill, bottom corner:
   ```html
   <div class="scaffold">NN · slug &nbsp;<a href="index.html">↔ gallery</a></div>
   ```
   It's explicitly disposable — delete it (and its CSS) when you fork the layout.
7. **Numbered, kebab-case filenames:** `NN-short-slug.html` (e.g. `08-radial-orbit.html`).

---

## Adding a new layout

1. Create `NN-slug.html` following the contract above (next free number).
2. **Verify it in a browser**, not just by reading it — open it, exercise the
   interaction, and check the console is clean.
3. Add a card to `index.html` in the most fitting category section. Card shape:
   ```html
   <a class="card" href="NN-slug.html" style="--accent:#HEX">
     <div class="thumb"><div class="tw t-MOTIF"> … </div></div>
     <div class="b">
       <p class="n">NN</p>
       <h3>Name</h3>
       <p class="nav"><b>Key verb</b> — one line on how you navigate.</p>
       <div class="tags"><span class="tag">use</span><span class="tag">use</span></div>
     </div>
   </a>
   ```
4. **Thumbnail:** the gallery draws mini wireframes purely in CSS via a `.tw`
   container plus a `t-MOTIF` modifier class (see the `<style>` block — search
   `t-split`, `t-canvas`, `t-bento`, etc.). Either reuse an existing motif or add
   a new `.t-yourmotif` rule. Keep thumbnails abstract and lightweight.
5. Bump the count in the intro (`N layouts` / heading).

---

## Forking one into a real build

- Strip the `.scaffold` badge and its CSS.
- Lift the `:root` tokens into your design system; remap `--accent` and fonts.
- Replace placeholder content; wire the nav JS to real routes/data.
- The structural CSS (the layout mechanics) is the part worth keeping — that's
  what each scaffold exists to demonstrate.

---

## Gotchas (hard-won — save yourself the debugging)

- **Reserved globals at top-level script scope throw.** `let top` / `const history`
  (and `name`, `length`, `status`, `closed`, `parent`, `location`, `origin`,
  `self`, `event`, `screen`…) collide with `window.*` and error with *"Identifier
  already declared"*, killing the whole script. Rename them. (Inside a function or
  arrow body it's fine — those are block-scoped.)
- **Inline `<span>` ignores `width`/`height`.** Give shape elements `display:block`
  (or `inline-block`). A bare `<button>` also carries UA chrome — reset it:
  `appearance:none;background:none;border:0;padding:0`.
- **View Transitions: a `view-transition-name` must be unique per snapshot.** For a
  shared-element morph, don't name both source and destination up front — hand the
  name off *inside* the transition callback (source keeps it in the old snapshot,
  destination gets it in the new one).
- **Heading anchors / scroll-spy need unique ids.** When slugging headings, dedupe
  collisions (append `-1`, `-2`) or repeated names ("Outputs", "Use Cases") break
  both anchors and the active-state tracking.
- **Local server caches.** Append `?v=N` after edits to force a reload.

---

## The catalog (60)

**Foundations — app & document shells**
`01` Split Panel · `02` Centered Document · `03` Sidebar App Shell ·
`04` Three-Pane · `23` Bento Grid · `25` Accordion Spine · `26` Bottom-Sheet ·
`31` Tabbed Workspace · `32` Mobile Tab-Bar Shell

**Spatial — navigate through space**
`06` Infinite Canvas · `07` Zettelkasten Panes · `08` Radial Orbit ·
`09` Map-Pinned · `27` Elevator Floors · `28` Arrow Rooms ·
`33` Folder Column-View · `34` Isometric Scene · `35` Mind-Map Tree

**Sequence & story — the axis is the nav**
`05` Scrollytelling · `10` Timeline Scrubber · `11` Horizontal Filmstrip ·
`12` Sticky-Stack Chapters · `36` Dial / Wheel Picker · `37` Stepper / Wizard ·
`38` Page-Turn Book · `39` Story Tap-Through · `40` Carousel / Slideshow

**Command & conversation — type, don't click**
`13` Command-Palette-First · `14` Terminal / CLI · `15` Chat-First ·
`41` Conversational Form · `42` Notebook / REPL Cells · `43` Keyboard Inbox ·
`44` Slash-Command Editor · `45` Live Filter Search · `46` Voice Assistant

**Objects & cards — the content is a thing**
`16` Desktop OS · `17` Card-Deck Swipe · `18` Pinboard Wall ·
`19` Split-Flap Board · `24` Cover Flow (3D) · `47` Kanban Board ·
`48` Masonry Gallery · `49` Card Wallet · `50` Data Table

**Immersive — cinematic**
`20` Z-Axis Fly-Through · `21` Grid-to-Detail Morph · `22` Poster / Full-Bleed ·
`29` Marquee Index · `30` Spotlight Scroll · `56` Parallax Mouse Hero ·
`57` Diagonal / Skewed Editorial · `58` Particle Starfield Hero · `59` Cursor-Mask Reveal

**Agentic commerce — chat that buys**
`51` Mobile Shopping Chat · `52` Agentic Checkout Journey (deck) ·
`53` Streaming Agent Trace · `54` Multi-Agent Handoff ·
`55` ChatGPT Agentic Commerce (Shopping Research + Instant Checkout) ·
`60` ChatGPT Mobile Commerce (mobile chat + bottom-sheet checkout)
> Set of 6 (2026-06-23). `55` (desktop) and `60` (mobile) are illustrative
> ChatGPT-style homages (fictional products/merchants); `60` reuses `55`'s flow in
> a phone frame with checkout as a slide-up bottom sheet. Could extend toward 9
> later: chat + live canvas, human-in-the-loop approvals, chat-assembled cart
> drawer, comparison-in-chat, voice + chat commerce.

---

## Backlog — ideas not yet built

globe (3D points) · ticker / stock-board.

Agentic-commerce ideas not yet built (to take the category from 5 → 9): chat + live
product canvas · human-in-the-loop approvals · chat-assembled cart drawer ·
comparison-in-chat · voice + chat commerce.
