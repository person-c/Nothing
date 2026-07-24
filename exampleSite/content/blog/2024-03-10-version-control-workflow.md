---
title: Git 版本控制工作流
date: 2024-03-10
---

版本控制是现代软件开发的基础，Git 是最流行的版本控制系统。一个好的工作流可以显著提高协作效率。

## 分支策略

`main` 分支保持稳定可发布的状态，开发在 `feature` 分支上进行，通过 Pull Request 合并。对于个人项目，这种简单的分支模型已经足够。

## 有意义的 commit message

好的 commit message 应该用简短的一句话说明为什么要做这个改动，而不是改了什么。推荐使用祈使语气，如 "fix memory leak in data loader" 而非 "fixed a bug"。

## 常用命令

`git stash` 暂存当前工作，`git rebase -i` 整理提交历史，`git bisect` 二分查找引入 bug 的提交。掌握这些命令可以应对大多数场景。
