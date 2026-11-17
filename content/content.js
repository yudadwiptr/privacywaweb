/* Tirai content script for web.whatsapp.com.
 *
 * Instead of walking the DOM, it writes one <style> element built from the
 * user's settings. WhatsApp Web re-renders constantly, so plain CSS keeps up
 * for free, and :is() ignores any selector that stops matching.
 *
 * WhatsApp changes its markup now and then. If a category stops blurring,
 * update its selector list in SELECTORS below.
 */
(function () {
  const { STORAGE_KEY, withDefaults } = self.TIRAI;

  const SELECTORS = {
    messages: [
      "#main .message-in",
      "#main .message-out",
      "#main [data-pre-plain-text]"
    ],
    preview: [
      '#pane-side [role="listitem"] [role="gridcell"] + div',
      '#pane-side [role="row"] [role="gridcell"] + div',
      '#pane-side [data-testid="cell-frame-secondary"]',
      '#pane-side span[dir="ltr"]',
      "#pane-side ._ak8k"
    ],
    input: [
      '#main footer [contenteditable="true"]',
      '[data-animate-modal-body] [contenteditable="true"]'
    ],
    media: [
      "#main .message-in img:not(.emoji):not([data-plain-text])",
      "#main .message-out img:not(.emoji):not([data-plain-text])",
      "#main .message-in video",
      "#main .message-out video",
      '#main .message-in [style*="background-image"]',
      '#main .message-out [style*="background-image"]',
      "#main canvas"
    ],
    gallery: [
      "[data-animate-media-viewer] img",
      "[data-animate-media-viewer] video",
      '[data-testid="media-viewer-modal"] img',
      '[data-testid="media-viewer-modal"] video',
      '[data-testid="media-canvas"]',
      '#app [role="dialog"] img:not(.emoji)',
      'div[aria-label*="media" i] [style*="background-image"]',
      'div[aria-label*="media" i] img:not(.emoji)'
    ],
    avatars: [
      'img[src*="pps.whatsapp.net"]',
      "#pane-side img:not(.emoji)",
      "#main header img:not(.emoji)",
      '[data-icon="default-user"]',
      '[data-icon="default-group"]',
      'header [role="button"] img'
    ],
    names: [
      '#pane-side span[title][dir="auto"]',
      '#pane-side [role="gridcell"] span[title]',
      '#main header span[dir="auto"]',
      '#main .message-in [aria-label][dir="auto"]',
      '#main .message-in span[data-testid="author"]'
    ]
  };

  const STYLE_ID = "tirai-style";
  let settings = withDefaults();
  let idleTimer = null;

  function buildCss(s) {
    if (!s.enabled) return "";

    const scope = s.appHover ? "html:not(:hover) " : "";
    const ease = s.noTransition ? "none" : "filter .22s ease";
    const out = [];

    for (const [key, list] of Object.entries(SELECTORS)) {
      const item = s.items[key];
      if (!item || !item.on) continue;
      const sel = `:is(${list.join(", ")})`;
      out.push(`${scope}${sel}{filter:blur(${s.blur}px) !important;transition:${ease} !important;}`);
      if (item.hover) {
        out.push(`${scope}${sel}:hover{filter:none !important;}`);
      }
    }

    // Idle cover: blur the whole app until the user comes back.
    out.push(
      `html[data-tirai-idle] #app{filter:blur(${Math.max(s.blur * 2, 16)}px) grayscale(.3) !important;` +
      `transition:${s.noTransition ? "none" : "filter .4s ease"} !important;}`
    );

    return out.join("\n");
  }

  function apply() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = buildCss(settings);
    resetIdle();
  }

  /* Idle detection */
  function goIdle() {
    document.documentElement.setAttribute("data-tirai-idle", "");
  }

  function resetIdle() {
    document.documentElement.removeAttribute("data-tirai-idle");
    clearTimeout(idleTimer);
    if (settings.enabled && settings.idle.on) {
      idleTimer = setTimeout(goIdle, settings.idle.seconds * 1000);
    }
  }

  let lastPoke = 0;
  function onActivity() {
    // throttle: mousemove fires a lot
    const now = Date.now();
    if (now - lastPoke < 500 && !document.documentElement.hasAttribute("data-tirai-idle")) return;
    lastPoke = now;
    resetIdle();
  }

  ["mousemove", "mousedown", "keydown", "wheel", "touchstart"].forEach((type) =>
    window.addEventListener(type, onActivity, { passive: true, capture: true })
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && settings.enabled && settings.idle.on) goIdle();
  });

  /* Settings */
  chrome.storage.sync.get(STORAGE_KEY).then((data) => {
    settings = withDefaults(data[STORAGE_KEY]);
    apply();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEY]) {
      settings = withDefaults(changes[STORAGE_KEY].newValue);
      apply();
    }
  });

  // <head> may not exist at document_start; make sure our style survives.
  document.addEventListener("DOMContentLoaded", () => {
    const style = document.getElementById(STYLE_ID);
    if (style && document.head && style.parentNode !== document.head) document.head.appendChild(style);
  });
})();
