/* Answers the popup's "Salin laporan masalah" button with a structure-only report of
 * the WhatsApp Web page: tag names, ids, roles, data-* attribute NAMES, and a few class
 * names. No message text, contact names, phone numbers, or image addresses.
 */
(function () {
  const tag = (e) => {
    let s = e.tagName.toLowerCase();
    if (e.id) s += "#" + e.id;
    const role = e.getAttribute("role");
    if (role) s += `[role=${role}]`;
    const data = Object.keys(e.dataset || {});
    if (data.length) s += `[data-${data.join(",data-")}]`;
    if (e.hasAttribute("contenteditable")) s += "[contenteditable]";
    if (e.hasAttribute("title")) s += "[title]";
    if (e.getAttribute("dir")) s += `[dir=${e.getAttribute("dir")}]`;
    if (typeof e.className === "string" && e.className.trim()) s += "." + e.className.trim().split(/\s+/).slice(0, 3).join(".");
    return s;
  };

  const path = (el, depth = 10) => {
    const out = [];
    for (let e = el; e && e !== document.body && out.length < depth; e = e.parentElement) out.push(tag(e));
    return out;
  };

  // Only the kind of source, never the address (media URLs carry access tokens).
  const srcKind = (src) => {
    if (!src) return "none";
    if (src.startsWith("blob:")) return "blob";
    if (src.startsWith("data:")) return src.slice(0, 15);
    const host = (src.match(/^https?:\/\/([^/]+)/) || [, "other"])[1];
    if (host.includes("pps.whatsapp.net")) return "pps";
    if (host.includes("cdn.whatsapp.net") || host.includes("mmg.whatsapp.net")) return "media-cdn";
    if (host.endsWith("whatsapp.net") || host.endsWith("whatsapp.com")) return "whatsapp";
    return "other";
  };

  function report() {
    const imgs = [...document.querySelectorAll("img")];
    const big = imgs.filter((x) => x.width > 120 && x.height > 80);
    const bgEls = [...document.querySelectorAll('[style*="background-image"]')];
    const style = document.getElementById("tirai-style");
    return {
      tirai: {
        version: chrome.runtime.getManifest().version,
        style: !!style,
        styleInHead: !!style && style.parentNode === document.head,
        rules: style && style.sheet ? style.sheet.cssRules.length : 0,
        lockBase: !!document.getElementById("tirai-lock-base")
      },
      ids: ["app", "main", "side", "pane-side"].filter((id) => document.getElementById(id)),
      legacy: {
        messageIn: document.querySelectorAll(".message-in").length,
        messageOut: document.querySelectorAll(".message-out").length,
        dataId: document.querySelectorAll("[data-id]").length,
        prePlainText: document.querySelectorAll("[data-pre-plain-text]").length,
        copyable: document.querySelectorAll(".copyable-text").length
      },
      imageSources: imgs.reduce((acc, i) => ((acc[srcKind(i.src)] = (acc[srcKind(i.src)] || 0) + 1), acc), {}),
      bigImages: big.slice(0, 3).map((i) => ({
        src: srcKind(i.currentSrc || i.src),
        filter: getComputedStyle(i).filter,
        path: path(i)
      })),
      backgroundImages: bgEls.slice(0, 3).map((e) => ({
        src: srcKind((e.style.backgroundImage.match(/url\("?([^")]+)/) || [])[1] || ""),
        filter: getComputedStyle(e).filter,
        path: path(e, 6)
      })),
      videos: document.querySelectorAll("video").length,
      canvases: document.querySelectorAll("canvas").length,
      avatar: (() => {
        const i = imgs.find((x) => x.width <= 60 && x.width >= 28);
        return i ? { src: srcKind(i.src), path: path(i, 6) } : null;
      })(),
      input: (() => {
        const e = document.querySelector('[contenteditable="true"]');
        return e ? path(e, 6) : null;
      })(),
      titledSpan: (() => {
        const e = document.querySelector("span[title]");
        return e ? path(e, 8) : null;
      })(),
      messageText: (() => {
        const e = document.querySelector("[data-pre-plain-text], .copyable-text, span.selectable-text");
        return e ? path(e, 8) : null;
      })(),
      roles: [...new Set([...document.querySelectorAll("[role]")].map((e) => e.getAttribute("role")))]
    };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "tirai-diagnose") {
      try { sendResponse({ ok: true, report: report() }); }
      catch (err) { sendResponse({ ok: false, error: String(err) }); }
    }
  });
})();
