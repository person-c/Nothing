# Nothing

A minimal, typography-first Hugo theme for personal blogs, notes, slides and an
in-browser EPUB reader. Serif body text, paper-like spacing, a three-state theme
toggle (dark / light / auto) and no build step for the browser code.

- Hugo **0.146+** (CI pins 0.147.8)
- MIT license
- Demo site lives in `exampleSite/`

## Preview and build

```bash
# 本地预览（development 环境，会额外渲染 exampleSite/content/ramblings）
cd exampleSite
hugo server --themesDir ../.. --noHTTPCache --disableFastRender

# 生产构建（--minify 约省 16% HTML 体积，--gc 清理缓存）
hugo --themesDir ../.. --minify --gc

# 子路径部署的构建（baseURL 带路径时，站内链接自动加前缀）
hugo --themesDir ../.. --baseURL https://example.org/blog/ --minify
```

## Features

- **Typography first**: EB Garamond + Noto Serif SC, fixed 1.7 line-height,
  `text-autospace` for mixed CJK/Latin, oldstyle figures, metric-compatible
  local font fallbacks (`size-adjust`) to keep CLS at zero while webfonts load.
- **Sidenotes**: footnotes move into the left margin on wide screens and stay as
  end-of-article notes on narrow screens; positions are re-measured when images,
  fonts or the TOC change the layout.
- **Server-rendered TOC**: the nested table of contents is built from
  `.Fragments` at build time (works without JS); JS only adds collapse toggles,
  scrollspy and the hide/restore controls.
- **Code**: light/dark Chroma styles (`syntax-light.css` / `syntax-dark.css`),
  inline line numbers, copy button with clipboard fallback, full-width expansion
  for wide blocks and tables.
- **Theme**: dark / light / auto, applied before first paint, restored from
  `localStorage` (guarded with try/catch), follows `prefers-color-scheme` in auto.
- **Search**: client-side over Hugo's `index.json`; the index is fetched at most
  once and reused for every keystroke.
- **E-book reader**: foliate-js is dynamically imported, so a blocked CDN shows a
  readable error instead of a blank page; progress and font size are persisted.
- **SEO**: canonical URLs (self-referencing on paginated pages) with
  `rel=prev/next`, Open Graph + Twitter cards, JSON-LD (`BlogPosting` /
  `WebSite`), `robots.txt` with subpath-safe sitemap URL, themed `404.html`,
  favicon and article timestamps.
- **Accessibility**: skip link, labelled nav/theme/TOC controls, live regions for
  theme and search state, `prefers-reduced-motion` support, aria-expanded
  toggles, focus management for the nav menu.
- **i18n**: all UI strings come from `i18n/{en,zh,zh-cn}.toml`; JS strings are
  injected from the same catalog.
- **Maintainability**: CSS is split into 15 ordered modules (tokens → typography
  → components → dark overrides → responsive → print) with semantic color
  tokens, plus shared pagination/date/TOC/icon partials.

## Configuration

Minimal `hugo.toml`:

```toml
baseURL = "https://example.org/"
title = "My site"
theme = "Nothing"
languageCode = "en"

[params]
  description = "Site description used as meta description fallback."
  author = "Your Name"            # JSON-LD author
  ogImage = "images/og-default.png" # social card, site-relative or absolute
  github = "https://github.com/you"
  email = "you@example.com"
  rss = "/index.xml"
  showLastmod = true              # requires enableGitInfo
```

Pagination uses Hugo's modern config:

```toml
[pagination]
  pagerSize = 10
```

The search page requires the JSON home output (the theme's `head.html` injects
`window.__SEARCH_INDEX_URL`):

```toml
[outputs]
  home = ["HTML", "RSS", "JSON"]
```

## File structure

