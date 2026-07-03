# 魔域 2.4 - 文本修复 + 进度条版

本版本保留：

- 加载进度条
- 手机虚拟按键：方向键、J/K/L/Q、1/2/3/4
- GitHub Pages / 服务器静态部署
- 针对中文动态文本的 Ruffle `deviceFontRenderer: "canvas"` 修复

## 这版为什么能修复一部分文字问题？

这个 SWF 的 NPC、怪物、任务等文本大量依赖 Flash 旧设备字体/中文字体名。Ruffle 默认设备字体渲染模式是 `embedded`，有时会只显示数字、英文或不显示中文。本版本强制改为 `canvas`，让 Ruffle 尝试调用浏览器/系统字体渲染。

如果仍然无文字，说明这个 SWF 的文本更依赖 Flash 原生字体/嵌入字形行为，Ruffle 网页端无法完全兼容；需要用 JPEXS/Animate 修 SWF 字体，或使用真正 Flash Player 环境。

## 调试

访问地址后加：

```text
?debug=1
```

可以在左上角看到 Ruffle 加载源、字体渲染模式、默认字体配置等信息。

## GitHub Pages 上传方式

把本文件夹里的内容直接上传到仓库根目录，确保结构是：

```text
index.html
.nojekyll
README.md
assets/
vendor/
```
