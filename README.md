
## Update and push

个人网站的hugo主题，与Sonnet 3.5以及Gemini 2.5 Pro 合作开发。


```bash
git tag

# 用 -a 创建附注标签，3位版本号（hugo mod 要求）
git tag -a v3.3.0 -m "Version 3.3.0: [描述更新内容]"

git push origin main
git push origin v3.3.0

# 预览
cd exampleSite/
hugo server --noHTTPCache --disableFastRender --themesDir ../..
```

## Architecture

### File Structure

```
Nothing/
├── theme.toml              # Theme metadata (name, author, Hugo version, etc.)
├── archetypes/
│   ├── default.md          # Default page archetype
│   └── books.md            # Book page archetype (title, author, cover, file)
├── assets/
│   ├── css/
│   │   ├── modules/        # 15 modular CSS files (see below)
│   │   └── ebook-reader.css# EPUB reader full-page styles
│   └── js/
│       ├── nav.js          # Navigation menu toggle (in header)
│       ├── theme.js        # Dark/light/auto theme toggle
│       ├── back-to-top.js  # Smooth scroll to top
│       ├── article-page.js # Footnotes, TOC, ScrollSpy, code copy
│       ├── fullwidth.js    # Full-width element detection and offset
│       └── ebook-reader.js # EPUB reader app (foliate-js) — ES module
├── layouts/
│   ├── _default/
│   │   ├── baseof.html     # Base HTML frame (head, header, footer, blocks)
│   │   ├── single.html     # Single post (3-column layout + mobile TOC)
│   │   └── list.html       # Section list with pagination
│   ├── index.html          # Homepage (inherits baseof via "main" block)
│   ├── books/              # E-book reader + bookshelf listing
│   ├── note/               # Bare templates for LiteDown-rendered notes
│   ├── slides/             # Bare templates for LiteDown-rendered slides
│   └── partials/
│       ├── head.html       # <head> content: meta, fonts, CSS bundle, theme flash prevention, common JS
│       ├── header.html     # Nav bar (top-right trigger → top-center pill menu) + theme toggle button
│       └── footer.html     # Footer with copyright, social links, back-to-top
└── exampleSite/            # Demo site for theme development
```

**CSS modules** (`assets/css/modules/`):

| File | Scope |
|------|-------|
| `critical.css` | CSS variables, reset, body, layout grid |
| `header.css` | Header and footer base styles |
| `header-badge.css` | Nav bar, nav menu, theme toggle positioning |
| `article-list.css` | Blog list: post items, dates, links |
| `toc.css` | TOC sidebar, collapsible tree, floating toggle |
| `footnotes.css` | Sidenote system, inline footnotes |
| `article.css` | Images, figures within articles |
| `typography.css` | Headings, links, lists, blockquote, selection |
| `code-tables.css` | Code blocks, tables, full-width elements |
| `home.css` | Homepage-specific styles |
| `copy-footer.css` | Code copy button, article footer, pagination |
| `bookshelf.css` | Bookshelf listing page |
| `dark-mode.css` | `:root.dark` variable overrides |
| `responsive.css` | All `@media` breakpoints |
| `print.css` | `@media print` rules |

All modules are concatenated at build time via Hugo Pipes:
```go
{{ $css := slice $critical $header ... $print | resources.Concat "css/bundle.css" | resources.Minify | resources.Fingerprint }}
```

JS files `nav.js`, `theme.js`, `back-to-top.js` are similarly bundled into `common.js` and loaded with `defer`. This keeps the critical theme flash prevention as the only inline script.

### Template Inheritance

```
baseof.html  (wraps <head>, provides body_attrs/body_content/scripts blocks)
├── index.html              → Homepage, defines "main" block only
├── _default/single.html    → Posts, defines "main" and "scripts" blocks
├── _default/list.html      → Section lists with pagination, defines "main" block
├── note/single.html        → Bare HTML (LiteDown pre-rendered content), no baseof
├── slides/single.html      → Bare HTML (LiteDown pre-rendered content), no baseof
├── books/single.html       → EPUB reader, extends baseof via body_content + head_extras blocks
└── books/list.html         → Bookshelf listing, defines "main" block
```

