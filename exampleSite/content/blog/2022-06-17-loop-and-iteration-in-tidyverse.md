---
title: tidyverse - loop and iteration
date: 2022-06-17
---


R中的map函数家族以及across函数都可以进行迭代操作。map函数适用于向量，列表，数据框（数据框是列表的特殊形式)多种数据结构，而across函数仅适用于对数据框进行修改操作。考虑map函数以及across函数对数据框的修改作用上来说，map函数适用于当数据框所有列都要同一函数修改的情况，而across函数当与mutate函数连用时适用于对数据框部分列进行同一函数修改，当与summarize函数连用时，适用于对数据框所有列进行修改或者选取指定列进行统计建模。虽然map函数家族也提供了modify_if函数，但是它的选择器写起来复杂，不如across函数的选择简单强大。

mutate函数返回数据框并于原数据框进行并入处理，而summarize函数则是返回生成的新数据框。

## 函数式编程 -  map函数家族

许多函数需要用函数作为参数，称这样的函数为泛函(functionals)。 典型的泛函是`lapply`类函数。 这样的函数具有很好的通用性， 因为需要进行的操作可以输入一个函数来规定， 用输入的函数规定要进行什么样的操作。

1. `...` 形参
在R函数的形参中， 允许有一个特殊的`...`形参（三个小数点）， 这在调用泛函类型的函数时起到重要作用。 在调用泛函时， 所有没有形参与之匹配的实参， 不论是带有名字还是不带有名字的， 都自动归入这个参数， 将会由泛函传递给作为其自变量的函数。 `...`参数的类型相当于一个列表， 列表元素可以部分有名部分无名， 用`list(...)`可以将其转换成列表再访问。

2. 匿名函数
 `purrr`包为在`map()`等泛函中使用无名函数提供了简化的写法， 将无名函数写成“`~ 表达式`”格式， 表达式就是无名函数定义， 用`.`表示只有一个自变量时的自变量名， 用`.x`和`.y`表示只有两个自变量时的自变量名， 用`..1`、`..2`、`..3`这样的名字表示有多个自变量时的自变量名。

3. `map`函数分类

- 变量个数 `map_*` `map2_*`,`imap`, `pmap_*`(parallel map)。
- 返回类型 `*_int`, `*_dbl`, `*_chr`, `*_lgl`, `*_dfc`, `*dfr`, `modify`, `*walk*`。
- 判断筛选 `*_if`, `keep`。
- 多元运算 `reduce`。

4. 示性函数

- `some(.x, .p)`，对数据列表或向量`.x`的每一个元素用`.p`判断， 只要至少有一个为真，结果就为真； `every(.x, .p)`与`some`类似，但需要所有元素的结果都为真结果才为真。 这些函数与`any(map_lgl(.x, .p))`和`all(map_lgl(.x, .p))`类似， 但是只要在遍历过程中能提前确定返回值就提前结束计算， 比如`some`只要遇到一个真值就不再继续判断， `every`只要遇到一个假值就不再继续判断。
- `detect(.x, .p)`返回数据`.x`的元素中第一个用`.p`判断为真的元素值， 而detect_index`(.x, .p)`返回第一个为真的下标值。
- `keep(.x, .p)`选取数据`.x`的元素中用`.p`判断为真的元素的子集； `discard(.x, .p)`返回不满足条件的元素子集。

5. 在 `map` 中提取列表元素成员的简写

 在map中提取列表元素成员的简写

```r
od <- list(
  list(
    101, name="李明", age=15, 
    hobbies=c("绘画", "音乐")),
  list(
    102, name="张聪", age=17,
    hobbies=c("足球"),
    birth="2002-10-01")
)

map_chr(od, list("hobbies", 1), .default = NA)
```

#### 第一节  单变量map函数

`map` 函数用于向量元素，给函数设置不同的参数

```r
tibble(
  x = c(3, 5, 6)
) %>% 
 mutate(r = purrr::map(x, ~rnorm(.x, mean = 0, sd = 1)))
 ```

 `map` 函数用于列表元素

 ```r
 mtcars %>%
  group_by(cyl) %>%
  nest() %>%
  mutate(model = purrr::map(data, ~ lm(mpg ~ wt, data = .))) %>%
  mutate(result = purrr::map(model, ~ broom::tidy(.))) %>%
  unnest(result)
 ```

`map` 函数用于数据框元素

```r
 palmerpenguins::penguins %>% 
  map_int(~ sum(is.na(.)))
```

#### 第二节  双变量map函数

`map2`用于2个向量元素

```
df <-
  tibble(
    a = c(1, 2, 3),
    b = c(4, 5, 6)
  )
df %>% 
  mutate(min = map2_dbl(a, b, ~min(.x, .y)))
```

`map2`用于2个数据框元素

