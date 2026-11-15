---
title: execute r script in linux
date: 2023-01-12
---

- [argparse](#argparse)
- [`read_yaml`](#read_yaml)
- [parallel](#parallel)

编写R软件。首先在脚本头部加入语句`#! /usr/bin/env Rscript`指定bash。

#### argparse

R软件接受命令行参数，这里我使用r包argparse。这是依据python包写的，因此需要你的的环境里有python环境。如果需要生成帮助文档，则需要knitr包，而knitr包依赖于软件pandoc，所以你还需要下载pandoc。其简单的执行过程就是创建一个parser对象，调用其`add_argument()`方法添加参数，然后将接收的命令行参数返回一个列表。

命令行参数主要包括可选参数以及位置参数。  
参数名的简写一般以符号`-`开始，而其全称以符号`--`开始。

可选参数例子如下：

```r
#! /usr/bin/env Rscript
library(argparse)

# 创建参数解析对象
parser <- ArgumentParser()

# 设置参数
# 设置第一个参数verbose，缩写为v，其作用是告诉脚本是否打印完整的计算过程，其缺省值为TRUE
parser$add_argument("-v", "--verbose",
    action = "store_true", default = TRUE,
    help = "Print extra output [default]")

# 设置第二个参数quietly，缩写为q，其作用是修改verbose参数，当调用改参数时，verbose被修改为FALSE，从而导致不再打印计算过程
parser$add_argument("-q", "--quietly",
    action = "store_false",
    dest = "verbose",
    help = "Print little output")

# 设置第三个参数count，缩写为c，这是一个整数参数，缺省值5，在后续的代码中被用作确定输出随机数的个数
parser$add_argument("-c", "--count",
    type = "integer", default = 5,
    help = "Number of random normals to generate [default %(default)s]",
    metavar = "number")

# 设置第四个参数generator，无缩写，用于确定调用何种随机分布，缺省值rnorm对应于正态分布
parser$add_argument("--generator", default = "rnorm",
    help = "Function to generate random deviates [default \"%(default)s\"]")

# 设置第五个参数mean，无缩写，浮点数，用于确定正态分布的均值，缺省值为0
parser$add_argument("--mean", default = 0, type = "double",
    help = "Mean if generator == \"rnorm\" [default %(default)s]")

# 设置第六个参数sd，无缩写，浮点数，用于确定正态分布的标准差，缺省值为1
parser$add_argument("--sd", default = 1, type = "double",
    metavar = "standard deviation",
    help = "Standard deviation if generator == \"rnorm\" [default %(default)s]")

# 返回接受的参数列表
args <- parser$args()

# 根据verbose确定是否打印计算过程
if (args$verbose) {
        write("writing some verbose output to standard error...\n", stderr())
}

# 根据其他参数，确定输出随机数的类型与次数
if (args$generator == "rnorm") {
        cat(paste(rnorm(args$count,
               mean = args$mean, sd = args$sd),
               collapse = "\n"))
} else {
        cat(paste(do.call(args$generator, list(args$count)), collapse = "\n"))
}
cat("\n")
```

最后，我们需要使得这个脚本有执行权限，才可以执行该脚本。因此在终端输入命令`chmod +x example.R`。然后就可以输入命令`.example.R`运行该脚本。如果中间出现某些问题，你可能需要考虑你需要用到的软件是否在你的搜索路径PATH里面。

argparse还可以使用参数位置指定参数值：

```r
#!/usr/bin/env Rscript

suppressPackageStartupMessages(library("argparse"))

parser <- ArgumentParser()

parser$add_argument("-n", "--add_numbers",
    action = "store_true", default=FALSE,
    help = "Print line number at the beginning of each line [default]")
# nargs = 1, 第一个参数为第一个文件
parser$add_argument("file", nargs = 1, help = "File to be displayed")
# nargs = 2, 第二个参数为第二个文件
parser$add_argument("second_file",
     nargs = 1, help = "second file to be displayed")

args <- parser$parse_args()

file <- args$file

if (file.access(file) == -1) {
     stop(sprintf("Specified file ( %s ) does not exist", file))
 } else {
    file_text <- readLines(file)
 }

 if (args$add_numbers) {
     cat(paste(1:length(file_text), file_text), sep = "\n")
 } else {
     cat(file_text, sep = "\n")
 }

second_file <- args$second_file

if(file.access(second_file) == -1) {
     stop(sprintf("Specified file ( %s ) does not exist", second_file))
 } else {
    file_text_second <- readLines(second_file)
 }

 if (args$add_numbers) {
     cat(paste(1:length(file_text_second), file_text_second), sep = "\n")
 } else {
     cat(file_text_second, sep = "\n")
 }

args
```

#### `read_yaml`

编写R软件，如果对于需要经常调整的参数来说，当然是最好用argparse写。但是，对于一些可能并不需要经常改动的参数而言，我们可以将参数配置写入yaml配置文件；然后通过argparse读入配置文件的路径，然后通过`read_yaml`将yaml的参数配置转化为R中的数据结构，一般情况下都将其转化为列表。

其实配置文件可以用多种结构化的语言来写。参考知乎上的一篇回答：

- 适合人类编写：ini > toml > yaml > json > xml > plist

- 可以存储的数据复杂度：xml > yaml > toml ~ json ~ plist > ini

就我目前使用R的经验来说，感觉用到yaml的情况好像更多?

#### parallel

在开发这个脚本的过程中，如果把一些需要改变的参数硬编码在脚本里面，当把这个脚本部署到1000台服务器上运行，其中200台训练识别猫的模型，200台训练识别狗的模型，等等。把那200台训练识别猫的模型的服务器分成50组，每组4台，采用不通的学习速率和批次大小。这就叫生产环境。为了达到这个目的，采用硬编码的话就只能采用两种做法。要么用IDE远程连接到每一台服务器上，配置好以后执行程序。要么把参数写在里面，创建1000个不同的脚本，然后分别把这些脚本部署到服务器上。显然，这两种做法都是低效的。如果脚本接受命令行参数，那么我就可以在一个控制脚本里写好参数（甚至可以用程序生成），然后一次性批量地把同一个脚本部署到生产环境里。

参考：  
[argparse-vignette](https://cran.r-project.org/web/packages/argparse/vignettes/argparse.html)  
[argparse-github](https://github.com/trevorld/r-argparse)  
一篇知乎文章（忘记链接，找不到了）  
[python中关于argparse介绍](https://docs.python.org/zh-cn/3/library/argparse.html)  
[知乎-为什么有argparse这种模块](https://www.zhihu.com/question/432917591)  
[命令行脚本编程](https://datascienceatthecommandline.com/2e/)  
