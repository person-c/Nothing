---
title: advanced r - function
date: 2022-10-23
---



关于函数式编程语言，其一，需要有一类函数，也就是函数也是一个数据对象。其二，函数得是pure的。

A pure function satisfies two property:

- The output only depends on the inputs, i.e. if you call it again with the same inputs, you get the same outputs. This excludes functions like `runif()`, `read.csv()`, or `Sys.time()` that can return different values.
- The function has no side-effects, like changing the value of a global variable, writing to disk, or displaying to the screen. This excludes functions like `print()`, `write.csv()` and `<-`.

函数按其输入以及输出划分，分为普通函数(regular function)，泛函(functionals)，函数工厂(function factories)，函数算子(function operator)。

## Functionals

A functional is a function that takes a function as an input and returns a vector as output.

#### `map` family

**Basics**

- Simple achievement

  ```r
   simple_map <- function(x, f, ...) {
    out <- vector("list", length(x))
    for (i in seq_along(x)) {
      out[[i]] <- f(x[[i]], ...)
    }
      out
    }
  ```

- Arguments with `...`  
Putting them in an anonymous function means that they will be evaluated every time `f()` is executed, not just once when you call `map()`.

- Argements name  
Instead of being `x` and `f`, they are `.x` and `.f.`

- loop to get element in nested structure

  ```r
  x <- list(
    list(-1, x = 1, y = c(2), z = "a"),
    list(-2, x = 4, y = c(5, 6), z = "b"),
    list(-3, x = 8, y = c(9, 10, 11))
  )

  map_dbl(x, list("y", 1))
    #> [1] 2 5 9
  ```

- loop in `.f` arguments  

  ```r
  trims <- c(0, 0.1, 0.2, 0.5)
  x <- rcauchy(1000)

  map_dbl(trims, function(trim) mean(x, trim = trim))
  #> [1] -0.3500  0.0434  0.0354  0.0502
  ```

**various `map`**

One of the big differences between `map2()` and the simple function above is that `map2()` recycles its inputs to make sure that they’re the same length.

A big difference between `pmap()` and the other map functions is that `pmap()` gives you much finer control over argument matching because you can name the components of the list.

```r
params <- tibble::tribble(
  ~ n, ~ min, ~ max,
   1L,     0,     1,
   2L,    10,   100,
   3L,   100,  1000
)

pmap(params, runif)
#> [[1]]
#> [1] 0.332
#> 
#> [[2]]
#> [1] 53.5 47.6
#> 
#> [[3]]
#> [1] 231 715 515
```

`pmap`的数据是一个列表对列表的每个元素进行并行循环。

|                       | List     | Atomic            | Same type   | Nothing   |
|-----------------------|----------|-------------------|-------------|-----------|
| One argument          | `map()`  | `map_lgl()`, ...  | `modify()`  | `walk()`  |
| Two arguments         | `map2()` | `map2_lgl()`, ... | `modify2()` | `walk2()` |
| One argument + index  | `imap()` | `imap_lgl()`, ... | `imodify()` | `iwalk()` |
| N arguments           | `pmap()` | `pmap_lgl()`, ... | ---         | `pwalk()` |

#### Reduce family

If you’re using reduce() in a function, you should always supply `.init`.

`reduce2()`

`Map-reduce`

```r
l <- map(1:4, ~ sample(1:10, 15, replace = T))
str(l)
#> List of 4
#>  $ : int [1:15] 7 1 8 8 3 8 2 4 7 10 ...
#>  $ : int [1:15] 3 1 10 2 5 2 9 8 5 4 ...
#>  $ : int [1:15] 6 10 9 5 6 7 8 6 10 8 ...
#>  $ : int [1:15] 9 8 6 4 4 5 2 9 9 6 ...

reduce(l, intersect)
#> [1] 8 4

accumulate(l, intersect)
#> [[1]]
#>  [1]  7  1  8  8  3  8  2  4  7 10 10  3  7 10 10
#> 
#> [[2]]
#> [1]  1  8  3  2  4 10
#> 
#> [[3]]
#> [1]  8  4 10
#> 
#> [[4]]
#> [1] 8 4
```

#### Predicate functionals

A **predicate functional** applies a predicate to each element of a vector. purrr provides seven useful functions which come in three groups:

- `some(.x, .p)` returns `TRUE` if _any_ element matches;  
    `every(.x, .p)` returns `TRUE` if _all_ elements match;  
    `none(.x, .p)` returns `TRUE` if _no_ element matches.

- These are similar to `any(map_lgl(.x, .p))`, `all(map_lgl(.x, .p))` and
    `all(map_lgl(.x, negate(.p)))` but they terminate early: `some()` returns
    `TRUE` when it sees the first `TRUE`, and `every()` and `none()` return
    `FALSE` when they see the first `FALSE` or `TRUE` respectively.

- `detect(.x, .p)` returns the _value_ of the first match;
  `detect_index(.x, .p)` returns the _location_ of the first match.

