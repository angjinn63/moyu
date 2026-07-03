这个目录是可选的本地 Ruffle 自托管目录。

当前 GitHub Pages 版默认从 CDN 加载 Ruffle，所以这里可以为空。

如果你想完全不依赖 CDN：
1. 下载 Ruffle Self Hosted Web Package
2. 把 ruffle.js 和相关 .wasm 文件放进这个目录
3. 打开 assets/config.js
4. 把 "./vendor/ruffle/ruffle.js" 加到 ruffleSources 数组第一项
