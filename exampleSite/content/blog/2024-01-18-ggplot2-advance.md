---
title: ggplot2 advance
date: 2024-02-04
---


## layers as object

对于ggplot2而言每一层的图形都是一个R对象， 这些对象通过函数`+`堆叠在一起形成最终的对象。既然每一层都是一个对象，常规的R的操作对于其应该也是起作用的。对于 `+`操作，最常见的就是累加的操作了，对于ggplot2的对象来说也是可以这么操作的。

考虑你使用`pROC::roc()`计算了n个变量的AUC表现，该函数返回一个长度为n的列表；每一个列表元素包含了对应变量的specificities 以及 sensitivities. 如果你想用ggplot在一幅图中画出每个变量的ROC曲线，一般的作法是把每个变量的specificities以及sensitivities的结果合并在同一个数据框，然后对每条曲线使用不同颜色映射以区分不同的变量。如果你不想整理数据，一种方法如下：对列表的每一个元素创建对应的ggplot2对象，然后将其累加起来，构建最终的对像。


```r
p <- Reduce(`+`, Map(function(.x, .color, .y, .name) {
  dt <- data.table(specificities = .x$specificities, sensitivities = .x$sensitivities)
  c(
    geom_path(
      data = dt, aes(x = 1 - specificities, y = sensitivities),
      color = .color, linewidth = .6
    ),
    annotate("text",
      x = .65, y = .y,
      label = sprintf("%s AUC: %s", .name, .x$auc), color = .color, hjust = 0
    )
  ) # 对每一个变量的AUC曲线，设置不同的颜色(palette)，以及注释
}, re5roc, palette, seq(0.05, 0.2, by = .05), names(re5roc)), init = ggplot())
p + geom_segment(aes(x = 0, xend = 1, y = 0, yend = 1), color = "red", linetype = "dashed")
```


## wrap ggplot2 function

在ggplot2的`aes`函数中都使用了非标准性计算(NSE)，如果你想对`aes`传递参数, 则应该使用`{{}}`包裹这些参数。
关于NSE的讨论可以参考[Advanced R](https://adv-r.hadley.nz/)。一个例子见[这里](https://cying.org/en-work/2023/06/wrap-ggplot2-function/)。


另一个封装ggplot2函数的问题在于`...`参数的传递。当你的函数试图创建多个ggplot2 components，你必须区分`...`里的参数是传递给哪个component。一种解决办法如下：

```r
geom_mean <- function(..., bar.params = list(), errorbar.params = list()) {
  params <- list(...)
  bar.params <- modifyList(params, bar.params)
  errorbar.params  <- modifyList(params, errorbar.params)
  
  bar <- do.call("stat_summary", modifyList(
    list(fun = "mean", geom = "bar", fill = "grey70"),
    bar.params)
  )
  errorbar <- do.call("stat_summary", modifyList(
    list(fun.data = "mean_cl_normal", geom = "errorbar", width = 0.4),
    errorbar.params)
  )

  list(bar, errorbar)
}

ggplot(mpg, aes(class, cty)) + 
  geom_mean(
    colour = "steelblue",
    errorbar.params = list(width = 0.5, linewidth = 1)
  )
ggplot(mpg, aes(class, cty)) + 
  geom_mean(
    bar.params = list(fill = "steelblue"),
    errorbar.params = list(colour = "blue")
  )
```


## Internals of ggplot2

需要明确的是，当你在对你的`ggplot`函数添加一层层的图的操作与画图无关，而更多是创建一个用于画图的对象，当你`print`是该对象才被用于绘图；该对象需要经过`ggplot2::ggplot_build()`对其进行处理用于生成处理后的数据，最后经过`ggplot2::ggplot_gtable()`最终生成绘图数据。

统计绘图的本质在于统计量的分布；对于`ggplot2`而言其`geom_`以及对应的`stat_`函数将对原数据的统计量的计算以及其对应的几何图形整合在一起，掩盖了计算统计量的结果。为了得到统计量的结果，我们可以手动的生成的`ggplot2`进行`ggplot2::ggplot_build`的构建。


```r
set.seed(123)
dt <- data.table(x = rnorm(20, mean = 1, sd = 2))
dt[, y := 2 * x + rnorm(20)]
p <- ggplot(dt, aes(x = x, y = y)) +
  geom_point() +
  geom_smooth(method = "lm", formula = y ~ x, n = 20)

stat <- ggplot_build(p)
stat$data[[2]] |> head(n = 5)
```

需要注意的是，ggplot2会先对数据进行所有的`scale`操作然后再进行各种统计计算，例如如果添加了`scale_x_log10`函数，则其先对原数据进行`log10`映射，然后再进行统计量的计算。


