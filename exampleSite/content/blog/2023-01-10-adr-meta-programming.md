---
title: advanced r - meta programming
date: 2023-01-10
---


## 序

代码也是数据，可以用代码进行检查和修改。为了实现对代码数据的修改，我们需要区分代码数据和代码本身，毕竟它们在形式上是一致的。我们需要将代码用`expr()`包裹，然后对这个返回的对象进行修改，这个返回的对象称之为表达式（*expression*），也就是我们可以用于修改的代码数据。但是对于传入函数的参数，我们需要用`enexpr()`对其进行包裹，才能返回表达式。表达式是一类数据的总称，包括四个方面的内容，*call, symbol, constant, pairlist*。

和其它语言一样，代码数据被抽象为类似树的结构，称为抽象语法树（*abstract syntax tree*）。函数的调用为树的分支，树的叶子为*symbol, contants*。一个例子如下：

```r
r$> lobstr::ast(1 + 2 * 3)
█─`+` 
├─1 
└─█─`*` 
  ├─2 
  └─3 
```

既然表达式是数据，那么我们就可以用代码生成该数据。其中一个生成*call*表达式一个方法就是`call2()`函数。

```r
r$> call2("f", 1, 2, 3)
f(1, 2, 3)
```

这方法比较简单，但是在构建比较复杂的表达式时比较困难。还有一种方法就是通过对简单表达式进行组合，形成比较复杂的表达式。为了组合不同的表达式我们需要使用特殊的符号`!!`，该符号所进行的操作称为“解引用”。你可以将其理解为插入操作，其是在表达式中的一个特殊语法，只有在返回表达式的函数，例如`expr()`中可以理解该语法，类似于`R`中的胶水语法，可以将变量代表的表达式插入表达式。一个例子如下：

```r
r$> xx <- expr(x + x)

r$> yy <- expr(y + y)

r$> expr(!!xx / !!yy)
(x + x)/(y + y)
```

对代码数据，即表达式，修改之后怎么执行呢？我们唯一需要做的就是定义这个表达式所在的环境，也就是对表达式的*symbol*提供来源。*baseR*提供了函数`base::eval`用于执行表达式：

```r
r$> eval(expr(x + y), env(x = 1, y = 2))
[1] 3
```

如果你没有在`base::eval`中定义环境，那么该函数会默认使用当前环境。手动执行表达式的好处在于，你可以自己定义执行的环境，这主要有两个用处：

- 在写领域内特定的函数时，重写某些函数的定义，比如`+`。
  
- 可以把数据框的变量作为环境(*data mask*)。

以下是一个重写函数定义的例子：

```r
r$> string_math <- function(x) {
      e <- env(
        caller_env(),
        `+` = function(x, y) paste0(x, y),
        `*` = function(x, y) strrep(x, y)
      )
 
      eval(enexpr(x), e)
    }

r$> name <- "Hadley"

r$> string_math("Hello " + name)
[1] "Hello Hadley"

r$> string_math(("x" * 2 + "-y") * 3)
[1] "xx-yxx-yxx-y"
```

`dplyr`把这一思想发挥到了极致，`dplyr`会把`R`在一个会将`R`代码生成*SQL*的环境中运行，然后在远端数据库中执行这些`SQL`代码。

当然，在环境中重新定义函数的意义需要很多的投入，我们更加常用的是，将表达式在数据框（数据框，列表，环境的结构类似）中执行（*data mask*）。这里我们用`rlang::eval_tidy`作为例子，`base::eval`当然也可以做到，不过它具有某些缺点，我们后面再讨论。

```r
r$> df <- data.frame(x = 1:5, y = sample(5))

r$> eval_tidy(expr(x + y), df)
[1]  2  6  5  7 10
```

我们将它封装起来，就可以形成一个类似于`base::with()`的函数。

```r
r$> with2 <- function(df, expr) {
      eval_tidy(enexpr(expr), df)
    }

r$> with2(df, x + y)
[1]  2  6  5  7 10
```

