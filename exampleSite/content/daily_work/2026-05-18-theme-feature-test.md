---
title: Theme Feature Test
date: 2026-05-18
---

This post tests all theme features: footnotes, table of contents, images, figures, code blocks, tables, and blockquotes.

## Headings and TOC

The table of contents on the right sidebar is generated from `h2`, `h3`, and `h4` headings. On wide screens, `h3` and `h4` are nested under their parent `h2` with a collapsible toggle.[^1]

### Nested Level 3 Heading

This is a level-3 heading nested under the first H2. It should appear indented in the TOC.

#### Even Deeper Level 4

Level-4 headings nest further under H3. They use a smaller font and lighter color in the TOC.

### Another Level 3 Under Same H2

This tests multiple H3 siblings under one H2 parent.

## Footnotes System

### Basic footnotes

This paragraph contains a footnote reference to demonstrate the dynamic sidenotes.[^2] On wide screens (>800px), footnotes appear in the left sidebar, aligned with their references. On narrow screens, they collapse into inline containers below each paragraph.[^3]

### Dense footnotes (overlap test)

This single sentence has three footnote references packed close together[^5][^6][^7] — they should not overlap in the sidenotes sidebar. The overlap-prevention logic enforces a minimum vertical gap between consecutive footnotes, pushing later ones down when needed.

### Footnotes with code

A footnote can contain inline code like `dplyr::mutate()` or even a code block:[^8]

### Footnotes with mixed content

A footnote can also contain a blockquote[^9] or other block-level elements. The typography scales down proportionally so the content doesn't look mismatched next to the plain-text footnotes.

## Images and Figures

A standalone image:

![A placeholder test image](https://placehold.co/600x300/007bff/white?text=Standalone+Image)

An image wrapped in a `<figure>` with a caption:

<figure>
  <img src="https://placehold.co/600x300/333/white?text=Figure+Example" alt="Figure example">
  <figcaption>Figure 1: A captioned image using the figure/figcaption elements. The caption is rendered in italic with a lighter color.</figcaption>
</figure>

This image is 1200px wide — wider than the article (~800px) but fits within the layout (~1400px), so it auto-expands:

![Auto-fullwidth image](https://placehold.co/1200x400/28a745/white?text=Fits+Layout-Expands+1200px)

This image is 1600px wide — exceeds the layout width, so it keeps its original size (scrollbar if needed):

![Extra wide image](https://placehold.co/1600x400/dc3545/white?text=Exceeds+Layout-No+Expand+1600px)

## HTML Widgets and Iframes

This iframe is 1200px wide — wider than the article but fits within the layout, so it auto-expands:

<iframe src="https://placehold.co/1200x500/6f42c1/white?text=Fits+Layout+1200px" width="1200" height="500" frameborder="0"></iframe>

## Code Blocks

Code blocks use Monokai highlighting with line numbers. Here is an R example:

```r
# A simple linear model
set.seed(123)
x <- rnorm(100)
y <- 2 * x + rnorm(100, sd = 0.5)
fit <- lm(y ~ x)
summary(fit)
```

### Wide Code Block - Fits Layout (will expand)

This code block is wider than the article (~800px) but fits within the layout (~1400px), so it will auto-expand to full width:

```r
# At 14px monospace, this line is ~1000px wide — fits in 1400px layout but overflows 800px article
data_summary <- data.frame(variable = names(mtcars), mean = colMeans(mtcars), sd = apply(mtcars, 2, sd), median = apply(mtcars, 2, median))
```

### Very Wide Code Block - Exceeds Layout (will NOT expand)

This code block is wider than the full layout — expanding would not eliminate the scrollbar, so it keeps its original scrollbar:

```r
# This very long line should trigger the fullwidth auto-detection when it exceeds the article column width
result <- data.frame(x = rnorm(1000), y = rnorm(1000), category = sample(c("treatment_a", "treatment_b", "control_group_placebo"), 1000, replace = TRUE), value = runif(1000), description = "This is a very wide data frame construction line that demonstrates the fullwidth feature for code blocks with horizontal overflow")
```

A Python example:

```python
def fibonacci(n: int) -> list[int]:
    """Return the first n Fibonacci numbers."""
    seq = [0, 1]
    for _ in range(2, n):
        seq.append(seq[-1] + seq[-2])
    return seq[:n]

print(fibonacci(10))
```

## Tables

A normal table:

| Package | Version | Description |
|---------|---------|-------------|
| data.table | 1.15.0 | Fast data manipulation |
| ggplot2 | 3.5.0 | Grammar of graphics |
| rlang | 1.1.3 | Tools for working with R expressions |
| purrr | 1.0.2 | Functional programming toolkit |

### Wide Table - Fits Layout (will expand)

This table has 8 columns with long URLs that make it wider than the article (~1000px) but still narrower than the layout (~1400px):

| Package | Version | Description | Author | License | Imports | Suggests | Repository URL |
|---------|---------|-------------|--------|---------|---------|----------|----------------|
| data.table | 1.15.0 | Fast aggregation of large data | M. Dowle | MPL-2.0 | methods, utils | knitr, bit64 | https://rdatatable.gitlab.io/data.table |
| ggplot2 | 3.5.0 | Create elegant data visualizations | H. Wickham | MIT | scales, gtable, MASS | dplyr, tidyr | https://ggplot2.tidyverse.org |
| shiny | 1.9.0 | Build interactive web applications | RStudio | GPL-3 | httpuv, jsonlite, xtable | testthat, shinytest | https://shiny.posit.co |

## Blockquotes

> This is a blockquote. It has a subtle left border and muted text color.
>
> Blockquotes can span multiple paragraphs. The styling is intentionally understated to match the theme's minimalist design.

## Inline Elements

This sentence contains **bold text**, *italic text*, and `inline code`. Links like [this one](https://example.com) have a dashed underline that turns solid on hover.

[^1]: TOC generation is handled by `initTableOfContents()` in `article-page.js`. It scans `h2`, `h3`, and `h4` elements and builds a nested list with expandable sub-items.

[^2]: The footnote system works by finding all `a.footnote-ref` links, cloning the content from the hidden `div.footnotes` at the bottom of the article, and positioning them dynamically.

[^3]: This is the responsive behavior: sidenotes on large screens, inline containers on small screens. The breakpoint is 800px.

[^4]: Each footnote reference uses `sup.footnote-ref` with the primary blue color. Clicking a footnote reference scrolls to the original footnote definition.

[^5]: This is the first of three dense footnotes. It should appear at its natural position, aligned with its reference in the text.

[^6]: This is the second dense footnote. If it would overlap with footnote 5, it gets pushed down by the overlap-prevention logic (minimum 12px gap).

[^7]: This is the third dense footnote. Notice how it stacks neatly below the first two without any visual collision, even though all three references are on the same line of text.

[^8]: The footnote system clones content from the hidden `div.footnotes`, so any Markdown-rendered HTML works. For example, an R snippet:

    ```r
    # code inside a footnote scales down
    mean_ci <- function(x) {
      m <- mean(x)
      se <- sd(x) / sqrt(length(x))
      c(lower = m - 1.96 * se, upper = m + 1.96 * se)
    }
    ```

    Inline elements like `data.table::fread()` also scale properly.

[^9]: > Blockquotes inside footnotes use a smaller font and tighter margins so they blend in with the surrounding notes. This keeps the sidebar visually cohesive.