
## Update and push

个人网站的hugo主题，由claude code + deepseek开发。


```bash
git tag

# 用 -a 创建附注标签，3位版本号（hugo mod 要求）
git tag -a v3.5.0 -m "Version 3.5.0: ES6 JS, refined typography, responsive images, accessible icons"

git push origin main
git push origin v3.5.0

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
│       ├── nav.js          # Navigation menu toggle
│       ├── theme.js        # Dark/light/auto theme toggle
│       ├── back-to-top.js  # Smooth scroll to top
│       ├── article-page.js # Sidenotes, TOC, ScrollSpy, code copy
│       ├── fullwidth.js    # Full-width element detection and offset
│       ├── search.js       # Client-side search
│       └── ebook-reader.js # EPUB reader app (foliate-js) — ES module
├── layouts/
│   ├── _default/
│   │   ├── _markup/
│   │   │   └── render-image.html  # Image render hook (lazy loading)
│   │   ├── baseof.html     # Base HTML frame (head, header, footer, blocks)
│   │   ├── single.html     # Single post (3-column layout + mobile TOC)
│   │   ├── list.html       # Section list with pagination
│   │   ├── search.html     # Search page
│   │   └── index.json      # JSON search index output
│   ├── index.html          # Homepage (inherits baseof via "main" block)
│   ├── books/              # E-book reader + bookshelf listing
│   ├── note/               # Bare templates for LiteDown-rendered notes
│   ├── slides/             # Bare templates for LiteDown-rendered slides
│   └── partials/
│       ├── head.html       # <head>: meta, fonts, CSS bundle, theme flash, common JS
│       ├── header.html     # Nav bar trigger + theme toggle + menu
│       └── footer.html     # Footer with copyright, links, back-to-top
└── exampleSite/            # Demo site for theme development
```

**CSS modules** (`assets/css/modules/`):

| File | Scope |
|------|-------|
| `critical.css` | CSS variables (11 custom properties), reset, body, layout grid (centered article) |
| `header.css` | Footer base styles |
| `header-badge.css` | Nav trigger, menu, theme toggle |
| `article-list.css` | Blog list, post items, search page |
| `toc.css` | TOC sidebar, collapsible tree, vertical-bar float toggle |
| `footnotes.css` | Sidenotes (wide) and end-of-article footnotes (narrow) |
| `article.css` | Images, figures within articles |
| `typography.css` | Headings, links, lists, blockquote, selection |
| `code-tables.css` | Code blocks, tables, full-width elements |
| `home.css` | Homepage-specific styles (loaded only on homepage) |
| `copy-footer.css` | Code copy button, article footer, pagination |
| `bookshelf.css` | Bookshelf listing (loaded only on /books/) |
| `dark-mode.css` | `:root.dark` variable overrides (minimal — component colors inherit from variables) |
| `responsive.css` | All `@media` breakpoints, TOC hidden state |
| `print.css` | `@media print` rules, URL expansion, page margins, widow/orphan control |

**CSS bundling:** 13 modules concatenated into global `bundle.css`. `home.css` and `bookshelf.css` are loaded conditionally via `head.html` only on their respective pages.

All JS is ES6+: `const`/`let`, arrow functions, template literals, `for...of`. No transpilation needed — targets modern browsers.

`nav.js`, `theme.js`, `back-to-top.js` are bundled into `common.js` and loaded with `defer`. `search.js` and `article-page.js`/`fullwidth.js` are loaded per-page. `ebook-reader.js` is loaded as an ES module.

### Template Inheritance

