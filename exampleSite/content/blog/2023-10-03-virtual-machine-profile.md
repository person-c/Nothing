---
title: virtual machine profile
date: 2023-10-03
---

**建议直接使用WSL2**


[这里](https://www.vmware.com/products/workstation-player/workstation-player-evaluation.html)下载vmware playrer，[这里](https://ubuntu.com/download/desktop)下载ubuntu镜像。打开vmware，按照提示一路选择操作既可。

>之前下载的是vmware player, 但是后来设置网络时候，发现这玩意并不好用，好多教程都是使用vmware workstation示例，让我想起这以前刷到过的帖子 - 为什么vmware 网上的密钥好多都可以用。尝试了以下，只能说的确可以用，还很多。

**虚拟主机设置主机v2ray代理**

[vmware设置网络模式为桥接模式](https://segmentfault.com/a/1190000039918994)。

物理主机中运行`ipcongfig`查看WLAN ipv4地址。v2ray中开启允许局域网连接，查看局域网socket, http端口号。

```cmd
ipconfig
```

虚拟主机中在 Settings -> Network -> Network Proxy中设置为mannual在http, https前一栏中填入物理主机的ipv4地址，后一栏中填入v2ray中查看的http端口号。在socket的第二栏中填入v2ray中查看的socket端口号。

**中文输入设置**

> [From network](https://askubuntu.com/questions/1408873/ubuntu-22-04-chinese-simplified-pinyin-input-support)

- Open Settings, go to Region & Language -> Manage Installed Languages -> Install / Remove languages.
- Select Chinese (Simplified). Make sure Keyboard Input method system has Ibus selected. Apply.
- Reboot
- Log back in, reopen Settings, go to Keyboard.
- Click on the "+" sign under Input sources.
- Select Chinese (China) and then Chinese (Intelligent Pinyin).

**外观**

高分辨率屏幕下ubuntu的字体太小，可以下载gnome-tweaks工具对字体大小，缩放，外观进行小的调整。

```bash
sudo apt-get install gnome-tweaks
```

下载完成以后在show application中搜索tweaks打开，进行修字体，外观等。

**软件下载**

对于必要的软件通过包管理工具apt 或者 sanp下载。非必要的软件建议使用conda管理，若codna中没有，则建议使用压缩包解压。

**R配置**

使用vscode作为代码编辑器，直接参考[vscode-R文档](https://github.com/REditorSupport/vscode-R/wiki/Getting-Started)配置即可。

其它的编程语言同样直接参考[vscode documentation](https://code.visualstudio.com/docs)

vscode 可以直接使用 snap 下载

```bash
snap install code
```

**主机vscode连接虚拟机**

连接的时候可能会遇到

>试图写入的管道不存在

可能的原因是因虚拟机下没有ssh，下载即可

```bash
sudo apt install ssh
```

**扩展虚拟机磁盘空间**

使用中如果遇到磁盘空间不够的情况下可以扩展磁盘空间。

首先在虚拟机的设置中扩展磁盘空间，然后在系统中下载Gparted软件，分配该磁盘空间。

```bash
sudo apt install GParted
```

**查看系统信息**

[常用命令](https://www.tecmint.com/commands-to-collect-system-and-hardware-information-in-linux/)
