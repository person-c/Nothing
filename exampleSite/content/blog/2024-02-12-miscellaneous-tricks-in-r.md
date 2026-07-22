---
title: miscellaneous tricks in r
date: 2024-02-12
---

About a year ago, I decided to stop using `dplyr` for data processing and switched to using `data.table`. One important reason is its more concise syntax in most situations and faster performance. Another reason is that using tidy-like code often involves loading many packages, leading to a miscellaneous workspace. Tidy-like code typically involves repeating some behaviors in base R but provides a unified interface for performing tasks more conveniently and rigorously.

In certain cases, we might want to generate an R expression for later use. A concrete example is producing a linear expression from a named vector:

```r
fit <- c(x = 1, y = 2)

coef_sym <- syms(names(fit))
coefs <- unname(fit)

summands <- map2(coef_sym, coefs, ~ expr((!!.x * !!.y)))
eq <- purrr::reduce(summands, ~ expr(!!.x + !!.y))
```

This solution is from the [Advanced R](https://adv-r.hadley.nz/quasiquotation.html#expr-case-studies) book. The `rlang` and `purrr` packages provide functions related to non-standard evaluation (NSE) and functional programming tools. However, achieving the same result is possible using functions in base R. Some functions related to metaprogramming are listed below:

- `parse` and `deparse`: Convert between character string and expression.
- `quote`: Quote an R expression.
- `expression`: Quote multiple R expressions.
- `bquote`: Quoting and unquoting within a function call.
- `substitute`: Substitutes the values of variables into an R expression.
- `call` and `as.call`: Construct a function call.
- `eval`: Evaluate an R expression in a specified environment.

`bquote`:

>An analogue of the LISP backquote macro. `bquote` quotes its argument, except that terms wrapped in .() are evaluated in the specified environment. If `splice = TRUE`, then terms wrapped in ..() are evaluated and spliced into a call.

`substitute`:

>`substitute` returns the parse tree for the (unevaluated) expression `expr`, substituting any variables bound in `env`.

Thus, we can do it like this:

```r
# Assuming 'fit' is a named numeric vector
fit <- c(x = 1, y = 2)

coef_sym <- names(fit)
coefs <- unname(fit)

summands <- mapply(function(x, y) bquote(.(as.name(x)) * .(y)), coef_sym, coefs, SIMPLIFY = FALSE)
eq <- Reduce(function(x, y) bquote(.(x) + .(y)), summands)
```

In `data.table`, we might want to construct different models for various variables, such as performing univariate Cox regression for multiple variables. We can achieve this as follows(This solution was originally from [stackoverflow](https://stackoverflow.com/)):

```r
candidate <- c('ARG1', 'CASP9')
dt <- data.table(exp_vars = candidate)
formulas <- sprintf("Surv(OS, vital_status) ~ %s", candidate)

dt[, let(model = lapply(formulas, function(f) coxph(as.formula(f), data = train)) ), by = exp_vars]
dt[, let( # get p value
  p.cox = sapply(model, function(mod) summary(mod)$coefficients[1, "Pr(>|z|)"]),
  p.cox.zph = sapply(model, function(model) cox.zph(model)$table[1, 3])
)]
```
