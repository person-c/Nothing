---
title: use rmarkdown to generate pdf in chinese
date: 2023-01-12
---

为了使得Rmardown生成的PDF支持中文以及交叉引用等功能，在YAML头部需要做一些设置。pdf_documnent2格式是对普通pdf格式的增强，增加了交叉引用的支持。你可以通过`?pdf_document2`查看该文档可以设置的选项。xelatex是对中文支持比较好的引擎。如下：

```yaml
---
title: "pdf title"
output:
  bookdown::pdf_document2:
    latex_engine: xelatex
date: "2023-01-03"
header-includes: 
  \usepackage{ctex}
  \usepackage{longtable}
---
```

yaml头部的每一个域(filed)都是对文档格式某一类选项的设置，除了output下的内容，其它设置都是不依赖于输出文档类型设置。

对code chunk的一些option，我们可以通过函数`knitr::opts_chunk`统一设置：

````
```{r setup, include=FALSE}
knitr::opts_chunk$set(
  echo = FALSE,
  fig.width = 7,
  fig.height = 5,
  fig.align = "center"
)
```
````

一些常用的code chunk option:

- `fig.show = 'hold'`，它告诉 R Markdown 不要拆分代码块，而是运行完全部代码后，把生成的图片依次附在下方。

knitr 1.35 及以后版本支持在代码块内部用 #| 符号 设置代码块选项，例如：

````
```
#| echo: false
#| fig.width: 10

plot(cars)
```
````

同时我们还可以使用行内代码，例如 `r nrow(mtcars)` ，该表达式会直接执行，将代码嵌入文档之中，进行文档的实时更新。

pdf_document2格式支持对图片,表格以及公式的交叉引用。

````
# 引用图片 {#ref-figure}

```{r cars-plot, fig.cap = "一张散点图"}
plot(cars)
```

引用图片需要为代码块设置标签，并有标题 `fig.cap`, 如图 \@ref(fig:cars-plot) 所示。

下面的图片虽然设置了代码块标签，但没有 `fig.cap`，无法创建单独的图表环境，引用 \@ref(fig:iris-plot) 失效。

```{r iris-plot}
plot(iris)
```

## 引用表格 {#ref-table}

引用表格与图片类似，如表 \@ref(tab:iris-table) 所示。

```{r iris-table}
knitr::kable(head(iris), caption = "一个表格")
```

## 引用公式 {#ref-equation}

第 \@ref(ref-figure) 节和第 \@ref(ref-table) 展示了图片和表格的交叉引用，下面是对公式的引用。

见公式 \@ref(eq:mean)。

\begin{equation}
\bar{X} = \frac{\sum_{i=1}^n X_i}{n} (\#eq:mean)
\end{equation}
```
````

可以看到无论是fig，tab都有一个环境，knitr根据其chunk label引用这些图片以及表格。

如果你想在命令行运行Rmd文件，你可这样`Rscript -e "rmarkdown::render('example.Rmd',params=list(args = myarg))"`，其中args是可变参数，这样可以实现参数化报告。

补充：

使用rmarkdown需要使用rmarkdown包，该包可以直接用命令`install.package("rmarkdown")`。因为pdf_document2格式是bookdown包下的函数，我们还需要运行命令`install.packages("bookdown")`下载该R包。为了生成PDF我们需要还需要下载Latex相关的组件，为此，我们只需要执行下面给两条命令。

```r
# 安装 tinytex
install.packages("tinytex")

# 安装 TinyTex 套件
tinytex::install_tinytex()
```

knitr只负责将.Rmd文件转换为.md文件，其它文件的转换需要依赖于Pandoc，因此你还需要下载Pandoc软件。如果你是在Rstudio中使用Rmarkdown，你不需要考虑Pandoc的问题，因为Pandoc是随Rstudio一起下载的。如果你是使用其它的代码编辑器比如VS code，你需要确保Pandoc在搜索路径中，使得`render`函数能够找到Pandoc。

实际上因为`render()`函数调用的软件Pandoc，你可以任意文档进行转换，不仅仅局限于.Rmd文件。

参考：  
[Rmarkdown definitive guide](https://bookdown.org/yihui/bookdown/tables.html)  
[Rmarkdown 中文指南](https://cosname.github.io/rmarkdown-guide/rmarkdown-base.html#install-tinytex)  
[命令行运行Rmd文件](https://stackoverflow.com/questions/49904943/run-rmarkdown-with-arguments-on-the-command-line)