**Blocks provided by baseof.html:**

| Block | Purpose | Default |
|-------|---------|---------|
| `body_attrs` | Extra attributes on `<body>` tag | empty |
| `body_content` | Entire body content area | header + main + footer |
| `main` | Page-specific content inside `<main>` | empty |
| `footer` | Footer override | `footer.html` partial |
| `scripts` | Page-specific `<script>` tags | empty |
| `head_extras` | Extra `<link>`/`<script>` in `<head>` | empty |

`books/single.html` overrides `body_attrs` (adds `ebook-reader-body` class), `body_content` (replaces everything with the EPUB reader UI), and `head_extras` (injects `ebook-reader.css`). Regular pages use the default `body_content` which renders header + main + footer.

**Theme system:** Dark/light/auto preference is persisted in `localStorage`. An inline script in `<head>` applies the `dark` class before first paint — if no stored preference, it checks `prefers-color-scheme`. The theme toggle button cycles: dark → light → auto. The TOC sidebar can be hidden (× button) with a floating ☰ restore button.

### Three-Column Layout (single.html)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  <body>   display: flex, min-height: 100vh                               │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  <header>  (partial)   nav trigger + theme toggle                 │  │
│  │  ☀ (top-left)                                    ─── (top-right)  │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │  <main>                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │  <div class="layout">   grid: 20% auto 15%                  │  │  │
│  │  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐     │  │  │
│  │  │  │ <aside>  │  │  <article>   │  │  <aside>          │     │  │  │
│  │  │  │footnotes │  │ max-w:800px  │  │  toc              │     │  │  │
│  │  │  │(>1024px) │  │              │  │  sticky, z:1      │     │  │  │
│  │  │  └──────────┘  └──────────────┘  └───────────────────┘     │  │  │
│  │  │    20%              auto                  15%               │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │  <footer>  (partial)  copyright, links, back-to-top               │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

```html
<div class="layout">
    <aside class="footnotes"></aside>   <!-- Left: sidenotes -->
    <article>                           <!-- Center: content -->
    </article>
    <aside class="toc">                 <!-- Right: table of contents -->
        <nav id="toc"></nav>
    </aside>
</div>
```

**CSS Grid:**
```css
.layout {
    display: grid;
    grid-template-columns: 20% auto 15%;
    gap: 1rem;
    max-width: 1400px;
    margin: 0 auto;
}
article {
    max-width: 800px;
    margin: 0 auto;
    min-width: 0;           /* prevent grid blowout */
}
```

**Breakpoints:**
| Viewport | Columns | Behavior |
|----------|---------|----------|
| > 1024px | `20% auto 15%` | Full 3-column: sidenotes + article + TOC |
| 801–1024px | `auto 28%` | Footnotes go inline, TOC remains in sidebar |
| ≤ 800px | `1fr` | Both asides hidden; mobile TOC toggle button appears |
| TOC hidden | `1fr auto 1fr` | Symmetric centering, floating ☰ restore button |
| Print | `display: block` | All sidebars, nav, buttons hidden |

### Footnote System

**Core:** `initResponsiveFootnotes()` in `article-page.js`.

Workflow:
1. Locates all `a.footnote-ref` links and the original `div.footnotes`.
2. Sets `div.footnotes` to `display: none` permanently — the server-rendered footnotes are hidden and replaced by JS-generated ones.
3. Two modes depending on viewport width:

**Wide screens (>1024px) — Sidenotes (`renderSidenotes`):**
- Generates `<ul id="dynamic-footnotes">` inside the left `<aside class="footnotes">`.
- Each footnote is `position: absolute`, Y-positioned to align vertically with its reference in the text (via `getBoundingClientRect()`).
- A second pass enforces a 12px minimum gap between adjacent footnotes to prevent overlap.
- `.footnote-return` back-links are stripped from cloned content.

**Narrow screens (≤1024px) — Inline (`renderInlineFootnotes`):**
- Each footnote is inserted directly after the `<p>` containing its reference, wrapped in `<div class="inserted-footnotes-container">`.
- Footnote references have `pointer-events: none` since the content is immediately below.
- Styled with a blue left border and light background.

