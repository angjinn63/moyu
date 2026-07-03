# 魔域 2.4 GitHub Pages 版（带加载进度条）

这个版本可以直接上传到 GitHub Pages 仓库根目录使用。

## 上传结构

把本文件夹里的内容直接上传到仓库根目录，确保结构是：

```text
index.html
.nojekyll
README.md
assets/
  moyu24.swf
  config.js
  app.js
  styles.css
vendor/
  ruffle/
```

不要把整个文件夹再套一层上传。

## GitHub Pages 设置

Settings → Pages → Source: Deploy from a branch → Branch: main → Folder: /root → Save

访问地址一般是：

```text
https://你的GitHub用户名.github.io/仓库名/
```

## 本版更新

- 加载阶段增加进度条和百分比
- 先用 fetch 预下载 SWF，能显示 SWF 下载进度
- 下载完成后再交给 Ruffle 解压、解析和运行
- 保留中文字体补救配置
- 保留手机虚拟按键：方向键、J/K/L/Q、1/2/3/4

## 调试

在地址后加 `?debug=1` 可显示调试信息。

