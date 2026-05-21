
## Update and push

个人网站的hugo主题，与Sonnet 3.5以及Gemini 2.5 Pro 合作开发。


```bash
git tag

git tag -a v1.0.1 -m "Theme update: [描述更新内容]" # 用2.1这种两位版本号会导致hugo mod 无法获取该tag。

git push origin v1.0.1 

# 预览
cd exampleSite/
hugo server --noHTTPCache --disableFastRender --themesDir ../..
```

## Architecture

### File Structure

```
Nothing/
├── theme.toml              # Theme metadata (name, author, Hugo version, etc.)
├── assets/
│   ├── css/styles.css      # Placeholder (actual CSS lives in static/)
│   └── js/scripts.js       # Placeholder
├── static/
│   ├── css/styles.css      # Core stylesheet (~1030 lines)
│   ├── js/article-page.js  # Footnotes, TOC generation, ScrollSpy
│   └── js/fullwidth.js     # Full-width element detection and offset calculation
├── layouts/
│   ├── _default/
│   │   ├── baseof.html     # Base HTML frame (head, fonts, header partial)
│   │   ├── single.html     # Single post template (3-column layout)
│   │   └── list.html       # List page template
│   ├── index.html          # Homepage (standalone, not inheriting baseof)
│   ├── note/               # Minimal templates (raw .Content output, no chrome)
│   ├── slides/             # Minimal templates (same as note)
│   └── partials/
│       ├── header.html     # Navigation bar (fixed, top-right, hover-triggered menu)
│       └── footer.html     # Footer (unused — not referenced in baseof)
└── exampleSite/            # Demo site for theme development
```

### Template Inheritance

```
baseof.html  (global <head>, fonts, CSS, includes header partial)
├── index.html              → Homepage, defines "main" block
├── _default/single.html    → Posts, defines "main" and "scripts" blocks
├── _default/list.html      → Section lists, defines "main" block
├── note/single.html        → Standalone HTML (does NOT inherit baseof)
└── slides/single.html      → Standalone HTML (does NOT inherit baseof)
```

Note: `footer.html` exists but is **not included** by any template. Footer content is hardcoded in `index.html` for the homepage.

### Three-Column Layout (single.html)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  <html>   overflow-x: hidden                                             │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  <body>   overflow-x: hidden, display: flex, min-height: 100vh     │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │  <header>  (partial)   nav, social links                     │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │  <main>                                                      │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │  │
│  │  │  │  <div class="layout">   grid: 20% auto 15%              │ │   │  │
│  │  │  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │ │   │  │
│  │  │  │  │ <aside>  │  │  <article>   │  │  <aside>          │ │ │   │  │
│  │  │  │  │footnotes │  │ max-w:800px  │  │  toc              │ │ │   │  │
│  │  │  │  │          │  │              │  │  sticky, z:1      │ │ │   │  │
│  │  │  │  │ z-index:1│  │              │  │                   │ │ │   │  │
│  │  │  │  │          │  │              │  │  (>800px)         │ │ │   │  │
│  │  │  │  │(>1024px) │  │              │  │                   │ │ │   │  │
│  │  │  │  └──────────┘  └──────────────┘  └───────────────────┘ │ │   │  │
│  │  │  │    20%              auto                  15%           │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │    fullwidth element (non-scroll, expands from center): │ │   │  │
│  │  │  │    ◄──────────────────┬──────────────────────────►      │ │   │  │
│  │  │  │    ◄── into left ────┼──── into right ──────────►      │ │   │  │
│  │  │  │              layoutCenterX                              │ │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │  <footer>                                                    │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
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
| Viewport | Columns | Hidden |
|----------|---------|--------|
| > 1024px | `20% auto 15%` | — |
| 801–1024px | `auto 25%` | `aside.footnotes` (footnotes go inline) |
| ≤ 800px | `1fr` | both asides |
| Print | `display: block` | all sidebars, nav |

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

The layout re-evaluates on `resize` (250ms debounce) and via `ResizeObserver` on the `<article>`.

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
- Page-level horizontal scroll is prevented by `overflow-x: hidden` on both `<html>` and `<body>`.

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

### Navigation

The header is a fixed-position vertical bar (2px × 80px) in the top-right corner. On hover, a dropdown menu appears with a fade+slide animation:

```css
.nav-container:hover .nav-menu {
    opacity: 1;
    visibility: visible;
    transform: translateX(0);
}
```

The "Daily-Life" link only renders when `hugo.IsProduction` is false.

The `<footer>` partial is **not used** — footer content is hardcoded inline in `index.html` and `list.html` pages do not include a footer.

### Typography

- **Serif body:** `EB Garamond` (Latin) + `Noto Serif SC` (Chinese), loaded from Google Fonts.
- **Monospace:** `Consolas, Courier, 楷体` stack.
- **Body links:** dashed underline, solid on hover (footnote/toc links excluded).
- **Syntax highlighting:** Hugo Chroma with CSS classes (`noClasses = false`), Monokai theme, line numbers in table.

### `note/` and `slides/` Sections

These have completely standalone templates — they do **not** inherit from `baseof.html`. Their `single.html` is a bare HTML document containing only `{{ .Content }}`. This means: no styles, no JS, no footnote/TOC processing, no navigation. They are intended for raw content output (e.g., rendered R Markdown / Quarto HTML).

## License

This theme is open-source and available for modification and redistribution. Please refer to the LICENSE file for more details.