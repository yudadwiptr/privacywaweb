/* Tirai: WhatsApp Web structure check.
 *
 * Paste into DevTools Console on web.whatsapp.com (with a chat open that has a photo).
 * It copies a short JSON report to the clipboard. The report contains only tag names,
 * ids, roles, data-* attribute NAMES, and a few class names: no message text,
 * names, phone numbers, or image addresses.
 */
(() => {
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
  const srcKind = (src) =>
    src.startsWith("blob:") ? "blob" : src.startsWith("data:") ? src.slice(0, 15) : (src.match(/^https?:\/\/([^/]+)/) || [, "?"])[1].replace(/^[^.]*\d[^.]*\./, "*.");

  const imgs = [...document.querySelectorAll("img")];
  const report = {
    tirai: { style: !!document.getElementById("tirai-style"), lock: !!document.getElementById("tirai-lock-base") },
    ids: ["app", "main", "side", "pane-side"].filter((id) => document.getElementById(id)),
    legacy: {
      messageIn: document.querySelectorAll(".message-in").length,
      messageOut: document.querySelectorAll(".message-out").length,
      dataId: document.querySelectorAll("[data-id]").length,
      prePlainText: document.querySelectorAll("[data-pre-plain-text]").length,
      copyable: document.querySelectorAll(".copyable-text").length
    },
    imageSources: imgs.reduce((acc, i) => ((acc[srcKind(i.src)] = (acc[srcKind(i.src)] || 0) + 1), acc), {}),
    bigImage: (() => {
      const i = imgs.find((x) => x.width > 120 && x.height > 80);
      return i ? path(i) : null;
    })(),
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
    roles: [...new Set([...document.querySelectorAll("[role]")].map((e) => e.getAttribute("role")))],
    videos: document.querySelectorAll("video").length
  };
  const json = JSON.stringify(report, null, 1);
  try { copy(json); console.log("Laporan Tirai sudah disalin ke clipboard."); } catch { console.log(json); }
  return report;
})();
