---
title: environment setting
date: 2022-08-17
---

怎么定义环境，按我现在浅薄的认知就是一些参数配置，一个预先定义的值 key = value, 应用或环境在启动时从这里获取变量值，指定应用在执行时其需要的值。环境变量包括全局环境变量以及局部环境变量。全局环境变量，所有都可以获得的变量。 局部环境变量，某些可以获得这些值。在写代码时将一些敏感的变量值，独立出来作为预先定义的环境变量文件.env，并将其放入.gitignore，然后将代码上传到gitHub，以防止一些隐私信息泄露。另外初次接触bash脚本的人总是对各种命令感觉奇怪，其实这些命令只是函数的特殊形式，其后面可能会接一些其它东西，这些东西就是函数的参数。

参考：  
[linux下怎么运行R脚本](http://www.cureffi.org/2014/01/15/running-r-batch-mode-linux/)  
[环境变量介绍以及使用](https://medium.com/chingu/an-introduction-to-environment-variables-and-how-to-use-them-f602f66d15fa)
[Linux下怎么设置环境变量](https://www.serverlab.ca/tutorials/linux/administration-linux/how-to-set-environment-variables-in-linux/)