- `keep(.x, .p)` _keeps_ all matching elements;
  `discard(.x, .p)` _drops_ all matching elements.

#### Base functions

**Matrices and arrays**

```
a2d <- matrix(1:20, nrow = 5)
apply(a2d, 1, mean)
#> [1]  8.5  9.5 10.5 11.5 12.5
apply(a2d, 2, mean)
#> [1]  3  8 13 18
```

**Mathematical concerns**

Functionals are very common in mathematics. The limit, the maximum, the roots (the set of points where `f(x) = 0`), and the definite integral are all functionals: given a function, they return a single number (or vector of numbers).

Base R provides a useful set:

- `integrate()` finds the area under the curve defined by `f()`
- `uniroot()` finds where `f()` hits zero
- `optimise()` finds the location of the lowest (or highest) value of `f()`

The following example shows how functionals might be used with a simple function, `sin()`:

```r
integrate(sin, 0, pi)
str(uniroot(sin, pi * c(1 / 2, 3 / 2)))
str(optimise(sin, c(0, 2 * pi)))
str(optimise(sin, c(0, pi), maximum = TRUE))
```

总结：对于循环来说，我们考虑的是循环的是什么。对于泛函结构`f(list(), .f(arg1 = ...1, arg2 = ...2, ...), arg = constant)`,我们将需要循环的内容放在`.f`前面，这个内容可以是`.f`的需要处理的数据向量，或者是变化的参数向量，将`.f`的固定内容放在`.f`后面，这些内容都是`.f`函数的参数，为了方便理解，建议显式的指定`.f`函数中的参数名称以及固定参数的名称。另外文中没有提到`map_if`, `modify_if`,因为我觉得这些选择现在可以用`across()`函数替代了，虽然该函数只能用于数据框结构。

## Function factories

> The enclosing environment of the manufactured function is an execution environment of the function factory.

#### Basics

- Environments  
  函数有三个元素，参数一致，函数体一致，manufactured function的环境不一样，所以函数的行为不一样。

- Force evaluation  
  Whenever a binding changes in between calling the factory function and calling the manufactured function, environment bindings of the manufactured functions's change, so the manufactured behaviour changes.To avoid this, make sure every argument is evaluated, using force() as necessary if the argument is only used by the manufactured function.

- Stateful function

  ```r
  new_counter <- function() {
  i <- 0
  
    function() {
      i <<- i + 1
      i
    }
  }
  
  counter_one <- new_counter()
  counter_two <- new_counter()
  ```

- Garbage collection  
  manufactured function 的环境会保存许多对象，对于不用的对象应该手动删除，因为garbage collector不会自动把它删除。

#### Case study

**Case in Graphical factories**  
  `ggplot`函数中的`lable`参数接受函数作为值，`scale`包提供了一系列的函数工厂生成`lable`参数的函数。

  ```r
  y <- c(12345, 123456, 1234567)
  comma_format()(y) #注意函数工厂comma_format返回的是一个函数，所以后面接上括号调用这个函数。
  #> [1] "12,345"    "123,456"   "1,234,567"

  umber_format(scale = 1e-3, suffix = " K")(y)
  #> [1] "12 K"    "123 K"   "1 235 K"
  ```

  `Histogram bins`的值也可以是函数。

  `ggsave()`中的函数工厂
  
  ```r
  plot_dev <- function(ext, dpi = 96) {
  force(dpi)
  
  switch(ext,
    eps =  ,
    ps  =  function(path, ...) {
      grDevices::postscript(
        file = filename, ..., onefile = FALSE, 
        horizontal = FALSE, paper = "special"
      )
    },
    pdf = function(filename, ...) grDevices::pdf(file = filename, ...),
    svg = function(filename, ...) svglite::svglite(file = filename, ...),
    emf = ,
    wmf = function(...) grDevices::win.metafile(...),
    png = function(...) grDevices::png(..., res = dpi, units = "in"),
    jpg = ,
    jpeg = function(...) grDevices::jpeg(..., res = dpi, units = "in"),
    bmp = function(...) grDevices::bmp(..., res = dpi, units = "in"),
    tiff = function(...) grDevices::tiff(..., res = dpi, units = "in"),
    stop("Unknown graphics extension: ", ext, call. = FALSE)
  )
  }

  plot_dev("pdf")
  #> function(filename, ...) grDevices::pdf(file = filename, ...)
  #> <bytecode: 0x7fe857744590>
  #> <environment: 0x7fe8575f6638>
  plot_dev("png")
  #> function(...) grDevices::png(..., res = dpi, units = "in")
  #> <bytecode: 0x7fe85947f938>
  #> <environment: 0x7fe859169548>
  ```

**Case in statistical factories**  
  没怎么看懂，不写!

**Case in combination of function factories and functionals**

