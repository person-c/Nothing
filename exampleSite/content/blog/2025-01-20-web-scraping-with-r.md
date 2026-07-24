---
title: R 语言网页爬取指南
date: 2025-01-20
---

网络上有大量公开数据，掌握网页爬取技能可以大大扩展数据分析的数据来源。

## rvest 包基础

`read_html()` 读取网页，`html_nodes()` 或 `html_elements()` 使用 CSS 选择器或 XPath 提取元素，`html_text()` 和 `html_attr()` 获取内容和属性。

## 动态网页处理

对于 JavaScript 渲染的页面，传统的 `rvest` 无能为力。可以使用 `chromote` 包控制无头浏览器，或者直接找到页面背后的 API 接口。

## 爬虫礼仪

遵守 `robots.txt`，设置合理的请求间隔（`Sys.sleep()`），尊重网站的爬取限制。不要给目标服务器造成过大负担。
