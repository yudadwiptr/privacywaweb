/* Shared defaults + helpers. Loaded by popup, content script, and service worker. */
(function (root) {
  const DEFAULTS = {
    enabled: true,
    blur: 8, // px
    items: {
      messages: { on: false, hover: true },
      preview: { on: true, hover: true },
      input: { on: true, hover: true },
      media: { on: true, hover: true },
      gallery: { on: true, hover: true },
      avatars: { on: false, hover: true },
      names: { on: false, hover: true }
    },
    idle: { on: false, seconds: 60 },
    appHover: false,
    noTransition: false,
    theme: "system" // system | light | dark
  };

  function merge(base, extra) {
    if (Array.isArray(base) || typeof base !== "object" || base === null) {
      return extra === undefined ? base : extra;
    }
    const out = {};
    for (const key of Object.keys(base)) {
      out[key] = merge(base[key], extra ? extra[key] : undefined);
    }
    return out;
  }

  root.TIRAI = {
    STORAGE_KEY: "tirai",
    DEFAULTS,
    withDefaults(saved) {
      return merge(DEFAULTS, saved || {});
    }
  };
})(typeof self !== "undefined" ? self : window);