```
d1 <- tibble(
  x1 = c(106, 108, 103, 110),
  x2 = c(101, 112, 107, 105) )
d2 <- tibble(
  x1 = c(104, 111, 112, 109),
  x2 = c(102, 114, 105, 107) )
map2_dbl(d1, d2, ~ (sum(.y) - sum(.x)) / sum(.x))
```

 如果`x`有元素名， `imap(x, f)`相当于`imap2(x, names(x), f)`； 如果`x`没有元素名， `imap(x, f)`相当于`map2(x, seq_along(x), f)`。 `iwalk()`与`imap()`类似但不返回信息。 `f`是对数据每一项要调用的函数， 输入的函数的第二个自变量或者无名函数的`.y`自变量会获得输入数据的元素名或者元素下标。

`imap` 访问元素，以及元素名。

```r
iwalk(d.class, ~ cat(.y, ": ", typeof(.x), "\n"))
```

`imap` 访问元素，以及元素下标。

```
dl <- list(1:5, 101:103)
iwalk(dl, ~ cat("NO. ", .y, ": ", .x[[1]], "\n"))
```

#### 第三节 pmap函数

 `pmap`不是将多个列表等作为多个自变量， 而是将它们打包为一个列表。 所以， `map2(x, y, f)`用`pmap()`表示为`pmap(list(x, y), f)`。  
 pmap()和其它的map()类函数有一个区别是， 因为将输入数据打包在一个列表中， 而列表元素是有变量名的， 这样就可以将列表变量名取为要调用的函数的自变量名， 使得对输入列表中各元素的每个成员调用函数时， 可以带有对应的形参名调用。

行方向的统计

```
d <- tibble::tibble(
  x = 101:103, 
  y=c("李明", "张聪", "王国"))
pmap_chr(d, function(...) paste(..., sep=":"))
```

自动匹配参数名

```
params <- tibble::tribble(
  ~ n, ~ min, ~ max,
   1L,     0,     1,
   2L,    10,   100,
   3L,   100,  1000
)
pmap(params, ~runif(n = ..1, min = ..2, max = ..3))
pmap(params, runif)
```

用于函数多个参数的结果。

```
set.seed(101)
x <- rcauchy(1000)
trims <- c(0.05, 0.1, 0.2, 0.3, 0.4)

pmap_dbl(list(trims = trims), mean, x=x)
```

`pmap()`的变种有`invoke_map(.f, .x, ...)`， 其中`.f`是一个元素为函数名的字符型向量， `.x`是列表， `.x`的每个元素是`.f`列表中对应的函数的参数。 如：

```
sim <- tribble(
  ~f,      ~params,
  "runif", list(min = -1, max = 1),
  "rnorm", list(sd = 5),
  "rpois", list(lambda = 10)
)
sim %>% 
  mutate(sim = invoke_map(f, params, n = 10))
```

#### 第四节 reduce以及accumulate函数

```
x <- list(
  c(2, 3, 1, 3, 1), 
  c(1, 5, 3, 3, 2),
  c(5, 4, 2, 5, 3),
  c(1, 4, 3, 2, 5))
intersect(intersect(intersect(x[[1]], x[[2]]), x[[3]]), x[[4]])
reduce(x, intersect)
```

```
accumulate(x, union)
```

#### 第五节 walk 函数

有时仅需要遍历一个数据结构调用函数进行一些显示、绘图， 这称为函数的副作用， 不需要返回结果。`purrr`的`walk`函数针对这种情形。
`walk`、`walk2`并不是没有输出， 它们返回不显示的第一个自变量， 所以也适合用在管道运算的中间使得管道不至于中断。

```r
d.class %>%
  split(d.class[["sex"]]) %>%
  walk2(paste0("class-", names(.), ".csv"), ~ write.csv(.x, file=.y))
```

```r
plot_rnorm <- function(sd) {
  tibble(x = rnorm(n = 5000, mean = 0, sd = sd)) %>% 
    ggplot(aes(x)) +
    geom_histogram(bins = 40) +
    geom_vline(xintercept = 0, color = "blue")
}

plots <-
  c(5, 1, 9) %>% 
  map(plot_rnorm)

plots %>% 
  walk(print)
```

## across() 函数

across()函数，它有三个主要的参数：

```
across(.cols = , .fns = , .names = )
```

- 第一个参数.cols = ，选取我们要需要的若干列，选取多列的语法与`select()`的语法一致，选择方法非常丰富和人性化

  - 基本语法
    - `:`，变量在位置上是连续的，可以使用类似 `1:3` 或者`species:island`
    - `!`，变量名前加!，意思是求这个变量的补集，等价于去掉这个变量，比如`!species`
    - `&` 与 `|`，两组变量集的交集和并集，比如 `is.numeric & !year`, 就是选取数值类型变量，但不包括`year`; 再比如 `is.numeric | is.factor`就是选取数值型变量和因子型变量
    - `c()`，选取变量的组合，比如`c(a, b, x)`

  - 通过人性化的语句
    - `everything()`: 选取所有的变量
    - `last_col()`: 选取最后一列，也就说倒数第一列，也可以`last_col(offset = 1L)` 就是倒数第二列

  - 通过变量名的特征
    - `starts_with()`: 指定一组变量名的前缀，也就把选取具有这一前缀的变量，`starts_with("bill_")`
    - `ends_with()`: 指定一组变量名的后缀，也就选取具有这一后缀的变量，`ends_with("_mm")`
    - `contains()`: 指定变量名含有特定的字符串，也就是选取含有指定字符串的变量，`ends_with("length")`
    - `matches()`: 同上，字符串可以是正则表达式

  - 通过字符串向量
    - `all_of()`: 选取字符串向量对应的变量名，比如`all_of(c("species", "sex",    "year"))`，当然前提是，数据框中要有这些变量，否则会报错。
    - `any_of()`: 同`all_of()`，只不过数据框中没有字符串向量对应的变量，也不会报错，比如数据框中没有people这一列，代码`any_of(c("species", "sex", "year", "people"))`也正常运行，挺人性化的

  - 通过函数
    - 常见的有数据类型函数 `where(is.numeric), where(is.factor), where(is.character), where(is.date)`