The layout re-evaluates on `resize` (250ms debounce), via `ResizeObserver` on `<article>`, and after images load or web fonts finish loading — all managed within `initResponsiveFootnotes()`.

### Table of Contents (TOC)

**Three cooperating functions in `article-page.js`:**

**`initTableOfContents()` — Nested structure generation:**
- Scans `article` for `h2, h3, h4`.
- Builds a nested tree:
  - H2 → root-level `<li class="toc-level-2">`
  - H3 → hangs under the nearest H2 in `<ul class="toc-sublist">`
  - H4 → hangs under the nearest H3
- H2 items with sub-items automatically get a `collapsible` class and an SVG chevron toggle button.

**`initTocInteractivity()` — Collapse/expand:**
- Event delegation on toggle button clicks.
- Toggles `.is-open` on the parent `<li>`.
- CSS handles the animation:
  ```css
  .toc-sublist { max-height: 0; opacity: 0; overflow: hidden; }
  .is-open > .toc-sublist { max-height: 1000px; opacity: 1; }
  ```

**`initTOCScrollSpy()` — Active heading tracking:**
- Uses `IntersectionObserver` with `rootMargin: "0px 0px -75% 0px"`.
- When a heading enters the top 25% of the viewport, the matching TOC link gets `.active` (blue, bold).

### Full-width Elements

**Core:** `initFullwidth()` in `fullwidth.js`.

The center `article` column is narrow (max 800px). Code blocks, tables, iframes, and images whose natural width exceeds this column are expanded to span into the sidebar columns. On narrow viewports, elements are capped at viewport width with internal scrollbars — the page itself never scrolls horizontally.

**Design principle:**
- Content wider than article column but narrower than layout → expand to natural width, centered in layout (extends into sidebars).
- Content wider than layout/viewport → capped at viewport width, element gets internal `overflow-x: auto` scrollbar.

**Detection (`detectFullwidthElements` — runs once at load):**

| Element | Method | Saves |
|---------|--------|-------|
| `.highlight` (code) | `scrollWidth > clientWidth + 2` | `el.dataset.natWidth = scrollWidth` |
| `table` | Measure with `nowrap` + `max-width: none` | `el.dataset.natWidth = naturalWidth` |
| `img` | After load: `naturalWidth > offsetWidth * 1.3` | `el.dataset.natWidth = naturalWidth` |
| `iframe`, widgets | `Math.max(offsetWidth, attrWidth)` | `el.dataset.natWidth` |

Critical: `dataset.natWidth` freezes the true content width at detection time. Without this, later calls to `scrollWidth` would return the *already-expanded element width*, causing cumulative inflation on each resize.

**Positioning (`applyAllOffsets` — runs on load, resize, and article mutation):**

For each `.fullwidth` element:

1. **Dynamic scroll classification** — `needsScroll = natWidth > layoutRect.width + 2`. Re-evaluated every call (not just at load), so elements that fit at 1200px but overflow at 700px are handled correctly.
2. **CSS class sync** — `fullwidth-scroll` class is added/removed to match `needsScroll`. This lets the stylesheet rules (overflow, padding) apply cleanly without inline `!important` fighting CSS.
3. **Width calculation:**
   - Scroll case: `min(layoutRect.width, viewportWidth)` — fills available space, content scrolls inside.
   - Non-scroll case: `natWidth` (+10px for highlight code blocks to compensate CSS padding).
   - Hard cap: `Math.min(useWidth, viewportWidth)` — never wider than viewport.
   - `Math.floor()` to avoid subpixel overflow.
4. **Horizontal centering** within the layout, then bidirectional clamping:
   - Left edge ≥ 0 (viewport origin)
   - Right edge ≤ viewport width
5. **HTML attribute cleanup** — `removeAttribute('width')` on iframes to prevent the attribute from fighting inline styles.

**CSS support:**