但是这个函数有个问题，稍微修改一下这个函数：

```r
r$> with2 <- function(df, expr) {
      a <- 1000
      eval_tidy(enexpr(expr), df)
    }

r$> df <- data.frame(x = 1:3)

r$> a <- 10

r$> with2(df, x + a)
[1] 1001 1002 1003
```

这里的问题在于，当我们给函数传递参数的时候，我们希望的是它的值就是我们在外面定义的值，即`a <- 10`。但是在执行时，函数显然使用的是`with2`函数环境中的`a <- 1000`。为了解决这个问题，我们引入一种新的数据结构`quosure`。`quosure`将表达式与它的环境绑定在一起，为了方便，我将`quosure()`函数返回的数据称之为`quosure`表达式，因为其除了用属性记录其环境以外，其它方面与之前提到的表达式并无区别。`eval_tidy`函数正是为`quosure`表达式而设计的，因为在使用*data mask*时，引入了一个问题：在你执行表达式时，表达式中的变量`x`的是来源于数据框还是环境呢？为了解决这个问题，`eval_tidy`可以识别新的语法，即代词前缀。`eval_tidy`中的表达式可以显式的指定变量的来源-`eval_tidy(expr(.data$x + .env$y), df)`，这种表达式中使用代词前缀的语法，只有在`eval_tidy`中可以识别，用于解决在使用`data mask`时，表达式中歧义的问题。

```r
r$> with2 <- function(df, expr) {
      a <- 1000
      eval_tidy(enquo(expr), df)
    }

r$> with2(df, x + a)
[1] 11 12 13
```

当你在使用*data mask*的时候，应该始终使用`enquo()`，而不是`enexpr()`。

tidy-like function

```r
r$> tidy_mean <- function(df, x) {
    arg <- enexpr(x)
    eval_tidy(expr(mean(!!arg)), df)
    }

r$> df <- tibble(x = runif(10), y = runif(10))

r$> tidy_mean(df, y)
[1] 0.3527402
```

## Expression

表达式是我们需要用代码进行修改的代码数据。为了将代码本身与代码数据区分开来（毕竟它们在形式上是一致的），我们需要对代码进行一些函数操作然后返回表达式对象，之后才能用代码修改这些对象。

#### Abstract syntax trees

抽象语法树是将代码数据从语法上进行抽象的树结构。在R中我们可以用`rlang::ast()`将代码的结构抽象为树。一个例子如下：

```r
r$> lobstr::ast(
      y <- x * 10 # important
      )
█─`<-` 
├─y 
└─█─`*` 
  ├─x 
  └─10 
```

需要注意的是从代码到树的结构，信息是有损失的，可以看到在原代码中的注释信息，空格没有在树的结构中表现。

#### Expressionsion construction

表达式可以包含以下的数据类型，*constant, symbols, calls*以及不怎么常见的*pairlist*等。

*constant*是自引的，这意味着`expr(1)`与`1`是一样的，所以如果我们需要构建一个*constant expression*，不用进行特殊的操作。即代码中的*constant*与表达式中的*constant*是一致的。

```r
r$> identical(1, expr(1))
[1] TRUE
```

你也可以用`is_syntax_identical()`进行判断。

```r
r$> is_syntactic_literal(1)
[1] TRUE
```

为了构建一个*symbol expression*，你可以这么操作：

```r
expr(x)

sym("x")
```

*calls expression*的结构是一种特殊的列表，可以通过如下的方式进行构建以及修改。

```r
r$> call2(expr(base::mean), x = expr(x), na.rm = TRUE) -> a

r$> a
base::mean(x = x, na.rm = TRUE)

r$> typeof(a)
[1] "language"

r$> is.call(a)
[1] TRUE

r$> a[[1]]
base::mean

r$> a[[2]]
x

r$> a[[2]] <- expr(y)

r$> a
base::mean(x = y, na.rm = TRUE)
```