- 第二个参数`.fns =`，我们要执行的函数（或者多个函数），函数的语法有三种形式可选：
  - A function, e.g. `mean`.
  - A purrr-style lambda, e.g. `~ mean(.x, na.rm = TRUE)`
  - A list of functions/lambdas, e.g. `list(mean = mean, n_miss = ~ sum(is.na(.x))`
  
- 第三个参数`.names =`, 如果`.fns`是单个函数就默认保留原来数据列的名称，即`"{.col}"` ；如果`.fns`是多个函数，就在数据列的列名后面跟上函数名，比如`"{.col}_{.fn}"`；当然，我们也可以简单调整列名和函数之间的顺序或者增加一个标识的字符串，比如弄成`"{.fn}_{.col}"`，`"{.col}_{.fn}_aa"`

#### across函数与mutate, summarize连用

`across` 函数用于数据框元素 - 修改数据框

```r
penguins %>%
  drop_na() %>%
  mutate(
    across(where(is.numeric), .fns = list(log = log), .names = "{.fn}_{.col}"),
    across(where(is.character), as.factor)
  )
```

```r
df      <- tibble(x = 1:3, y = 3:5, z = 5:7)
weights <- list(x = 0.2, y = 0.3, z = 0.5)

df %>%
  mutate(
    across(all_of(names(weights)),
           list(wt = ~ .x * weights[[cur_column()]]),
          .names = "{col}.{fn}"
    )
  )
```

 across函数用于数据框元素 - 统计汇总

```r
penguins %>%
  group_by(species) %>%
  summarise(
    n = n(),
    across(starts_with("bill_"), mean, na.rm = TRUE),
    Area = mean(bill_length_mm * bill_depth_mm, na.rm = TRUE),
    across(ends_with("_g"), mean, na.rm = TRUE),
  )
```

```r
penguins %>%
  group_by(species) %>%
  summarise(
    broom::tidy(lm(bill_length_mm ~ ., data = across(is.numeric)))
  )
```

#### across函数与其它dplyr函数连用

`across`函数与其它`dplyr`函数连用作为`select`函数作用。

```
penguins %>% 
  arrange(across(ends_with("_mm")))


penguins %>% 
  count(
    across(where(is.factor))
  )
```

`filter` 函数有`across` 函数的专门替代函数 `if_any`, `if_all`。

```r
bigger_than_mean <- function(x) {
  x > mean(x, na.rm = TRUE)
}

penguins %>% 
  filter(if_all(contains("bill"), bigger_than_mean))

penguins %>% 
  filter(!is.na(bill_length_mm)) %>% 
  mutate(
    category = case_when(
      if_all(contains("bill"), bigger_than_mean) ~ "both big", 
      if_any(contains("bill"), bigger_than_mean) ~ "one big", 
      TRUE                          ~ "small"
    ))
```

## map函数与across函数的结合

- `rowwise()` 一行一行的处理
- `across()` 一列一列的处理
- `rowwise()` + `across()` 这种组合，双重迭代，(一行一行 + 一列一列)就变成了一个一个的处理
- `across()` + `purrr::map_dbl()`这种组合分两种情形：  
  - `purrr::map_dbl()` 作为`across( .fns = )` 中的函数，即`across(.cols = , .fns = map_dbl() )`。`across()`一列一列的迭代，每一列又传入`purrr::map_dbl()`再次迭代，因此这里是双重迭代
  - `across()`作为`purrr::map_df(.x = )`的数据，即`purrr::map_df(.x = across(), .f = )`。因为在`mutate()`中`across()`返回数据框，因此可以把`across()`整体视为数据框，然后这个数据框传入`purrr::map_df(.x = )`进行迭代，因此这种情形可以认为只有`purrr::map_*()`一次迭代。

行方向统计的实现

```
df <- tibble(
  a = letters[1:5],
  b = 1:5,
  c = 6:10,
  d = 11:15
)

df %>% 
  mutate(
    pmap_dfr(across(b:d), ~lst(min = min(c(...)), 
                               max = max(c(...)), 
                               ratio = min/max
                               )
    )
  )
```

参考：
[数据科学中的R语言](https://bookdown.org/wangminjie/R4DS/)
[R语言教程](https://www.math.pku.edu.cn/teachers/lidf/docs/Rbook/html/_Rbook/index.html)
