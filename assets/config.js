window.MOYU_GAME_CONFIG = {
  title: "魔域 2.4",
  swfUrl: "./assets/moyu24.swf",
  preloadSwf: true,
  width: 580,
  height: 500,
  forceLetterbox: true,
  showControlsOnDesktop: false,
  showControlsOnMobile: true,

  // 文本修复核心：这个 SWF 大量动态文本使用 Flash 设备字体/中文字体名。
  // Ruffle 默认 deviceFontRenderer 是 embedded，可能只显示数字、英文或直接不显示中文。
  // 改成 canvas 后，Ruffle 会尝试调用浏览器/系统字体渲染设备字体。
  deviceFontRenderer: "canvas",

  // 给 Flash 的默认设备字体提供中文字体候选。不同系统会自动选择可用字体。
  defaultFonts: {
    sans: [
      "Microsoft YaHei",
      "SimSun",
      "NSimSun",
      "Noto Sans SC",
      "Noto Sans CJK SC",
      "PingFang SC",
      "Heiti SC",
      "Arial Unicode MS",
      "sans-serif"
    ],
    serif: [
      "SimSun",
      "NSimSun",
      "Noto Serif SC",
      "Noto Serif CJK SC",
      "Songti SC",
      "serif"
    ],
    typewriter: [
      "Microsoft YaHei Mono",
      "Consolas",
      "Courier New",
      "monospace"
    ],
    japaneseGothic: [
      "Microsoft YaHei",
      "Noto Sans CJK SC",
      "Noto Sans SC",
      "sans-serif"
    ],
    japaneseGothicMono: [
      "Microsoft YaHei Mono",
      "Noto Sans Mono CJK SC",
      "monospace"
    ],
    japaneseMincho: [
      "SimSun",
      "Noto Serif CJK SC",
      "serif"
    ]
  },

  // 这不是 CSS 字体。Ruffle 官方文档里 fontSources 当前主要用于加载额外字体 SWF。
  // 这里先留空，避免额外下载无效字体导致更慢。如果以后做字体 SWF，可放到此数组。
  fontSources: [],

  // GitHub Pages / 服务器版均默认使用 CDN 加载 Ruffle。
  // 如果你以后想完全自托管 Ruffle，把 ruffle.js / wasm 放进 ./vendor/ruffle/，
  // 然后把 "./vendor/ruffle/ruffle.js" 放到数组第一项即可。
  ruffleSources: [
    "https://unpkg.com/@ruffle-rs/ruffle",
    "https://cdn.jsdelivr.net/npm/@ruffle-rs/ruffle"
  ],

  keyMap: {
    ArrowUp: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
    ArrowDown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
    ArrowLeft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
    ArrowRight: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },

    KeyJ: { key: "j", code: "KeyJ", keyCode: 74 },
    KeyK: { key: "k", code: "KeyK", keyCode: 75 },
    KeyL: { key: "l", code: "KeyL", keyCode: 76 },
    KeyQ: { key: "q", code: "KeyQ", keyCode: 81 },

    Digit1: { key: "1", code: "Digit1", keyCode: 49 },
    Digit2: { key: "2", code: "Digit2", keyCode: 50 },
    Digit3: { key: "3", code: "Digit3", keyCode: 51 },
    Digit4: { key: "4", code: "Digit4", keyCode: 52 }
  }
};