或者直接用`expr()`：

```r
r$> b <- expr(base::mean(x = c(1, 2, 3), na.rm = TRUE))

r$> b
base::mean(x = c(1, 2, 3), na.rm = TRUE)

r$> list(b[[1]], b[[2]])
[[1]]
base::mean

[[2]]
c(1, 2, 3)
```

一个比较特殊的`call expression`结构：

```
r$> lobstr::ast(pkg::foo(1))
█─█─`::` 
│ ├─pkg 
│ └─foo 
└─1 
```

#### parser and grammer

一门编程语言将字符转换为表达式的过程称之为*parser*，而转换过程所使用的规则称之为*grammer*。

装换的过程有两个问题：

1. 中缀函数的运算优先级，`R`中的中缀函数的优先级有18组，可以通过`?Syntax`查看。需要注意的就是`!`符号的优先级可能比你想的要低很多。

2. 同一个中缀函数，从左边还是右边开始计算呢？R中大多数都从左边开始计算，除了赋值符号以及指数运算。

你也可以自己手动将字符转为表达式，或者将表达式转为字符。但是两者并不是完全等价的因为*parse*会生成语法树，这意味着，字符中的反引号，空格，以及注释都会被去掉。例子如下：

```r
r$> x <- "1 + 2"

r$> a <- parse_expr(x)

r$> a
1 + 2

r$> typeof(a)
[1] "language"

r$> expr_text(a)
[1] "1 + 2"
```

`base R`中也有类似的函数，不过那是为将文本转换为代码设计的，你可以这么操作：

```r
r$> parse(text = x)
expression(1 + 2)

r$> is.expression(parse(text = x))
[1] TRUE
```

它返回的是一个表达式的向量。同样地*base R*中的`deparse`返回的也是一个向量。

#### Specialised data structures

- pairlists

pairlists是R过去的遗留产物。只有`calls expression`中的函数为`function`函数时，函数的参数值就存储在pairlists的结构中。一般情况下，完全可以把pairlists当作list进行操作。

```r
r$> f <- expr(function(x, y = 10) x + y)

r$> args <- f[[2]]

r$> args
$x


$y
[1] 10


r$> typeof(args)
[1] "pairlist"
```

- missing arguments

```r
r$> missing_arg()


r$> typeof(missing_arg())
[1] "symbol"

r$> is_missing(missing_arg())
[1] TRUE
```

`missing_arg`的特别之处在于，你不能设置一个变量指向它，除非将它存储在其它数据结构之中。在用到它的时候我们一般会用到辅助函数`maybe_missing`函数。缺失参数主要用于参数`...`。

```r
m <- missing_arg()
m
#> Error in eval(expr, envir, enclos): argument "m" is missing, with no default

ms <- list(missing_arg(), missing_arg())
ms[[1]]
```

- expression vectors

表达式向量仅通过两个函数构建；`expression()` 以及 `parse()`。

```r
r$> exp1 <- parse(text = c("
    x <- 4
    x
    "))
    exp2 <- expression(x <- 4, x)

r$> typeof(exp1)
[1] "expression"

r$> typeof(exp2)
[1] "expression"

r$> exp1[[1]]
x <- 4

r$> exp2[[2]]
x
```

## Quasiquotation

本章旨在介绍如何将用户通过函数参数输入的代码转化为表达式，并与开发者提供的表达式进行组合。所谓的非标准性评估的函数，其实关键在于函数参数是否被“引用”。

#### quote

将代码，或者函数的参数值转换为表达式，这个操作称之为引用（*quote*)。
tidy:

|      | Developer | User        |
|------|-----------|-------------|
| One  | `expr()`  | `enexpr()`  |
| Many | `exprs()` | `enexprs()` |

base:

|      | Developer | User                         |
|------|-----------|------------------------------|
| One  | `quote()` | `substitute()`               |
| Many | `alist()` | `as.list(substitute(...()))` |

