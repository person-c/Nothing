---
title: advanced r - foundation
date: 2022-06-22
---


## Names and values

Name 指向 value;  
保留字的问题，可以用反引号实现非合法的命名。  

**Copy-on-modify**:

- 函数调用，形参(name)指向了值(value)，对象（object).
- List（data.frame）的存储形式，每一个元素指向对应的object.
- Character vectors -> global string pools.
- 1:10 -> alternative presentation.
  
**Modify-in-place**：

- Object with a single binding
- Environments(a special data structure)

**Garbage collector(gc)**： 自动内存管理，没必要了解太多。

总结：了解向量name, value之间的关系。实际上在R中想要避免修改对象时复制基本不太可能，除了环境这种特殊的数据结构具有reference semantics, 其它的R对象想要避免复制，只能通过对象仅有一个name(performance optimization)实现, 但是函数调用（除了primitive functions -- c functions)总会给R对象引入一个新的name，而且R对于R对象name的计数只用0，1，more，三种，也就是说一旦R对象有了2个name，对R来说该对象就有more个name,即使这时候R对象去掉一个name，对R来说 more -1 = more, 该对象仍有多个name,在修改对象时还是会对其进行复制。

## Vectors

这里提到的向量是一类数据结构，是广义的向量，包括原子型向量(atomic vector)以及列表(lists)。  
原子型向量和列表有什么区别呢？没有区别，除了原子型向量的每个元素必须相同，所以它们都是向量(Vector)。实际上列表的每个元素也是相同的，因为列表的每个元素都是指向其对象的的reference，只不过列表的每个元素存储的是指向不同对象的箭头。Null和向量的关系？Null代表了空的向量，或者缺失的向量，用于删除向量元素，或者作为函数的默认参数。

属性（attributes)，是向量的额外数据(metadata)，为name-value的结构(list)，通过R对象的箭头指向我们就可以找到它的额外数据。属性一般都是暂时的，除了name(name也是属性，想不到吧）和维度。如果想要永久的保留属性，我们需要通过class属性创建自己的S3 object。

Dimension attributes power atomic vector to matrix and array; list to list-matrices and list-arrays. Class attributes power atomic vector to factors, date, date-times, difftime vectors; list to date.frame and tibble.

#### Atomic

**Atomic vector**

- Scalars(decimal, scientific, hexadecimal, `inf`, `-inf`, `Nan`).
- Making longer vectors with `c()`.
- Missing values(NA, not applicable). missing values tend to be infections except that some identity holds for all possible inputs.

   ```
   x <- c(NA, 5, NA, 10)
   x == NA
   ```

  NA has four types: `NA_integer_`, `NA_real_(double)`, `NA_character`, `NA(logical`).
- Testing and coercion: avoid `is.vector`, `is.atomic`, `is.numeric`; character - double - integer - logical.

**Atomic vector S3 object**  

- Factor(including ordered factor):  
Factors are useful when you know the set of possible values but they’re not all present in a given dataset;
Built on top of integers. So be careful when treating them like strings; For this reason, it’s usually best to explicitly convert factors to character vectors if you need string-like behavior.  

- Dates, date-times, and durations:  
Built on top of double; The value of the double (which can be seen by stripping the class) represents the number of days since 1970-01-01.

#### List

**List S3 object**  
Data.frame and tibble:

- Creating: `stringsAsFactors = FALSE`; `check.names = FALSE`; recycling; reference to column.
- Subset: `$` partial matching; `df[, vars, drop = FALSE]`.
- Rownames
- Print
- List-column; matrix, data.frame column.

#### Null

NULL is special because it has a unique type, is always length zero, and can’t have any attributes. It has two usages:

- To represent an empty vector (a vector of length zero) of arbitrary type.  
- To represent an absent vector is used as the default vector when the argument is optional but the default value requires some computation. Contrast this with NA which is used to indicate that an element of a vector is absent.

## Subset

**Six ways**

- Positive integers(duplicated acquire);
- Characters(names);
- Logical vectors(logical expression);
- Negative integers;
- Nothing(to maintain structure);
- Zero(length zero vector);
  
