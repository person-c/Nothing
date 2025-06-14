---
title: health statistic
---

The lazy evaluation arguments in `eval()` function indeed confused me for a few days. I realize that problem when I read the Learning R programming(the Chinese edition); There is a part of  code like this:


```r
qs <- function(x, range) { 
  range <- substitute(range)
  selector <-eval(range, list(. = length(x)))
  x[selector]
```

Here, we create a function that quotes the range argument; then evaluate the range expression in a list environment that the dot`.` represents the length of x. A concrete example is as follows:

```r
x <- 1:10
qs(x, 3:(. - 5))
```

Issues occur when we try to wrap this kind of function with quoted arguments.

```r
trim_margin <- function(x, n) {
  qs(x, (n + 1) : (. - n - 1))
}
```

The `trim_margin` function aims to trim n paired-end elements in a vector; However, errors happened: 'can't find the object n';

We know that R finds its variable's value through the lexical scope; There are three environments related to function; When the function executes, it's executed in a temporary environment; And its parent environment is its closed environment where the function was defined; That's lexical scope. However, in the example above, the `qs` function in `trim_margin` function was defined in the global environment which doesn't contain the variable `n`; The `n` existed in the execution environment of `trim_margin` function; That's the called environment of the `qs` function(find variable value in a caller environment named dynamic scope); We can get this environment through `parent.frame()`; However, the `eval()` function uses the `parent.frame()` as the default enclose environment of the expression when the argument `envir` is a list.

```r
r$> eval
function (expr, envir = parent.frame(), enclos = if (is.list(envir) 
    is.pairlist(envir)) parent.frame() else baseenv())
.Internal(eval(expr, envir, enclos))
<bytecode: 0x000001640dd05420>
<environment: namespace:base>
```

What happens here is lazy evaluation in the function's argument - the function arguments are only evaluated when needed; A example from **Advanced R**:

```r
z <- 1
f1 <- function(x = ls()) {
  y <- 2
  x
}

f1() # ls() evaluated in the function execution environment
[1] "x" "y"
f1(ls()) # ls() evaluated in the global environment
[1] "f1" "z"
```

We can find that the user-supplied `ls()` executed in the global environment, but the arguments computed as the default value `ls()` executed in the `f1` execution environment; That's why the `eval()` in the `qs` can't find `n` although its default enclose environment is the `parent.frame()` function; The parent frame is computed in the eval execution environment; which returns the `qs` execution environment as an enclosed environment; However, the `n` existed in the `trim_margin` execution environment; To achieve this, just user supplied the `eval()`  `enclos` argument to `parent.frame()` which execute in the `qs` execution environment and returns the caller function of `qs`- that is the execution environment of `trim_margin` where variable `n` existed.

```r
qs <- function(x, range) { 
  range <- substitute(range)
  selector <-eval(range, list(. = length(x)), enclos = parent.frame())
  x[selector]

trim_margin <- function(x, n) {
  qs(x, (n + 1) : (. - n - 1))
}
```

All perfect!