```css
/* Baseline */
article .fullwidth { max-width: none; }

/* Non-scroll: let content breathe into sidebars */
article .highlight.fullwidth:not(.fullwidth-scroll) { overflow-x: visible; padding-right: 30px; }
article table.fullwidth:not(.fullwidth-scroll)    { overflow-x: visible; }

/* Scroll: internal scrollbar, never page-level */
article .highlight.fullwidth-scroll,
article table.fullwidth-scroll,
article iframe.fullwidth-scroll,
article .html-widget.fullwidth-scroll             { overflow-x: auto; }

/* Table scroll fix: overflow-x needs display:block to work reliably */
article table.fullwidth-scroll                    { display: block; }

/* Table cells: prevent wrapping so horizontal scroll has meaning */
article table.fullwidth th,
article table.fullwidth td                        { white-space: nowrap; }
```

**Print reset:** `article table.fullwidth-scroll { display: table; }` restores normal table rendering for print.

**Reactivity:** `window.resize` (150ms debounce) + `ResizeObserver` on `<article>` keep all positions and widths current.

### E-Book Reader (`books/`)

The theme includes a full in-browser EPUB reader, plus a bookshelf listing for organizing books into categories.

**Bookshelf (`books/list.html`):**
- Lists `.Sections` (book categories, e.g. "出版小说") as group headers with links.
- Lists `.RegularPages` (individual books) under each category, showing title + author.
- Empty state message when no books exist.
- Styled with `.bookshelf` CSS: centered layout (max 1100px), book list items with left-aligned title link and right-aligned author in italics.

**Book page archetype (`archetypes/books.md`):**
- Front matter: `title`, `author`, `date`, `description`, `cover`, `file` (EPUB filename), `format` (default: "epub").
- Books use Hugo branch bundles: `content/books/<category>/<book-slug>/index.md` + `file.epub`.

**Reader (`books/single.html` + `ebook-reader.js` + `ebook-reader.css`):**
- Extends `baseof.html` (inherits CSS bundle, fonts, theme flash prevention, common JS).
- Overrides `body_content` block — the reader fills the viewport.
- Uses `foliate-js` (loaded from CDN) for EPUB rendering.
- **Toolbar:** Back to Shelf link, book title, TOC toggle button, font size controls (60%–200%), theme toggle.
- **TOC sidebar:** Slide-in panel populated from EPUB metadata.
- **Navigation:** Click/tap 20% edge zones (capture phase), touch swipe (50px threshold, horizontal-dominant), arrow keys, or toolbar prev/next buttons.
- **Progress:** CFI-based reading position persisted to `localStorage` per book. Bottom progress bar.
- **Theme:** Dark/light/auto toggle shares the same `localStorage` key as the main site.
- **Resilience:** Error state display if EPUB fails to load.

### Navigation

A horizontal bar trigger (80px × 2px, 44px tap area) sits at the top-right. Clicking it reveals a horizontal nav bar centered at the top of the page with a slide-down animation. Click outside or press Escape to dismiss.

**Menu items:** Home, About, Blog, Note, Slides, Books. The "Ramblings" link only renders when `hugo.IsProduction` is false.

All pages share a consistent footer via `layouts/partials/footer.html` (Home, GitHub, Mail, copyright, back-to-top).

### Typography

- **Serif body:** `EB Garamond` (Latin) + `Noto Serif SC` (Chinese), loaded from Google Fonts.
- **Monospace:** `Consolas, Courier, 楷体` stack.
- **Body links:** dashed underline, solid on hover (footnote/toc links excluded).
- **Syntax highlighting:** Hugo Chroma with CSS classes (`noClasses = false`), Monokai theme, line numbers in table.

### `note/` and `slides/` Sections

These use minimal bare HTML templates (no site chrome, no baseof inheritance). Content is pre-rendered HTML from [LiteDown](https://github.com/yihui/litedown) (an R package by Yihui Xie). The templates output only `{{ .Content }}` — the LiteDown HTML is rendered as-is with its own styles and scripts. `.Rmd` source files are excluded from Hugo via `ignoreFiles`.

Future optimization: notes could be rendered as Markdown instead of HTML for better theme integration (consistent typography, dark mode, TOC). Slides require LiteDown's snap-scrolling and keyboard navigation, but could inherit baseof for shared CSS and theme support.

## License

This theme is open-source and available for modification and redistribution. Please refer to the LICENSE file for more details.