**Subset operators**:  
`[`, `[[`, `$`.
`@` and `slot()`  for S4 object.

NB: Factors are not treated specially when subsetting. This means that subsetting will use the underlying integer vector, not the character levels. This is typically unexpected, so you should avoid subsetting with factors:

```
x <- c(2.1, 4.2, 3.3, 5.4)
(y <- setNames(x, letters[1:4]))
y[factor("b")]
#>   a 
#> 2.1
```

Factor subsetting has a drop argument. It controls whether or not levels (rather than dimensions) are preserved, and it defaults to FALSE. If you find you’re using drop = TRUE a lot it’s often a sign that you should be using a character vector instead of a factor.

**Some wired**:  
 If you use a vector with `[[`, it will subset recursively, i.e. `x[[c(1, 2)]]`is equivalent to `x[[1]][[2]]`.

总结：  
subset的关键在于6种方式与3种（不考虑仅用于S4的操作符）操作符的组合。`[` 用于获取向量（广义）的一个或多个元素（保持其结构不变），但是如果对于data frame仅获取了一个元素，那么其结构drop为原子型向量。`[[`,`$`用于仅获取列表的一个元素（结构改变），但如果该列表为data frame，`$`会进行部分匹配，如果列表具有嵌套结构可以考虑使用函数`purrr:pluck`或者`purrr:chuck`。6种匹配方式，其中正整数与字符使用可以说是完全相等，逻辑值与正整数也可以进行替换。subset的应用的主要应用方式为键值匹配以及排序。

- 考虑一个键值匹配的表（lookup table），当我们获得一个键表（一般为正整数，字符一种），我们就可以在该表中获得我们想要的数据（键值是可以重复的）

```
x <- c("m", "f", "u", "f", "f", "m", "m")
lookup <- c(m = "Male", f = "Female", u = NA)
lookup[x]
#>        m        f        u        f        f        m        m 
#>   "Male" "Female"       NA "Female" "Female"   "Male"   "Male"
```

- 考虑一个向量，通过其索引（正整数），或者元素名称，通过对这两者的重排序就可以实现向量元素的重排序。

```
x <- c("b", "c", "a")
order(x)
#> [1] 3 1 2
x[order(x)]
#> [1] "a" "b" "c"
```

逻辑值与正整数`(which(TRUE)`一般可以替换，它们的两个区别在于：

- When the logical vector contains NA, logical subsetting replaces these values with NA while which() simply drops these values. It’s not uncommon to use which() for this side-effect, but I don’t recommend it: nothing about the name “which” implies the removal of missing values.
- `x[-which(y)]` is not equivalent to `x[!y]`: if y is all FALSE, `which(y)` will be integer(0) and -integer(0) is still integer(0), so you’ll get no values, instead of all values.

另外还需要提到的就data frame以及tibble虽然在本质上与矩阵数组完全不同，不过它们在结构上有一致性，所以都可以通过1维，2维，3维进行提取。

## Control flow

Choice: `if`; `switch`; vectorized if(`ifelse`, `case_when`).  
Loop: `for`(loop in vector); `while`(condition loop); `repeat`(loop forever).

`if`:

- When you use the single argument form without an else statement, `if` invisibly returns NULL.
- `Sys.setenv("_R_CHECK_LENGTH_1_CONDITION_" = "true")`

`for`:

- `for` assigns the item to the current environment, overwriting any existing variable with the same name.
- Preallocate output container `vector("list", length(x))`.
- Instead of `1:length(x)`, use `1:seq_along(x)`; because `:`works with both increasing and decreasing sequences.
- Loops typically strip S3 vector attributes; use `[[`` to avoid.
  
```
for (i in seq_along(xs)) {
  print(xs[[i]])
}
```

**Stop loop**

- next: exits the current iteration.
- break: exits the entire for a loop.

## Functions

> Everything that exists is an object.  
> Everything that happens is a function call.  
> — John Chambers

#### Function fundamentals

> Functions can be broken down into three components: arguments, body, and environment.There are exceptions to every rule, and in this case, there is a small selection of “primitive” base functions that are implemented purely in C.
> Functions are objects, just as vectors are objects.  

**Function components**

- `formals()`  
  The list of arguments that control how you call the function.
- `body()`
  The code inside the function.
- `environment()`
  The data structure that determines how the function finds the values associated with the names,  based on where you defined the function.

Like all objects in R, functions can also possess any number of additional `attributes()`. One attribute used by base R is `srcref`, short for source reference.  

R functions are objects in their own right, a language property often called **“first-class functions”**. Thus, we can put functions in a list or create **anonymous function**.

**Invoke function**

```
args <- list(1:10, na.rm = TRUE)
do.call(mean, args)
```

**Function composition**

- Nest
- Intermediate variables
- Binary operator `%>%`

**Function forms**

- Prefix  
  The function name comes before its arguments, like `foofy(a, b, c)`. These constitute the majority of function calls in R.

> By position, like `help(mean)`.
> Using partial matching, like `help(top = mean)`, `options  (warnPartialMatchArgs = TRUE)`.
> By name, like `help(topic = mean)`.  

- Infix  
 The function name comes in between its arguments, like `x + y`. Infix forms are used for many mathematical operators, and for user-defined functions that begin and end with `%`.

- Replacement  
  Functions that replace values by assignment, like `names(df) <- c("a", "b", "c")`. They actually look like prefix functions.

```
`modify<-` <- function(x, position, value) {
  x[position] <- value
  x
}
modify(x, 1) <- 10
x
#>  [1] 10  5  3  4  5  6  7  8  9 10
```

- Special  
  Functions like `[[`, `if`, and `for`. While they don’t have a consistent structure, they play important roles in R’s syntax.

Any call can be written in prefix form.

```
x + y
`+`(x, y)

names(df) <- c("x", "y", "z")
`names<-`(df, c("x", "y", "z"))

for(i in 1:10) print(i)
`for`(i, 1:10, print(i))
```

#### 函数执行机制

**Lexical scoping**  
R uses lexical scoping: it looks up the values of names based on how a function is defined, not how it is called. “Lexical” here is not the English adjective that means relating to words or a vocabulary. It’s a technical CS term that tells us that the scoping rules use a parse-time, rather than a run-time structure.

- Name masking  
  Names defined inside a function mask names defined outside a function.
- Function versus variables
- Fresh start
- Dynamic lookup  
  R looks for values when the function is run, not when the function is created.

**Lazy evaluation**  
In R, function arguments are lazily evaluated: they’re only evaluated if accessed.

- Promise  
  A data structure including expression, environment, and value.
- Default argument  
  Default arguments are evaluated inside the function, but user-supplied arguments are evaluated in the called environment.
- Missing arguments  
  `missing()`

**...(dot-dot-dot)**  
`...` (pronounced dot-dot-dot). With it, a function can take any number of additional arguments. It can use with `list`(...)` or `rlang::list2()` to support splicing.

**Exiting a function**

- Implicit versus explicit returns(`return()`)
- Invisible values(`invisible()`, `print()`, `(`, `withVisible()`)
- Errors(`stop()`)
- Exit handlers(`on.exit`)

总结：函数由3个部分组成，包括参数，函数体以及环境。函数的环境一般为定义函数时的环境，该环境也是Lexical scope的环境。函数的形式有四种，并且所有形式都可以写为prefix form, 将其它形式写为prefix form的重点是了解该函数的名称。函数的执行包括两个方面，一个是如何获取name对应的值，函数通过lexical scope在定义函数的环境中一层层向上查找name对应的value；另一个问题是如何获取参数值，R函数通过lazy evaluation获取参数值，即只有在需要获取参数值时才从对应的数据结构（promise)中评估该参数值，并且获取以后将其保存在promise中（value)。需要注意的是当评估参数值时，用户提供的参数是在调用环境中进行评估，而函数的默认参数则是函数内部进行评估。关于函数退出时执行代码，更多可以参考[这里](https://coolbutuseless.github.io/2021/03/12/on-on.exit/)。关于表达式和环境的关系是一个很重要的概念，以后还会提到，基于这两者才可以实现参数的lazy evaluation以及元编程。

## Environment

Generally, an environment is similar to a named list, with four important exceptions:

- Every name must be unique.
- The names in an environment are not ordered.
- An environment has a parent.
- Environments are not copied when modified.

#### Environment basics

- Basics  
  `env()`, `new.env()`,`env_print()`, `env_names`.

  Important environments(`identical(global_env(), current_env())`); The global environment is sometimes called your “workspace”, as it’s where all interactive.

  If you don’t supply parent environment, it defaults to the current environment.

  ```
  e2a <- env(d = 4, e = 5)
  e2b <- env(e2a, a = 1, b = 2, c = 3)
  ```

  ```
  env_parents(e2b, last = empty_env())
  #>  [[1]]   <env: 0x7fe6c7399f58>
  #>  [[2]] $ <env: global>
  #>  [[3]] $ <env: package:rlang>
  #>  [[4]] $ <env: package:stats>
  #>  [[5]] $ <env: package:graphics>
  #>  [[6]] $ <env: package:grDevices>
  #>  [[7]] $ <env: package:utils>
  #>  [[8]] $ <env: package:datasets>
  #>  [[9]] $ <env: package:methods>
  #> [[10]] $ <env: Autoloads>
  #> [[11]] $ <env: package:base>
  #> [[12]] $ <env: empty>
  ```

- Getting and setting  
  `$`, `[[`,`env_get()`,`env_poke`,`env_bind`,`env_has`,`env_unbind()`,`get`,`assign()`,`exists()`, `rm()`.

  Super assignment, `<<-`, never creates a variable in the current environment, but instead modifies an existing variable found in a parent environment.

  ```
  x <- 0
  f <- function() {
     x <<- 1
   }
  f()
  x
  #> [1] 1
  ```

  `env_bind_lazy()` creates delayed bindings, which are evaluated the first time they are accessed. Behind the scenes, delayed bindings create promises, so behave in the same way as function arguments.

  ```
  env_bind_lazy(current_env(), b = {Sys.sleep(1); 1})

  system.time(print(b))
  #> [1] 1
  #>    user  system elapsed  
  #>    0.00    0.00    1.09
  system.time(print(b))
  #> [1] 1
  #>    user  system elapsed 
  #>       0       0       0
  ```

  The primary use of delayed bindings is in `autoload()`, which allows R packages to provide datasets that behave like they are loaded in memory, even though they’re only loaded from disk when needed.

  `env_bind_active()` creates active bindings which are re-computed every time they’re accessed:

  ```
  env_bind_active(current_env(), z1 = function(val) runif(1))

  z1
  #> [1] 0.0808
  z1
  #> [1] 0.834
  ```

  See `?delayedAssign()` and `?makeActiveBinding()`.

- Recursing over environments

  ```
  where <- function(name, env = caller_env()) {
  if (identical(env, empty_env())) {
    # Base case
    stop("Can't find ", name, call. = FALSE)
  } else if (env_has(env, name)) {
    # Success case
    env
  } else {
    # Recursive case
    where(name, env_parent(env))
  }
  }
  ```

#### Special environments

所谓的环境不过是已知一个名如何寻找其值的问题。关于各种环境，借助于`rlang`包一看便知。

- Packages environment  
  The `Autoloads` environment uses delayed bindings to save memory by only loading package objects (like big datasets) when needed.  

  The base environment, `package:base` or sometimes just `base`, is the environment of the base package. It is special because it has to be able to bootstrap the loading of all other packages. You can access it directly with `base_env()`.

  ```
  > rlang::search_envs()
   [[1]] $ <env: global>
   [[2]] $ <env: package:rlang>
   [[3]] $ <env: package:stats>
   [[4]] $ <env: package:graphics>
   [[5]] $ <env: package:grDevices>
   [[6]] $ <env: package:utils>
   [[7]] $ <env: package:datasets>
   [[8]] $ <env: package:languageserver>
   [[9]] $ <env: package:methods>
  [[10]] $ <env: Autoloads>
  [[11]] $ <env: org:r-lib>
  [[12]] $ <env: package:base>
  ```

- Function environment
  Function environment is the function's package's namespace which defines the functions.

  Every namespace environment has the same set of ancestors:

  **Imports environments**: each namespace has an import environment that contains bindings to all the functions used by the package. The import environment is controlled by the package developer with the `NAMESPACE` file.  

  **Base namespace**: explicitly importing every base function would be tiresome, so the parent of the import environment is the base namespace. The base namespace contains the same bindings as the base environment, but it has a different parent.

  **Global environment**: The parent of the base namespace is the global environment.

  ```
  > fn_env(sd)
  <environment: namespace:stats>
  ```

  Function environment's parent environment.

  ```
  > env_parents(fn_env(sd), last = empty_env())
  [[1]] $ <env: imports:stats>
  [[2]] $ <env: namespace:base>
  [[3]] $ <env: global>
  [[4]] $ <env: package:rlang>
  [[5]] $ <env: package:stats>
  [[6]] $ <env: package:graphics>
  [[7]] $ <env: package:grDevices>
  [[8]] $ <env: package:utils>
  [[9]] $ <env: package:datasets>
  [[10]] $ <env: package:languageserver>
  [[11]] $ <env: package:methods>
  [[12]] $ <env: Autoloads>
  [[13]] $ <env: org:r-lib>
  [[14]] $ <env: package:base>
  [[15]] $ <env: empty>
  ```

- Execution environments and call stack  
  Executing a function creates two types of context. The execution environment is a child of the function environment, which is determined by where the function was created. There’s another type of context created by when the function was called: this is called the call stack.

  1. Execution environments

  ```
  > printEnv <- function(){
  +   currentEnv <- current_env()
  +   parentsEnv <- env_parents(current_env(), last = empty_env())
  +   list(currentEnv, parentsEnv)
  + }
  > printEnv()
  [[1]]
  <environment: 0x4ca5cd8>

  [[2]]
   [[1]] $ <env: global>
   [[2]] $ <env: package:rlang>
   [[3]] $ <env: package:stats>
   [[4]] $ <env: package:graphics>
   [[5]] $ <env: package:grDevices>
   [[6]] $ <env: package:utils>
   [[7]] $ <env: package:datasets>
   [[8]] $ <env: package:languageserver>
   [[9]] $ <env: package:methods>
  [[10]] $ <env: Autoloads>
  [[11]] $ <env: org:r-lib>
  [[12]] $ <env: package:base>
  [[13]] $ <env: empty>
  ```

  2. Call stack

   The **caller** environment, is accessed with `rlang::caller_env`()`.
   Each element of the call stack is a **frame**, also known as an evaluation context.

   An expression (labeled with `expr``) giving the function call. This is what`traceback()` prints out.

   An environment (labeled with env), is typically the execution environment of a function. There are two main exceptions: the environment of the global frame is the global environment, and calling eval() also generates frames, where the environment can be anything.

  A parent, the previous call in the call stack.

  Looking up variables in the calling stack rather than in the enclosing environment is called **dynamic scoping**.

  ```
  > f <- function(x) {
  +   g(x = 2)
  + }
  > g <- function(x) {
  +   h(x = 3)
  + }
  > h <- function(x) {
  +   stop()
  + }
  > f(x=1)
  Error in h(x = 3) : 
  > traceback()
  4: stop() at #2
  3: h(x = 3) at #2
  2: g(x = 2) at #2
  1: f(x = 1)
  > h <- function(x) {
  +   lobstr::cst()
  + }
  > f(x=1)
    ▆
   1. └─global f(x = 1)
   2.   └─global g(x = 2)
   3.     └─global h(x = 3)
   4.       └─lobstr::cst()
  # Lazy valuation, the user-supplied arguments evaluated in global environment.
  > a <- function(x) b(x)
  > b <- function(x) c(x)
  > c <- function(x) x
  > 
  > a(f())
    ▆
   1. ├─global a(f())
   2. │ └─global b(x)
   3. │   └─global c(x)
   4. └─global f()
   5.   └─global g(x = 2)
   6.     └─global h(x = 3)
   7.       └─lobstr::cst()
  ```