```
Nothing/
├── theme.toml / LICENSE
├── archetypes/            default.md, books.md
├── assets/
│   ├── css/
│   │   ├── modules/       15 module files (fixed order), see below
│   │   ├── syntax-light.css / syntax-dark.css   # generated Chroma CSS
│   │   └── ebook-reader.css
│   └── js/                nav, theme, back-to-top, article-page,
│                          fullwidth, search, ebook-reader (ES module)
├── i18n/                  en.toml, zh.toml, zh-cn.toml
├── layouts/
│   ├── _default/          baseof, single, list, search, index.json,
│   │   └── _markup/       render-image.html
│   ├── partials/          head, header, footer, pagination, post-date,
│   │   ├── icons/         sun, moon, chevrons, arrow-left
│   │   └──              theme-init, toc, toc-children, toc-headings
│   ├── books/             list.html (shelf) + single.html (reader)
│   ├── note|slides/       bare templates for pre-rendered content
│   ├── shortcodes/        figure.html
│   ├── 404.html, robots.txt, index.html
├── static/favicon.svg
└── exampleSite/           demo content + config
```

### CSS modules

| File | Scope |
|------|-------|
| `critical.css` | tokens, reset, layout grid, theme bootstrap styles |
| `typography.css` | headings, links, lists, quotes, selection |
| `footer.css` | site footer |
| `header.css` | nav trigger/menu, theme toggle |
| `article-list.css` | lists, post items, search page |
| `toc.css` | TOC sidebar/tree/float toggle |
| `footnotes.css` | sidenotes + end footnotes |
| `article.css` | images, figures |
| `code-tables.css` | code blocks, tables, inline code |
| `copy-footer.css` | copy button, article footer, pager |
| `home.css` / `bookshelf.css` | loaded only on `/` and `/books/` |
| `responsive.css` | media queries, hidden-TOC state |
| `dark-mode.css` | dark token overrides only |
| `print.css` | print layout, link expansion, page margins |

Modules are concatenated in this fixed order (tokens → typography → components
→ dark overrides → responsive → print), so cascade order is explicit. The theme
deliberately does **not** wrap them in `@layer`: the CSS minifier shipped with
Hugo 0.147 leaves `@layer` block contents unminified, which grew the bundle from
~25 KB to ~34 KB. If you prefer layers, add them after confirming your Hugo
version minifies layered CSS.

### Bundle strategy

- One CSS bundle (all modules above, minified + fingerprinted).
- `home.css` / `bookshelf.css` are added conditionally on their pages.
- `common.js` = `nav.js` + `theme.js` + `back-to-top.js` (`defer`).
- `article-page.js`, `fullwidth.js`, `search.js` load only on pages that need them.
- `ebook-reader.js` is an ES module that dynamically imports foliate-js from the CDN.

### Layout

```
.layout { grid-template-columns: 1fr minmax(0, 800px) 1fr; }
```

The article column is always centered; footnote sidenotes fill the left column,
the TOC the right one. Hiding the TOC only hides its content, so the article
never shifts.

| Viewport | Columns | Behavior |
|----------|---------|----------|
| > 1200px | `1fr 800px 1fr` | article centered, sidenotes + TOC |
| 801–1200px | `auto 180px` | sidenotes → end footnotes, TOC in sidebar |
| ≤ 800px | single column | mobile TOC toggle above the text |
| print | block layout | sidebars/nav hidden, footnotes expanded |

All breakpoints live in `responsive.css`; the one JS breakpoint uses
`matchMedia('(max-width: 1200px)')` so it matches CSS exactly.

## Verification

```bash
# CI: build the demo site with the pinned Hugo version and assert key outputs
.github/workflows/hugo.yml
```

Locally: `hugo --themesDir ../.. --minify` from `exampleSite/` must succeed and
emit `index.html`, `sitemap.xml`, `robots.txt`, `404.html`, `search/` and the
empty-taxonomy-free section lists.

## Development notes

- Content in `exampleSite/content/ramblings/` is ignored by git and only rendered
  in the development environment (production config excludes it).
- `.Rmd` files are ignored via `ignoreFiles`.
- Fonts come from Google Fonts; `theme-color` metas and `color-scheme` follow the
  active theme.
- Theme cycle: dark → light → auto (auto re-evaluates the OS preference and
  listens for OS scheme changes).