```
baseof.html  (wraps <head>, provides body_attrs/body_content/scripts blocks)
├── index.html              → Homepage, defines "main" block only
├── _default/single.html    → Posts, defines "main" and "scripts" blocks
├── _default/list.html      → Section lists with pagination, defines "main" block
├── _default/search.html    → Search page, defines "main" and "scripts" blocks
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

`books/single.html` overrides `body_attrs`, `body_content`, and `head_extras`. Regular pages use the default `body_content`.

**Theme system:** `window.__cycleTheme()` and `window.__getThemeIcon()` are defined in an inline `<script>` and shared by `theme.js` and `ebook-reader.js`. Theme preference is persisted in `localStorage` and applied before first paint. Sun/moon icons are feather-style SVG (not Unicode) for cross-platform consistency.

### Three-Column Layout (single.html)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  <body>   display: flex, min-height: 100vh                               │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  <header>   theme toggle (top-left) + nav trigger (top-right)     │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │  <main>                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │  <div class="layout">  grid: 1fr minmax(0,800px) 1fr       │  │  │
│  │  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐     │  │  │
│  │  │  │ <aside>  │  │  <article>   │  │  <aside>          │     │  │  │
│  │  │  │footnotes │  │ max-w:800px  │  │  toc              │     │  │  │
│  │  │  │sidenotes │  │  CENTERED    │  │  sticky           │     │  │  │
│  │  │  └──────────┘  └──────────────┘  └───────────────────┘     │  │  │
│  │  │      1fr         minmax(0,800px)        1fr                │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │  <footer>  (partial)  copyright, links, back-to-top               │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**CSS Grid:**
```css
.layout {
    display: grid;
    grid-template-columns: 1fr minmax(0, 800px) 1fr;
    gap: 1rem;
    max-width: 1400px;
    margin: 0 auto;
}
article {
    max-width: 800px;
    margin: 0 auto;
    min-width: 0;
}
```

The article column is always centered. Footnotes and TOC fill the left and right `1fr` columns respectively. When TOC is hidden, the grid stays unchanged — the article never shifts position.

**Breakpoints:**
| Viewport | Columns | Behavior |
|----------|---------|----------|
| > 1024px | `1fr 800px 1fr` | Article centered, sidenotes + TOC in sidebars |
| 801–1024px | `auto 180px` | Sidenotes hidden → end-of-article footnotes; TOC in sidebar |
| ≤ 800px | `1fr` | Single column; mobile TOC toggle appears |
| TOC hidden | (unchanged) | Grid stays same, TOC content hidden — no layout shift |
| Print | `display: block` | All sidebars, nav, buttons hidden |

### Footnote System

**`initSidenotes()` in `article-page.js`.**

Two modes depending on viewport:

**Wide screens (>1024px) — Sidenotes in left sidebar:**
- `div.footnotes` is hidden; footnote content is cloned into the left `<aside class="footnotes">`.
- Each footnote is `position: absolute`, Y-aligned to its reference via `getBoundingClientRect()`.
- Overlap prevention: minimum 10px gap between adjacent footnotes.
- Return links (↩) are added to each note for back-navigation.

**Narrow screens (≤1024px) — Hugo default end-of-article footnotes:**
- The server-rendered `div.footnotes` is left visible at the bottom of the article.
- Standard superscript reference numbers + click-to-navigate + back-links.

Re-evaluates on `resize` (200ms debounce) to switch mode at the 1024px breakpoint.

### Table of Contents (TOC)

**Three cooperating functions in `article-page.js`:**

**`initTableOfContents()` — Nested structure generation:**
- Scans `article` for `h2, h3, h4`.
- Builds a nested tree with collapsible sub-items.
- H2 items with sub-items get an SVG chevron toggle button.
- Mobile toggle button shows section count (e.g. "5 sections").

**`initTocInteractivity()` — Collapse/expand:**
- Event delegation on toggle clicks. Toggles `.is-open` on the parent `<li>`.
- CSS: `.toc-sublist { max-height: 0; opacity: 0; }` → `.is-open > .toc-sublist { max-height: 1000px; opacity: 1; }`

**`initTOCScrollSpy()` — Active heading tracking:**
- `IntersectionObserver` with `rootMargin: "0px 0px -75% 0px"`.
- Active heading's TOC link gets `.active` (blue, bold).

**TOC toggle buttons:**
- Inline × button at top of TOC sidebar to hide it.
- Floating vertical bar (2px × 56px) on the right edge to restore — matches the nav trigger's minimal aesthetic.
- State persisted in `localStorage`.

### Full-width Elements

**Core:** `initFullwidth()` in `fullwidth.js`.

Content wider than the 800px article column expands to span into the sidebar columns. Wider than viewport → capped with internal scrollbar.

**Detection (`detectFullwidthElements`):**

| Element | Method |
|---------|--------|
| `.highlight` (code) | `scrollWidth > clientWidth + 2` |
| `table` | Off-screen clone with `nowrap` → measure `scrollWidth` |
| `img` | After load: `naturalWidth > offsetWidth * 1.3` |
| `iframe`, widgets | `Math.max(offsetWidth, attrWidth)` |

Tables use an off-screen clone for measurement to avoid visible layout flash.

**Positioning (`applyAllOffsets`):**
- Dynamic scroll classification at current viewport.
- Width clamped to viewport with 12px min-gap.
- Centered within layout, clamped to viewport bounds.

**Reactivity:** `window.resize` (150ms debounce via `requestAnimationFrame`) + `ResizeObserver` on `<article>`.

### Search

**`/search/` page with client-side search:**
- Hugo outputs `/index.json` with all pages' titles, summaries, dates, and URLs.
- The search page fetches this JSON and filters with a case-insensitive scoring algorithm (exact title match > prefix match > substring match > summary match).
- Results sorted by relevance, displayed as titled links with metadata and summaries.
- "No results" and loading states handled.

### E-Book Reader (`books/`)

- Uses `foliate-js` (loaded from CDN with SRI `integrity` hash via `<link rel="modulepreload">`).
- **Toolbar:** Back to Shelf link, book title, TOC toggle, font size (60%–200%), theme toggle.
- **TOC sidebar:** Slide-in panel from EPUB metadata.
- **Navigation:** Click/tap edge zones, touch swipe (50px threshold), arrow keys.
- **Progress:** CFI-based reading position in `localStorage` per book. Bottom progress bar.
- **Theme:** Shares the same `localStorage` key and `window.__cycleTheme()` as the main site.
- **Error state:** Displayed if EPUB fails to load.

### Navigation

A horizontal bar trigger (80px × 28px, aligned with the theme toggle) at the top-right. Clicking reveals a minimal nav bar: items on a line with a thin rule below, yihui.org style. Items separated by `·`. Click outside or press Escape to dismiss.

**Menu configuration:** Uses `.Site.Menus.main` from `config.toml`. Falls back to auto-generating from site sections if no menu is configured. The "Ramblings" section is automatically appended in development mode (`hugo server`).

### Typography

**Font stack:** `EB Garamond` (Latin) + `Noto Serif SC` (Chinese), loaded from Google Fonts with `display=swap`. Monospace: `Consolas, Courier, 楷体` stack.

**Responsive sizing:** Body font-size and line-height use `clamp()` for fluid scaling across viewports — 16→18px and 1.6→1.75 respectively. No hard breakpoint jumps.

**CJK/Latin mixed text:**
- `text-spacing: normal` — automatic 1/8em gap between Chinese and Latin characters (Chrome 124+, Safari 17+).
- `font-kerning: normal` — enables Latin kerning pairs (e.g. "AV", "To").
- `font-variant-numeric: oldstyle-nums` — proportional oldstyle figures (`123` have ascenders/descenders, blending naturally into serif body text).

**Vertical rhythm:** Paragraph margins use `0.5lh` (half the line height), ensuring consistent spacing regardless of font-size or line-height changes. Headings have `2em` top margin for clear section separation.

**Heading hierarchy:** Fluid `clamp()` sizes — H1 1.6→2.2rem, H2 1.2→1.5rem, H3 1.05→1.2rem — with `letter-spacing: -0.01em` on H1 for refined large-type tracking.

**Links:** Dashed underline, solid on hover. `text-decoration-color` transition for smooth feedback.

**Syntax highlighting:** Hugo Chroma with CSS classes, Monokai theme, line numbers. Code blocks use tinted background (`--bg-color-light`) with 8px border-radius — no border or box-shadow.

**Images:** `loading="lazy" decoding="async"` via render hook. Page-resource images get automatic `srcset` with 480w and 960w variants for responsive loading.

**Color contrast:** `--text-color: #3a3a3a` on white (~10:1 ratio) — comfortable for long-form reading, well above WCAG AAA (7:1). Dark mode palette softened to reduce halation.

### Configuration

Footer links (GitHub, email, RSS) are driven by `.Site.Params` in `config.toml`:

```toml
[params]
  github = "https://github.com/your/repo"
  email = "you@example.com"
  rss = "/index.xml"
```

Each link is rendered only when its param is set.

### Production vs Development

- **Ramblings section:** Appears in nav menu only when `hugo.IsProduction` is false. Content pages for ramblings are hidden in production builds.
- Content files matching `\.Rmd$` are ignored via `ignoreFiles`.

## License

This theme is open-source and available for modification and redistribution. Please refer to the LICENSE file for more details.