#### Environment as a data structure

- Avoiding copies of large data(R6 objects).
- Managing state within a package.

```
my_env <- new.env(parent = emptyenv())
my_env$a <- 1

get_a <- function() {
  my_env$a
}
set_a <- function(value) {
  old <- my_env$a
  my_env$a <- value
  invisible(old)
}
```

- As a hashmap
  As hashmap is a data structure that takes constant, O(1), time to find an object based on its name. Environments provide this behavior by default, so can be used to simulate a hashmap.

#### Condition system

###### Signalling conditions

- Error  
`stop( ,call. = FALSE)`,`abort`.

- Warnings  
  By default, warnings are cached and printed only when control returns to the top level.

  To make warnings appear immediately, set `options(warn = 1)`.  
  To turn warnings into errors, set `options(warn = 2)`.  
  Restore the default behavior with `options(warn = 0)`.  

- Messages(`message`)
- Interrupt
  Interrupt indicates that the user has interrupted execution by pressing Escape, Ctrl + Break, or Ctrl + C (depending on the platform).

##### Ignoring conditions

```
# the error message will be displayed but execution will continue
f <- function(x) {
  try(log(x))
  10
}
f("a")
#> Error in log(x) : non-numeric argument to mathematical function
#> [1] 10

suppressWarnings({
  warning("Uhoh!")
  warning("Another warning")
  1
})
#> [1] 1

suppressMessages({
  message("Hello there")
  2
})
#> [1] 2
```

