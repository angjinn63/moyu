window.MOYU_GAME_CONFIG = {
  title: "魔域 2.4",
  swfUrl: "./assets/moyu24.swf",
  width: 580,
  height: 500,
  forceLetterbox: true,
  showControlsOnDesktop: false,
  showControlsOnMobile: true,

  // GitHub Pages 版：默认使用 CDN 加载 Ruffle。
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
