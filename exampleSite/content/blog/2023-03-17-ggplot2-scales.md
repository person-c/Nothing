---
title: ggplot2 scales
date: 2023-03-17
---


ggplot2中所有映射都由scale_*函数控制, 使用`vignette("ggplot2-specs")`查看所有的映射。

# Position scales and axes

## Numeric positions and scales

**limits** 控制x, y轴的范围。

- zooming in

>NOTE: When you truncate the scale limits, some data points will fall outside the boundaries you set, and ggplot2 has to make a decision about what to do with these data points. The default behaviour in ggplot2 is to convert any data values outside the scale limits to NA. This means that changing the limits of a scale is not always the same as visually zooming in to a region of the plot. If your goal is to zoom in on part of the plot, it is usually better to use the xlim and ylim arguments of coord_cartesian(ylim = c(10, 35))

- visual range expansion
实际上ggplot2的图形默认的x, y limits总是比实际的数值范围大一点，以防止图形与坐标轴重叠。可以通过`expand`参数改变该行为

```r
base + 
scale_x_continuous(expand = expansion(0))
```

expansion通过参数mult - proportion of axis limits, add定义limits扩展的大小。如果只提供一个值则默认向两侧扩展同样的大小，如果提供两个值则向两侧分别扩展指定的大小。
>

**breaks** 控制scale breaks以及对应的网格线。

breaks 参数接受一个数值向量中的值作为breaks. 也可以接受一个函数 - 该函数的参数接收该数值的limits，然后返回breaks的数值向量。scales包中提供了许多这样的函数，免去自己手动书写。

此外， minor_breaks，也可以同breaks一样设置，同时改变对应的minor grid lines.

**labels** 每一个breaks都有一个对应的labels.

同breaks一样，该参数可以接收一个函数 - 该函数接收break作为参数，返回对应的labels. 同样地， scales包中提供了许多这样的函数。

**trans** 数据变化

该参数决定数据该如何变化，同样地，该参数接收一个函数 - 该函数负责对数据进行变化。scales包中同样提供了许多这样的函数。你也可以直接指定对应的字符，以实行相应的数据变化。

```r
p + scale_y_continuous(trans = "reciprocal")
p + scale_y_continuous(trans = scales::reciprocal_trans())
```

>If you use a transformed scale, the axes will be labelled in the original data space; if you transform the data, the axes will be labelled in the transformed space.

## Discrete position scales

>Internally, ggplot2 handles discrete scales by mapping each category to an integer value and then drawing the geom at the corresponding coordinate location.
>Mapping each category to an integer value is useful because it means that other width quantities can be specified as a proportion of the category range. The same mechanism underpins the widths of bars and boxplots. Because each category has width 1 in a discrete scale, setting width = .4 when using geom_boxplot(width = .4) ensures that the box occupies 40% of the width allocated to the category.

**limits**

Discrret limits 与 numerous limits的不同之处在于，它的limits不是具有endpoints的向量，而是一个包含该分类变量所有可能值的chr vector.

**labels**

分类变量的label具有一个额外的功能 - 可以仅仅改变一部分breaks的labels。对此你需要提供一个字符向量，该向量元素的名称对应该分类变量可能的值。

```r
base + scale_y_discrete(breaks = c("b", "c"))
base + scale_y_discrete(labels = c(c = "carrot", b = "banana")) 
```

**guide** 控制对该映射描述信息的显示

每一个映射都有一个对应的guide函数控制其映射信息的显示效果。

```r
base + scale_x_discrete(guide = guide_axis(n.dodge = 3))
base + scale_x_discrete(guide = guide_axis(angle = 90))
```

**name** 控制该映射的名称

## Binned position scales

>A variation on discrete position scales are binned scales, where a continuous variable is sliced into multiple bins and the discretised variable is plotted

# Color scale

ggplot2内部从virdis以及colorBrewer中分别设置了颜色的映射。

**viridis**

- `scale_fill_viridis_b` used for binned variable.
- `scale_fill_viridis_c` used for continuous variable.
- `scale_fill_viridis_d` used for discrete variable.

**ColorBrewer**

- `scale_fill_fermenter` used for binned variable.
- `scale_fill_distiller` used for continuous variable.
- `scale_fill_brewer` used for discret variable.

此外更多的扩展包例如`scico`提供了用于科研配色的调色板。

## Continuous

ggplot2中默认用于连续变量颜色映射的函数是`scale_fill_gradient`, `scale_fill_gradient2`以及`scale_fill_gradientn`。这一系列函数分别接收2，3， 多个颜色，从而创建颜色之间的变化。

- `low`: 颜色变化的起点
- `high`: 颜色变化的终点
- `mid`: 中间点的颜色
- `midpoint`: 数值的哪一个值作为中间值
- `colors`: 颜色的向量

**Missing values**

数值变量中缺失值（包括超出limits范围的缺失值）默认被设置为灰色。可以通过设置参数`na.value = NA`使得缺失值不可见，也可以单独为其设置颜色`na.value = "yellow"`

**limits, breaks, label**

类似于position scales的设置。

**legend**

>Every scale is associated with a guide that displays the relationship between the aesthetic and the data.

对于continuous color的映射，它的guide就是图例， 被称之为color bar, 通过函数guide_colorbar设置其外观。

- `reverse` flips the colour bar to put the lowest values at the top.

- `barwidth` and `barheight` allow you to specify the size of the bar. These are grid units, e.g. unit(1, "cm").

- `direction` specifies the direction of the guide, "horizontal" or "vertical".

```r
base + scale_colour_continuous(guide = guide_colourbar(reverse = TRUE))
```

## discrete color

默认的函数是`scale_fill_hue`，但是不建议使用，建议使用之前提到的`scale_fill_brewer`.

**limits, breaks, labels** 与其它的设置一样

**legend** 对于离散变量它的guides直接称为`legend`，可以通过`guide_legend`函数控制其`guide`的显示。

```
base + guides(fill = guide_legend(ncol = 2, byrow = TRUE))
```

**override.aes** is useful when you want the elements in the legend display differently to the geoms in the plot.

```r
base + guides(colour = guide_legend(override.aes = list(alpha = 1)))
```

## Binned colour scales

和continuous scales一致， `scale_fill_steps`, `scale_fill_steps2` , `scale_fill_stepsn` 作为binned colors的默认映射。

```r
 scale_fill_stepsn(n.breaks = 9, colours = viridis::viridis(9))
```

**legend** binned colors 的legend 称为`guide_coloursteps`

# Alpha scales

alpha的默认映射函数是`scale_alpha`对应`scale_alpha_continuous`

# Size scales

size scales 的默认映射是`scale_size`，这里的映射是将数据的变化映射到area的变化。另外一个也是和size有关的映射函数是`scale_radius`，该函数将数据的变化映射到半径的变化。

# Shape scales

由`scale_shape`函数控制，该函数只有一个参数`solid = TRUE`，用于控制shape是空的还是实心的。

# Linewidth

早期ggplot2的版本，线的宽度是由映射size控制的，后来因为考虑到size和lindewidth需要独立变化，添加了linewidth的映射。

# Linetype scales

# Manual scales

手动设置映射主要是为了设置自己喜欢的颜色或者shapde等，以及自动生成legend的。其关键在于给`value`参数提供一个有名的向量，名字对应了数据空间的值，而向量的值对应美学空间中的值。

```r
ggplot(huron, aes(year)) +
  geom_line(aes(y = level + 5, colour = "above")) +
  geom_line(aes(y = level - 5, colour = "below")) +
  scale_colour_manual("Direction",
    values = c("above" = "red", "below" = "blue")
  )
```
