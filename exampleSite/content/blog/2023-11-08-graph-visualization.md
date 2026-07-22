---
title: graph visualization
date: 2023-11-08
---

From [here](https://rviews.rstudio.com/2019/03/06/intro-to-graph-analysis/)

`tydygraph`提供了用于图数据处理的tidy工作流的接口，`ggraph`提供了用于图数据可视化的`ggplot2`工作流的工具。

## `tidygraph`

`tidygraph::as_tbl_graph()`, 用于将一个数据框及其类似的数据结构转换为图数据 —— 这个数据框包含一列称为`from`， 以及一列称为`to`的变量，用于描述节点（nodes/vertex)之间的相互关系，其它的列是对连接线（edge）的描述信息。

可以简单的理解为在经过`as_tbl_graph`后，得到的图数据结构包含两张表。第一张表用于描述节点信息，其第一列是对原始数据框`from`, `to`两类中的节点去重得到。第二张表包含有连接线的信息，其是对原始数据框的复制，但是它的`from`，以及`to`变量中的节点名称由原来的名称被节点在第一张表中的排序所替代。

由于图数据结构中有两张表，所以如果想要改变其中的信息，则需要确定想要改变的是描述节点信息的表还是描述连接信息的表，示例如下

```r
graph %>%
  activate(nodes) #  修改用于描述节点信息的表

graph %>%
  activate(edges) # 修改用于描述连接信息的表
```

如果想要应用一些图算法，在该图数据之上，步骤如下

> - Start with a graph table
> - Temporarily transform the graph to comply with the model that is requested (morph())
> - Add additional transformations to the morphed data using dplyr (optional)
> - Restore the original graph table, but modified to keep the changes made during the morph

当你在`morph`函数中调用算法时，图数据结构会变成适合该算法输入的形式，然后返回一个新的图数据，你可以操作此图数据，就像其它任何图数据一样，然后返回原始数据，但是保留在`morph`期间的修改。

```r
shortest <- graph_routes %>%
  # find the shortest path
  morph(to_shortest_path, from, to, weights = journey_time) %>% 
  # only node and edge in the returned morph data mutated
  mutate(selected_node = TRUE) %>%
  activate(edges) %>%
  mutate(selected_edge = TRUE) %>%
  unmorph() %>%
  activate(nodes) %>%
  mutate(selected_node = ifelse(is.na(selected_node), 1, 2)) %>%
  activate(edges) %>%
  mutate(selected_edge = ifelse(is.na(selected_edge), 1, 2)) %>%
  arrange(selected_edge)
```

## ggraph

`ggraph`提供了用于可视化图数据的一系列类似于`ggplot`的函数。其大致的用法如下

```r
ggraph(graph, aes()，layout = "auto" , circular = FALSE) +
  geom_node_*(aes()) +
  geom_edge_*(aes())
```

其提供了一系列`geom_node_*`以及`geom_edge_*`函数用于对节点以及连接线进行映射。其中在`ggraph`中比较重要的参数是`layout`参数，它决定了整体的布局。`circular`参数决定了是否将图形布局为圆形。在绘图的时候应该考虑多种布局，以更直观的发现节点之间的相互关系。

更多见[reference](https://ggraph.data-imaginist.com/reference/index.html)
