# 魔域 2.4 GitHub Pages 版

这个包已经改成可以直接上传到 GitHub 仓库根目录的结构。

## 文件结构

```text
index.html
.nojekyll
assets/
  moyu24.swf
  config.js
  app.js
  styles.css
vendor/
  ruffle/
    README.txt
```

## 上传方式

1. 在 GitHub 新建仓库，例如 `moyu-game`。
2. 把这个压缩包解压后的全部文件上传到仓库根目录。
3. 注意：`index.html` 必须在仓库根目录，不要再套一层 `public/`。
4. 进入仓库：`Settings` → `Pages`。
5. Source 选择 `Deploy from a branch`。
6. Branch 选择 `main`，目录选择 `/root`，保存。

部署完成后访问：

```text
https://你的GitHub用户名.github.io/moyu-game/
```

## 操作方式

电脑端：

```text
方向键：移动
J / K / L / Q：动作键
1 / 2 / 3 / 4：数字快捷键
```

手机端：

```text
横屏打开
左侧：方向键
右侧：J / K / L / Q 四个动作键
右上角：1 / 2 / 3 / 4 四个快捷键
屏幕中间的 Start / Select 已取消
```

## 调试方式

如果打开后加载失败或白屏，可以在网址后面加：

```text
?debug=1
```

例如：

```text
https://你的GitHub用户名.github.io/moyu-game/?debug=1
```

页面左上角会显示 Ruffle / SWF 加载过程。

## 注意

这个版本默认从 CDN 加载 Ruffle：

```text
https://unpkg.com/@ruffle-rs/ruffle
https://cdn.jsdelivr.net/npm/@ruffle-rs/ruffle
```

如果 CDN 无法访问，需要下载 Ruffle Self Hosted Web Package，把 `ruffle.js` 和相关 `.wasm` 文件放入：

```text
vendor/ruffle/
```

然后修改：

```text
assets/config.js
```

把：

```js
"./vendor/ruffle/ruffle.js"
```

加到 `ruffleSources` 的第一项。

## 白屏说明

GitHub Pages 可以解决路径、MIME、Nginx 配置类问题，但如果 SWF 本身在 Ruffle 中兼容不完整，或者游戏旧广告/外链代码卡住，仍可能白屏。遇到这种情况需要继续处理 SWF 内部代码或广告加载逻辑。
