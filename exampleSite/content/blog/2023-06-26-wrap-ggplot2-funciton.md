---
title: wrap ggplot2 function
date: 2023-06-26
---

I am recently wrapping some ggplot2 functions in my package [easybio](https://github.com/snowGlint/easybio) but encountered a problem; According to the [documentation](https://ggplot2-book.org/programming.html#introduction) and my knowledge of eval_tidy, we should do it like this to wrap a function with quoted arguments in a tidy-like function:

```r
f1 <- function(data, x, y, color) {
  ggplot(data, aes({{x}}, {{y}}, {{color}})) +
  geom_point()
}
```

This works well. However, when I want to add additional aesthetic arguments `...` to the `f1` function, it doesn't seem to work. Instead of wrapping `...` in `{{}}`, no special operations need to be performed as if the `...` argument is a common argument:

```r
f1 <-  function(data, x, y, color, ...) {
  ggplot(data, aes({{x}, {{y}, {{color}}, ...)) +
  geom_point()
}
```

Finally, I found this [documentation](https://rlang.r-lib.org/reference/topic-metaprogramming.html#forwarding-patterns) in `rlang` package referring to this-Passing `...` is equivalent to the combination of `enquos()` and `!!!`:

```r
my_group_by <- function(.data, ...) {
  .data %>% dplyr::group_by(...)
}
my_group_by <- function(.data, ...) {
  .data %>% dplyr::group_by(!!!enquos(...))
}
```