```r
names <- list(
  square = 2, 
  cube = 3, 
  root = 1/2, 
  cuberoot = 1/3, 
  reciprocal = -1
)
funs <- purrr::map(names, power1)

funs$root(64)
#> [1] 8
funs$root
#> function(x) {
#>     x ^ exp
#>   }
#> <bytecode: 0x7fe85512a410>
#> <environment: 0x7fe85b21f190>

# 直接使用list中函数的三种方式
with(funs, root(100))
#> [1] 10

attach(funs)
#> The following objects are masked _by_ .GlobalEnv:
#> 
#>     cube, square
root(100)
#> [1] 10
detach(funs)

rlang::env_bind(globalenv(), !!!funs)
root(100)
#> [1] 10
```

总结：函数工厂可以返回的函数如果只有一个，那么其返回函数的函数体的形式必定是一致的，为了改变这些函数体形式一致的函数的行为，给予函数工厂的函数参数不同值，改变返回函数的环境中的binds，就可以改变这些manufactured function的行为。这种形式可以完美的和泛函结合，产生大量的函数；函数工厂如果可以返回多个函数，那么一般形式为通过函数工厂的输入参数，经过`choice`结构，返回合适的函数。

## Fuction operators

> A function operator is a function that takes one (or more) functions as input and returns a function as output.  
They’re just a function factory that takes a function as input

#### Case study

**Capturing errors with `purrr::safely()`**

`safely()` is a function operator that transforms a function to turn errors into data.

- `possibly()`: returns a default value when there’s an error. It provides no way to tell if an error occured or not, so it’s best reserved for cases when there’s some obvious sentinel value (like `NA`).

- `quietly()`: turns output, messages, and warning side-effects into output, message, and warning components of the output.

- `auto_browser()`: automatically executes `browser()` inside the function when there’s an error.

```r
x <- list(
  c(0.512, 0.165, 0.717),
  c(0.064, 0.781, 0.427),
  c(0.890, 0.785, 0.495),
  "oops"
)

out <- map(x, safely(sum))
str(out)
#> List of 4
#>  $ :List of 2
#>   ..$ result: num 1.39
#>   ..$ error : NULL
#>  $ :List of 2
#>   ..$ result: num 1.27
#>   ..$ error : NULL
#>  $ :List of 2
#>   ..$ result: num 2.17
#>   ..$ error : NULL
#>  $ :List of 2
#>   ..$ result: NULL
#>   ..$ error :List of 2
#>   .. ..$ message: chr "invalid 'type' (character) of argument"
#>   .. ..$ call   : language .Primitive("sum")(..., na.rm = na.rm)
#>   .. ..- attr(*, "class")= chr [1:3] "simpleError" "error" "condition"

out <- transpose(map(x, safely(sum)))
str(out)
#> List of 2
#>  $ result:List of 4
#>   ..$ : num 1.39
#>   ..$ : num 1.27
#>   ..$ : num 2.17
#>   ..$ : NULL
#>  $ error :List of 4
#>   ..$ : NULL
#>   ..$ : NULL
#>   ..$ : NULL
#>   ..$ :List of 2
#>   .. ..$ message: chr "invalid 'type' (character) of argument"
#>   .. ..$ call   : language .Primitive("sum")(..., na.rm = na.rm)
#>   .. ..- attr(*, "class")= chr [1:3] "simpleError" "error" "condition"
```

**Caching computations with `memoise::memoise()`**
> This is an example of dynamic programming, where a complex problem can be broken down into many overlapping subproblems, and remembering the results of a subproblem considerably improves performance.

```r
fib2 <- memoise::memoise(function(n) {
  if (n < 2) return(1)
  fib2(n - 2) + fib2(n - 1)
})
system.time(fib2(23))
#>    user  system elapsed 
#>   0.009   0.000   0.008
```

**Creating your own function operators**

```r
urls <- c(
  "adv-r" = "https://adv-r.hadley.nz", 
  "r4ds" = "http://r4ds.had.co.nz/"
  # and many many more
)
path <- paste(tempdir(), names(urls), ".html")

delay_by <- function(f, amount) {
  force(f)
  force(amount)
  
  function(...) {
    Sys.sleep(amount)
    f(...)
  }
}


dot_every <- function(f, n) {
  force(f)
  force(n)
  
  i <- 0
  function(...) {
    i <<- i + 1
    if (i %% n == 0) cat(".")
    f(...)
  }
}

walk2(
  urls, path, 
  download.file %>% dot_every(10) %>% delay_by(0.1), 
  quiet = TRUE
)
```

总结：函数算子可以认为是函数工厂的特殊形式。函数算子一般形式为接收一个函数，然后返回一个对其复合的函数。无论是函数工厂还是函数算子，其思想都是对一个简单的函数，进行特定的改变而获得合适的函数。问题分解为简单函数，借助于简单函数的改变，组合解决复杂问题，大概就是函数式编程的一个重要思想。需要注意的是，函数算子返回的函数与函数工厂返回的函数同样带有可以保存对象的环境。
