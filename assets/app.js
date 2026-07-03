(function () {
  "use strict";

  const config = window.MOYU_GAME_CONFIG;
  const state = {
    player: null,
    activeKeys: new Set(),
    controlsForced: null,
    ruffleLoadedFrom: null
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function setLoadingText(text) {
    const el = $("#loading-text");
    if (el) el.textContent = text;
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
    window.RufflePlayer = window.RufflePlayer || {};
    window.RufflePlayer.config = {
      autoplay: "on",
      unmuteOverlay: "hidden",
      letterbox: config.forceLetterbox ? "on" : "fullscreen",
      warnOnUnsupportedContent: true,
      openUrlMode: "confirm",
      showSwfDownload: false,
      splashScreen: false,
      contextMenu: false
    };

    const sources = (Array.isArray(config.ruffleSources) && config.ruffleSources.length)
      ? config.ruffleSources
      : [config.ruffleLocal, config.ruffleCdn].filter(Boolean);
    let lastError = null;

    for (const src of sources) {
      try {
        const isLocal = src.includes("vendor") || src.startsWith("./") || src.startsWith("/");
        setLoadingText(isLocal ? "正在加载本地 Ruffle…" : "正在加载 Ruffle CDN…");
        await loadScript(src);
        state.ruffleLoadedFrom = src;
        debug(`Ruffle loaded from ${src}`);
        return;
      } catch (error) {
        lastError = error;
        debug(error.message);
      }
    }

    throw lastError || new Error("Ruffle 加载失败。请确认网络可以访问 CDN，或改成本地自托管 Ruffle。");
  }

  async function initPlayer() {
    setLoadingText("正在创建播放器…");

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

    setLoadingText("正在加载 SWF 文件…");
    await player.load({
      url: config.swfUrl,
      autoplay: "on"
    });

    setLoadingText("加载完成");
    setTimeout(() => {
      loadingPanel.classList.add("hidden");
      focusGame();
    }, 320);
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
  }

  function initRotateTip() {
    const tip = $("#rotate-tip");
    if (isTouchDevice()) tip.classList.add("auto");
  }

  async function main() {
    document.title = config.title;
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
