(function () {
  "use strict";

  const config = window.MOYU_GAME_CONFIG;
  const state = {
    player: null,
    activeKeys: new Set(),
    controlsForced: null,
    ruffleLoadedFrom: null,
    swfObjectUrl: null
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function setLoadingText(text) {
    const el = $("#loading-text");
    if (el) el.textContent = text;
  }

  function setLoadingDetail(text) {
    const el = $("#loading-detail");
    if (el) el.textContent = text || "";
  }

  function setLoadingProgress(percent, detail) {
    const value = Math.max(0, Math.min(100, Math.round(percent)));
    const bar = $("#loading-bar-inner");
    const pct = $("#loading-percent");

    if (bar) {
      bar.style.width = `${value}%`;
      bar.style.transform = "none";
      bar.classList.toggle("indeterminate", value <= 0 || value >= 96);
    }

    if (pct) pct.textContent = `${value}%`;
    if (detail) setLoadingDetail(detail);
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index += 1;
    }
    return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  }

  function debug(message) {
    const params = new URLSearchParams(location.search);
    if (!params.has("debug")) return;
    const panel = $("#debug-panel");
    panel.classList.remove("hidden");
    panel.textContent += `${new Date().toLocaleTimeString()} ${message}\n`;
  }

  function isTouchDevice() {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve(src);
      script.onerror = () => reject(new Error(`无法加载 ${src}`));
      document.head.appendChild(script);
    });
  }

  async function loadRuffle() {
    const fontSources = Array.isArray(config.fontSources) ? config.fontSources.filter(Boolean) : [];
    const defaultFonts = config.defaultFonts || {};
    const deviceFontRenderer = config.deviceFontRenderer || "canvas";

    window.RufflePlayer = window.RufflePlayer || {};
    window.RufflePlayer.config = {
      autoplay: "on",
      unmuteOverlay: "hidden",
      letterbox: config.forceLetterbox ? "on" : "fullscreen",
      warnOnUnsupportedContent: true,
      openUrlMode: "confirm",
      showSwfDownload: false,
      splashScreen: false,
      contextMenu: false,
      fontSources: fontSources,
      defaultFonts: defaultFonts,
      deviceFontRenderer: deviceFontRenderer
    };

    const sources = (Array.isArray(config.ruffleSources) && config.ruffleSources.length)
      ? config.ruffleSources
      : [config.ruffleLocal, config.ruffleCdn].filter(Boolean);
    let lastError = null;

    for (const src of sources) {
      try {
        const isLocal = src.includes("vendor") || src.startsWith("./") || src.startsWith("/");
        setLoadingText(isLocal ? "正在加载本地 Ruffle…" : "正在加载 Ruffle CDN…");
        setLoadingProgress(8, isLocal ? "加载本地播放器脚本" : "加载在线 Ruffle 播放器脚本");
        await loadScript(src);
        setLoadingProgress(22, "播放器脚本加载完成，准备加载游戏文件");
        state.ruffleLoadedFrom = src;
        debug(`Ruffle loaded from ${src}`);
        debug(`Device font renderer: ${deviceFontRenderer}`);
        debug(`Default font groups: ${Object.keys(defaultFonts).join(", ") || "none"}`);
        debug(`Font sources configured: ${fontSources.length}`);
        return;
      } catch (error) {
        lastError = error;
        debug(error.message);
      }
    }

    throw lastError || new Error("Ruffle 加载失败。请确认网络可以访问 CDN，或改成本地自托管 Ruffle。");
  }

  async function fetchSwfWithProgress(url) {
    setLoadingText("正在下载游戏文件…");
    setLoadingProgress(28, "开始下载 SWF 主文件");

    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`SWF 下载失败：HTTP ${response.status}`);
    }

    const total = Number(response.headers.get("content-length")) || 0;

    if (!response.body || typeof response.body.getReader !== "function") {
      const buffer = await response.arrayBuffer();
      setLoadingProgress(72, `游戏文件下载完成：${formatBytes(buffer.byteLength)}`);
      return new Blob([buffer], { type: "application/x-shockwave-flash" });
    }

    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;

      if (total > 0) {
        const ratio = received / total;
        const percent = 28 + ratio * 44;
        setLoadingProgress(percent, `已下载 ${formatBytes(received)} / ${formatBytes(total)}`);
      } else {
        const softPercent = Math.min(68, 28 + Math.log2(received / 1024 + 1) * 6);
        setLoadingProgress(softPercent, `已下载 ${formatBytes(received)}`);
      }
    }

    setLoadingProgress(74, `游戏文件下载完成：${formatBytes(received)}`);
    return new Blob(chunks, { type: "application/x-shockwave-flash" });
  }

  async function prepareSwfUrl() {
    if (config.preloadSwf === false) {
      return config.swfUrl;
    }

    try {
      const swfBlob = await fetchSwfWithProgress(config.swfUrl);
      if (state.swfObjectUrl) URL.revokeObjectURL(state.swfObjectUrl);
      state.swfObjectUrl = URL.createObjectURL(swfBlob);
      return state.swfObjectUrl;
    } catch (error) {
      debug(`prefetch SWF failed, fallback to direct url: ${error.message}`);
      setLoadingProgress(35, "无法预读取进度，改用播放器直接加载 SWF");
      return config.swfUrl;
    }
  }

  async function initPlayer() {
    setLoadingText("正在创建播放器…");
    setLoadingProgress(24, "创建 Ruffle 播放容器");

    const shell = $("#player-shell");
    const loadingPanel = $("#loading-panel");
    const ruffle = window.RufflePlayer.newest();
    const player = ruffle.createPlayer();

    state.player = player;
    player.id = "ruffle-player";
    player.setAttribute("tabindex", "0");
    player.style.width = "100vw";
    player.style.height = "100dvh";

    shell.appendChild(player);

    const swfUrl = await prepareSwfUrl();

    setLoadingText("正在解析游戏资源…");
    setLoadingProgress(82, "Ruffle 正在解压、解析图片/音频/脚本资源");

    await player.load({
      url: swfUrl,
      autoplay: "on",
      fontSources: Array.isArray(config.fontSources) ? config.fontSources.filter(Boolean) : [],
      defaultFonts: config.defaultFonts || {},
      deviceFontRenderer: config.deviceFontRenderer || "canvas"
    });

    setLoadingText("加载完成");
    setLoadingProgress(100, "进入游戏");
    setTimeout(() => {
      loadingPanel.classList.add("hidden");
      focusGame();
    }, 520);
  }

  function focusGame() {
    try {
      if (state.player && typeof state.player.focus === "function") {
        state.player.focus();
      }
    } catch (e) {
      debug(`focus failed: ${e.message}`);
    }
  }

  function makeKeyboardEvent(type, keyName) {
    const info = config.keyMap[keyName];
    if (!info) return null;

    const event = new KeyboardEvent(type, {
      key: info.key,
      code: info.code,
      bubbles: true,
      cancelable: true
    });

    try {
      Object.defineProperty(event, "keyCode", { get: () => info.keyCode });
      Object.defineProperty(event, "which", { get: () => info.keyCode });
    } catch (e) {
      debug(`define keyCode failed: ${e.message}`);
    }

    return event;
  }

  function dispatchKey(type, keyName) {
    const event = makeKeyboardEvent(type, keyName);
    if (!event) return;

    focusGame();

    const targets = [document, window, state.player].filter(Boolean);
    for (const target of targets) {
      try {
        target.dispatchEvent(event);
      } catch (e) {
        debug(`dispatch failed: ${e.message}`);
      }
    }
  }

  function pressVirtualKey(keyName, button) {
    if (state.activeKeys.has(keyName)) return;
    state.activeKeys.add(keyName);
    button.classList.add("pressed");
    dispatchKey("keydown", keyName);
  }

  function releaseVirtualKey(keyName, button) {
    if (!state.activeKeys.has(keyName)) return;
    state.activeKeys.delete(keyName);
    button.classList.remove("pressed");
    dispatchKey("keyup", keyName);
  }

  function releaseAllVirtualKeys() {
    $$(".vkey[data-key]").forEach((button) => {
      releaseVirtualKey(button.dataset.key, button);
    });
  }

  function bindVirtualControls() {
    $$(".vkey[data-key]").forEach((button) => {
      const keyName = button.dataset.key;

      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        try { button.setPointerCapture(event.pointerId); } catch (e) {}
        pressVirtualKey(keyName, button);
      });

      button.addEventListener("pointerup", (event) => {
        event.preventDefault();
        releaseVirtualKey(keyName, button);
      });

      button.addEventListener("pointercancel", (event) => {
        event.preventDefault();
        releaseVirtualKey(keyName, button);
      });

      button.addEventListener("pointerleave", (event) => {
        event.preventDefault();
        releaseVirtualKey(keyName, button);
      });
    });
  }

  function updateControlsVisibility() {
    const controls = $("#mobile-controls");
    controls.classList.remove("desktop-hidden");

    if (state.controlsForced === true) {
      controls.classList.remove("off", "desktop-hidden");
      return;
    }

    if (state.controlsForced === false) {
      controls.classList.add("off");
      return;
    }

    if (isTouchDevice()) {
      if (config.showControlsOnMobile) controls.classList.remove("off");
      else controls.classList.add("off");
    } else {
      if (config.showControlsOnDesktop) controls.classList.remove("desktop-hidden", "off");
      else controls.classList.add("desktop-hidden");
    }
  }

  async function requestFullscreen() {
    const app = $("#app");
    try {
      if (!document.fullscreenElement) {
        await app.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      debug(`fullscreen failed: ${e.message}`);
    }
    focusGame();
  }

  function bindTools() {
    $("#fullscreen-btn").addEventListener("click", requestFullscreen);

    $("#controls-btn").addEventListener("click", () => {
      if (state.controlsForced === null) {
        const currentlyHidden = $("#mobile-controls").classList.contains("off") || $("#mobile-controls").classList.contains("desktop-hidden");
        state.controlsForced = currentlyHidden;
      } else {
        state.controlsForced = !state.controlsForced;
      }
      updateControlsVisibility();
      focusGame();
    });

    $("#rotate-btn").addEventListener("click", () => {
      $("#rotate-tip").style.display = "grid";
    });

    $("#close-rotate-tip").addEventListener("click", () => {
      $("#rotate-tip").style.display = "none";
      focusGame();
    });

    document.body.addEventListener("click", focusGame, { passive: true });
    document.body.addEventListener("touchstart", focusGame, { passive: true });
    window.addEventListener("resize", updateControlsVisibility);
    window.addEventListener("orientationchange", () => setTimeout(updateControlsVisibility, 250));
    window.addEventListener("blur", releaseAllVirtualKeys);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) releaseAllVirtualKeys();
    });

    window.addEventListener("beforeunload", () => {
      if (state.swfObjectUrl) URL.revokeObjectURL(state.swfObjectUrl);
    });
  }

  function initRotateTip() {
    const tip = $("#rotate-tip");
    if (isTouchDevice()) tip.classList.add("auto");
  }

  async function main() {
    document.title = config.title;
    setLoadingProgress(3, "初始化页面和虚拟按键");
    initRotateTip();
    bindVirtualControls();
    bindTools();
    updateControlsVisibility();

    try {
      await loadRuffle();
      await initPlayer();
    } catch (error) {
      setLoadingText(`加载失败：${error.message}`);
      $("#manual-start").classList.remove("hidden");
      $("#manual-start").textContent = "重新加载";
      $("#manual-start").onclick = () => location.reload();
      debug(error.stack || error.message);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
