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
- **Paper palette**: warm paper `#fbf9f4`, ink `#24211c` and seal red `#a03a2b`
  for accents (dark: `#191817` / `#d8d3c8` / `#cf7a63`). Chinese text stays
  upright (no synthetic italics); chapter headings carry a short vermilion rule.
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
- **i18n**: site UI strings come from `i18n/{en,zh,zh-cn}.toml` (also injected for
  JS). Elements that must follow a filtered list or a post title language (pager,
  `All/全部` label, `Last modified`, `Contents` toggle, copy button) read the
  bilingual `data/lang.toml`, so an English list/post gets English chrome even on
  a Chinese site (and vice versa).
- **Title-language lists**: any list section can publish filtered, paginated
  views (e.g. `/blog/` = all, `/blog/chinese/`, `/blog/english/`) with a
  paper-style `全部 / 中文 / EN` toggle. Classification happens at build time;
  no JavaScript is required and each view paginates independently.
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

## Filtering a list by title language

The blog list ships with an optional language filter built entirely at build
time. A post is classified as `zh` when its title contains Han characters and as
`en` otherwise; override mixed titles per page with front matter:

```yaml
---
title: "R 语言实战"
titleLang: en      # forced into the English list
---
```

Enable the filtered views by adding two nested index pages under the section you
want to filter (the example site does this for `blog`):

```text
content/blog/_index.md            # /blog/          (all posts, existing page)
content/blog/chinese/_index.md    # /blog/chinese/  (Chinese titles)
content/blog/english/_index.md    # /blog/english/  (English titles)
```

```yaml
# content/blog/chinese/_index.md
---
title: 中文文章
listLang: zh
outputs: ["HTML"]   # the list has no pages of its own: skip its empty RSS feed
---
```

The child section paginates the matching subset of its **parent** section's
posts, so `/blog/chinese/`, `/blog/chinese/page/2/`, … are real URLs with their
own canonical/prev/next and work without JavaScript. The parent list shows the
same `全部 / 中文 / EN` toggle with per-language counts. Works for any section;
only `blog` is configured in the demo site.

The list chrome follows the list language: the pager reads `Page 1 of 2` /
`Newer` / `Older` on `/blog/english/` and `第 1 / 2 页` / `更新` / `更早` on
`/blog/chinese/`, and the `All` label becomes `全部` on Chinese lists. Article
chrome follows the post title language: `Contents` / `Last modified` /
`Copy` / `Copied!` for English titles, `目录` / `最后修改于` / `复制` / `已复制！`
for Chinese ones. Mixed titles can be pinned with `titleLang`.
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
├── data/lang.toml         bilingual UI strings for list/post language
├── i18n/                  en.toml, zh.toml, zh-cn.toml
├── layouts/
│   ├── _default/          baseof, single, list, search, index.json,
│   │   └── _markup/       render-image.html
│   ├── partials/          head, header, footer, pagination, post-date,
│   │   ├── icons/         sun, moon, chevrons, arrow-left
│   │   └──              theme-init, toc*, list-pages, list-lang-filter,
│   │                    title-lang, title-lang-lists
│   ├── books/             list.html (shelf) + single.html (reader)
│   ├── note|slides/       bare templates for pre-rendered content
│   ├── shortcodes/        figure.html
│   ├── 404.html, robots.txt, index.html
├── static/favicon.svg
└── exampleSite/           demo content + config
    └── content/blog/{chinese,english}/_index.md  # title-language lists
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