##### Handling conditions

- Condition object

```
cnd <- catch_cnd(stop("An error"))
str(cnd)
#> List of 2
#>  $ message: chr "An error"
#>  $ call   : language force(expr)
#>  - attr(*, "class")= chr [1:3] "simpleError" "error" "condition"

conditionMessage(cnd)
conditionCall(cnd)
 ```

 ```
 tryCatch(
  error = function(cnd) {
    # code to run when error is thrown
  },
  code_to_run_while_handlers_are_active
  finally = {
    code_to_run_regardless_of_whether_the_initial_expression_succeeds_or_fails
  }
)

withCallingHandlers(
  warning = function(cnd) {
    # code to run when warning is signalled
  },
  message = function(cnd) {
    # code to run when message is signalled
  },
  code_to_run_while_handlers_are_active
)
```

```
tryCatch(
  message = function(cnd) cat("Caught a message!\n"), 
  {
    message("Someone there?")
    message("Why, yes!")
  }
)
#> Caught a message!

withCallingHandlers(
  message = function(cnd) cat("Caught a message!\n"), 
  {
    message("Someone there?")
    message("Why, yes!")
  }
)
#> Caught a message!
#> Someone there?
#> Caught a message!
#> Why, yes!
```

```
# Bubbles all the way up to default handler which generates the message
withCallingHandlers(
  message = function(cnd) cat("Level 2\n"),
  withCallingHandlers(
    message = function(cnd) cat("Level 1\n"),
    message("Hello")
  )
)
#> Level 1
#> Level 2
#> Hello

# Bubbles up to tryCatch
tryCatch(
  message = function(cnd) cat("Level 2\n"),
  withCallingHandlers(
    message = function(cnd) cat("Level 1\n"),
    message("Hello")
  )
)
#> Level 1
#> Level 2
```

```
# Muffles the default handler which prints the messages
withCallingHandlers(
  message = function(cnd) {
    cat("Level 2\n")
    cnd_muffle(cnd)
  },
  withCallingHandlers(
    message = function(cnd) cat("Level 1\n"),
    message("Hello")
  )
)
#> Level 1
#> Level 2

# Muffles level 2 handler and the default handler
withCallingHandlers(
  message = function(cnd) cat("Level 2\n"),
  withCallingHandlers(
    message = function(cnd) {
      cat("Level 1\n")
      cnd_muffle(cnd)
    },
    message("Hello")
  )
)
#> Level 1
```

- call stack

##### Custom condition object