`substitute`函数正如它的名字一样，除了将参数值转化为表达式外，还具有替换功能，实际上一定程度上实现了表达式的组合。

```r
r$> f4 <- function(x) substitute(x * 2)

r$> f4(a + b + c)
(a + b + c) * 2
```

#### unquote

解引用的含义在于，执行表达式`expr()`中以符号`!!`开始的代码，然后返回新的表达式，即`expr(!!x)`，这样就可以实现代码数据的修改以及组合，所以符号`!!`称为插入操作符，因为它可以在表达式中插入表达式,如序所说，你可以将符号`!!`理解为在返回表达式的函数中支持的一种特殊的插入语法。而`eval()`执行的是整个表达式，即`eval(expr())`。

一个例子如下：

```r
r$> x <- list(x = 10, y = 100)

r$> y <- expr(mean(c(1, 2, 3)))

r$> z <- sum(1, 2)

r$> expr(map(!!x, ~ .x * 10 + !!y + z))
map(list(x = 10, y = 100), ~.x * 10 + mean(c(1, 2, 3)) + z)

r$> a <- expr(map(!!x , ~ .x * 10 + !!y + !!z))

r$> a
map(list(x = 10, y = 100), ~.x * 10 + mean(c(1, 2, 3)) + 3)

r$> eval(a)
$x
[1] 105

$y
[1] 1005
```

一些特殊的解引用：

- 插入函数

```r
r$> f <- expr(foo)
    expr((!!f)(x, y))
foo(x, y)
```

- 插入缺失参数

```r
arg <- missing_arg()
expr(foo(!!maybe_missing(arg), !!maybe_missing(arg)))
#> foo(, )
```

- 非前缀函数

```r
x <- expr(x)
expr(`$`(df, !!x))
#> df$x
```

- 插入多个参数
  
如果你有一个列表含有多个表达式，你可以通过`!!!`将列表的每个元素同时插入。需要注意的是，这种情况下，你只能将其插入函数，作为函数参数。

```r
xs <- exprs(1, a, -b)
expr(f(!!!xs, y))
#> f(1, a, -b, y)

# Or with names
ys <- set_names(xs, c("a", "b", "c"))
expr(f(!!!ys, d = 4))
#> f(a = 1, b = a, c = -b, d = 4)
```

实际上，你不仅可以在表达式中插入表达式，还可以插入其它复杂的对象。但是，在你打印出返回的表达式时，这些复杂对象的属性将不会打印出来，为了方便查看结果，你可以使用`rlang::expr_print()`。

```r
r$> x1
class(list(x = 10))

r$> expr_print(x1)
class(<df[,1]>)

r$> eval(x1)
[1] "data.frame"
```

#### Non-quoting

base R通过其它技术实现类似的表达式的组合的效果，称之为*non-quoting*，其中含有一个类似的函数可以实现解应用。

```r
r$ xyz <- bquote(x + y +z)

r$> bquote(-.(xyz) / 2)
-(x + y + z)/2
```

但是该函数无法用于函数参数，实现代码重组，baseR采用其它的技术实现类似的效果。

- A pair of quoting and non-quoting functions.

- A pair of quoting and non-quoting arguments.

- An argument that controls whether a different argument is quoting or non-quoting.

- Quoting if evaluation fails.

#### `...`(dot-dot-dot)

上面提到“解引用”时，符号`!!!`在返回表达式的函数中意义是将列表切割插入表达式中，实际上不仅返回表达式的函数支持该语法，函数`list2()`中也支持该语法，并且在其中支持表达式作为变量名。

```r
r$> arg <- list(x = 1, y = 2)

r$> f <- function(...) enexprs(...)

r$> f(!!!arg)
$x
[1] 1

$y
[1] 2


r$> f <- function(...) list2(...)

r$> f(!!!arg)
$x
[1] 1

$y
[1] 2
```

表达式作为变量名：

```r
r$> var <- "x"
    val <- c(4, 3, 9)

r$> tibble::tibble(!!var := val)
# A tibble: 3 × 1
      x
  <dbl>
1     4
2     3
3     9
```

注意这里使用的是符号`:=`，而不是`=`，因为`=`不支持这种做法。我们将用函数`list2(...)`中的点称为*tidy dots*。

如果你想要在非`tidy dot`函数中使用这个技巧(将函数参数放在一个列表之中，以及用表达式作为参数名），你可以这么做：

```r
# Directly
exec("mean", x = 1:10, na.rm = TRUE, trim = 0.1)
#> [1] 5.5

# Indirectly
args <- list(x = 1:10, na.rm = TRUE, trim = 0.1)
exec("mean", !!!args)
#> [1] 5.5

# Mixed
params <- list(na.rm = TRUE, trim = 0.1)
exec("mean", x = 1:10, !!!params)
#> [1] 5.5
```

特别地，你还可以同时相同参数的不同函数同时处理。

```r
x <- c(runif(10), NA)
funs <- c("mean", "median", "sd")

x <- c(runif(10), NA)
funs <- c("mean", "median", "sd")

purrr::map_dbl(funs, exec, x, na.rm = TRUE)
#> [1] 0.444 0.482 0.298
```

实际上`list2()`函数是对`dots_list()`函数的封装，其设置了一些默认的行为，你可以用`dots_list()`函数对参数做更为精密的控制。

其实在`base R`中已经提供了一个非常有效的函数`do.call()`，用于解决函数参数在一个列表中的问题。

```r
do.call("rbind", dfs)
#>   x
#> 1 4
#> 2 3
#> 3 9
```

同时，*base R*中还有一些其它的技术，用于避免使用`do.call`函数。

#### case

- `rlang::ast`函数会引用其参数，为了展示存储在变量中的表达式结构，我们可以在`ast`函数中使用插入符号`!!`。`x <- expr(x + y); ast(!!x)`。

- 生成线性表达式，主要通过`map`以及`reduce`函数实现。

- 数组切割函数，主要涉及到缺失参数的处理。

- 用`new_function`，使用函数各部分的表达式定义函数，用于函数工厂以及曲线绘图函数-曲线绘图涉及描点，即定义一些变量`x`的取值，然后得到`y`值，对这些点进行连接得到曲线，然后把表达式转为字符，作为*y*轴坐标。

## Evaluation

Together, quasiquotation, quosures, and data masks form what we call tidy evaluation, or tidy eval for short.

The user-facing inverse of quotation is unquotation: it gives the user the ability to selectively evaluate parts of an otherwise quoted argument. The developer-facing complement of quotation is evaluation: this gives the developer the ability to evaluate quoted expressions in custom environments to achieve specific goals.

#### Basics

对于evaluation来说，执行的一定是表达式，才可以自定义环境执行。如果不是，则会按正常的代码执行。

```r
r$> x <- 10

r$> eval(x + 1, env(x = 1000))
[1] 11

r$> eval(expr(x + 1), env(x = 1000))
[1] 1001
```

几个例子：

- `local()`。用于将会生成无用的占用内存比较大的计算。其原理就是简单的把代码转换为表达式，然后在临时环境中执行。就像函数执行一样，执行完以后，这个环境就不在了。

```r
local2 <- function(expr) {
  env <- env(caller_env()) # 新环境以调用环境作为父环境，就可以获取调用环境的变量
  eval(enexpr(expr), env)
}
```

- `source()`。文本按行读入，将字符转换为表达式，然后在调用环境中执行每一个表达式即可，最后不可见的返回最后一个表达式的结果。

```r
source2 <- function(path, env = caller_env()) {
  file <- paste(readLines(path, warn = FALSE), collapse = "\n")
  exprs <- parse_exprs(file)

  res <- NULL
  for (i in seq_along(exprs)) {
    res <- eval(exprs[[i]], env)
  }

  invisible(res)
}
```

如果这里使用`parse`函数，会返回表达式向量，`eval`会按顺序执行其中的每一个表达式，而不用使用循环，使得代码更加紧凑。

- Gotcha。 当你在使用`eval`和`expr`定义函数时，它的打印结果可能会让你意外。实际上这是由于函数的*srcref*属性，函数会打印出它的源码。

```r
r$> x <- 10

r$> y <- 20

r$> f <- eval(expr(function(x, y) !!x + !!y))

r$> f
function(x, y) !!x + !!y

r$> f()
[1] 30

r$> attributes(f) <- NULL

r$> f
function (x, y)
10 + 20
```

#### Quosures

quosure, 将表达式与它的环境结合在一起形成的数据结构，该名称取自quote以及closure。

- creating. `enquo`, `enquos`, `quo`, `quos`, `new_quosure`。
  
- evaluating.

```r
q1 <- new_quosure(expr(x + y), env(x = 1, y = 10))
eval_tidy(q1)
#> [1] 11
```

- under the hood

quosure实际上继承自`formula`类的。如下：

```r
r$> form <- y ~ x + 1

r$> str(form)
Class 'formula'  language y ~ x + 1
  ..- attr(*, ".Environment")=<environment: R_GlobalEnv>

r$> a <- new_quosure(expr(x + 1))

r$> str(a)
 language ~x + 1
 - attr(*, ".Environment")=<environment: R_GlobalEnv>

r$> class(a)
[1] "quosure" "formula"
```

`~`就是r中用于构建formula类的符号，可以捕获代码以及它所在的环境。

- nested quosures

正如之前提到的，quosure表达式与普通的表达式没有本质的区别，同样可以在返回表达式的函数中支持插入语法`!!`。而`eval_tidy`的设计可以正确识别返回的表达式中，每个变量的环境。

```r
q2 <- new_quosure(expr(x), env(x = 1))
q3 <- new_quosure(expr(x), env(x = 10))

x <- expr(!!q2 + !!q3)
```

如果你将它打印出来，你可以看到其以符号`~`开始，代表了一个公式（quosure继承自formula类）。或者你可以使用函数`expr_print`打印出来，这里以符号`^`开始，代表了一个表达式。

```r
x
#> (~x) + ~x

expr_print(x)
#> (^x) + (^x)
```

#### data mask

*data mask*的含义是在数据框的环境中执行表达式，但是，在数据框和环境中如果同时含有某个变量，这种执行表达式的方式会引起歧义，为了解决这个问题，我们可以用前置代词`.env`，`.data`显式的指定该变量来自哪里。`eval_tidy`的设计支持其执行的表达式中使用代词。

```r
with2 <- function(data, expr) {
  expr <- enquo(expr)
  eval_tidy(expr, data)
}

x <- 1
df <- data.frame(x = 2)

with2(df, .data$x)
#> [1] 2
with2(df, .env$x)
#> [1] 1
```

case-`subset`:

```r
subset2 <- function(data, rows) {
  rows <- enquo(rows)
  rows_val <- eval_tidy(rows, data) # 执行表达式，返回逻辑值
  stopifnot(is.logical(rows_val))

  data[rows_val, , drop = FALSE]
}

subset2(sample_df, b == c)
#>   a b c
#> 1 1 5 5
#> 5 5 1 1
```

case-`transform`

```r
transform2 <- function(.data, ...) {
  dots <- enquos(...)

  for (i in seq_along(dots)) {
    name <- names(dots)[[i]] # 参数名作为变量名，其值为表达式执行的结果
    dot <- dots[[i]]

    .data[[name]] <- eval_tidy(dot, .data)
  }

  .data
}

transform2(df, x2 = x * 2, y = -y)
#>   x       y x2
#> 1 2 -0.0808  4
#> 2 3 -0.8343  6
#> 3 1 -0.6008  2
```

case-`select`

实际上，表达式还可以在列表环境中执行。

```r
select2 <- function(data, ...) {
  dots <- enquos(...)

  vars <- as.list(set_names(seq_along(data), names(data)))
  cols <- unlist(map(dots, eval_tidy, vars))

  data[, cols, drop = FALSE] # 数据框列名作为列表元素名，每个元素分别赋值为1, 2, ..., 执行表达式返回选取列的位置1, 3, ...
}
select2(df, b:d)
#>   b c d
#> 1 2 3 4
```

#### using tidy evaluation

如果你想要封装一个使用tidy-evauation的函数，你需要其与普通的参数值传递的差别。下面的例子可以说明，在传递参数值时普通参数和被“引用”的参数的区别。

```r
r$> f2 <- function(x)  x

r$> f1 <- function(x) f2(x)

r$> f1(expr(x + y))
x + y

r$> f4 <- function(x) x

r$> f4 <- function(x) enquo(x)

r$> f3 <- function(x) f4(x)

r$> f3(expr(x + y))
<quosure>
expr: ^x
env:  0x0000016b180bdb98
```

可以看到，对于引用的参数而言，从外部函数传递进去的值，并没有被其接受，为了接受外部函数的参数，有下面两种方法。

```r
r$> f3 <- function(x) {arg <- enquo(x); f4(!!arg)}

r$> f3(expr(x + y))
<quosure>
expr: ^expr(x + y)
env:  global

r$> f3 <- function(x) f4({{x}})

r$> f3(expr(x + y))
<quosure>
expr: ^expr(x + y)
env:  global
```

另外，在使用`data mask`时，对于传递给`eval_tidy`的表达式，我们应该使用代词`.data`以及`.env`指明变量来源。需要记住的是，一般来说，当你使用`.env`代词时，其始终可以被符号`!!`代替，两者区别在于执行该变量的时间不同，前者在`eval_tidy`中执行，后者在表达式中立即执行。

#### base evaluation

主要涉及两个函数`substitute`以及`match.call`。

如果你想要对base R的NSE函数进行封装，有三个步骤需要考虑:

- You capture the unevaluated arguments using enexpr(), and capture the caller environment using caller_env().

- You generate a new expression using expr() and unquoting.

- You evaluate that expression in the caller environment. You have to accept that the function will not work correctly if the arguments are not defined in the caller environment. Providing the env argument at least provides a hook that experts can use if the default environment isn’t correct.

case:

```r
resample_lm2 <- function(formula, data, env = caller_env()) {
  formula <- enexpr(formula)
  resample_data <- resample(data, n = nrow(data))

  lm_env <- env(env, resample_data = resample_data)
  lm_call <- expr(lm(!!formula, data = resample_data))
  expr_print(lm_call)
  eval(lm_call, lm_env)
}
resample_lm2(y ~ x, data = df)
#> lm(y ~ x, data = resample_data)
#> 
#> Call:
#> lm(formula = y ~ x, data = resample_data)
#> 
#> Coefficients:
#> (Intercept)            x  
#>        4.42         3.11
```

总结：整个章节涉及两个方面的内容，一个是如何创建对参数进行引用的函数(NSE函数），另一个问题是如何对NSE函数进行封装。第一个问题：为了实现用户提供的代码（参数值）与开发者在函数内部提供的代码进行组合，对于返回表达式的函数，设计引进了插入符号`!!`用于实现代码的组合。进一步地，考虑到执行表达式时，表达式与环境的密切关系，引入了`quosure`数据结构即所谓的quosure表达式，以及其配对的`eval_tidy`函数。为了解决在使用*data mask*时歧义的问题，对于`eval_tidy`函数又引入了对表达式前缀的识别的语法。第二个问题：对于tidy-evaluation函数的封装有多种形式，一般情况下使用简写`{{}}`符号就可以。对于*Base R*的*NSE*函数则需要捕获整个表达式以及调用环境，然后执行。
