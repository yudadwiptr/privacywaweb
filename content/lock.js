/* Tirai lock screen for web.whatsapp.com.
 *
 * When locked, WhatsApp's #app is hidden and a full-screen PIN screen sits on top.
 * Lock triggers: "Kunci sekarang" (popup or Alt+Shift+L), inactivity, and browser restart.
 */
(function () {
  const L = self.TIRAI_LOCK;
  const html = document.documentElement;
  const HINT = "tirai-lock-hint"; // sync flag on this origin so we can hide WA before storage answers
  const ATTR = "data-tirai-locked";

  /* 1. Hide WhatsApp immediately if a lock is configured, until we know the real state. */
  const base = document.createElement("style");
  base.id = "tirai-lock-base";
  base.textContent = `html[${ATTR}] #app{visibility:hidden !important;}html[${ATTR}] body{overflow:hidden !important;}`;
  html.appendChild(base);
  let hinted = false;
  try { hinted = localStorage.getItem(HINT) === "1"; } catch {}
  if (hinted) html.setAttribute(ATTR, "");

  let lock = L.withDefaults();
  let theme = "system";
  let lastSeen = Date.now();
  let timer = null;
  let ui = null;

  /* 2. Lock screen UI, in a closed shadow root so WhatsApp's CSS can't touch it. */
  const CSS = `
  :host { all: initial; }
  .screen {
    --mist:#edf0f6; --paper:#fff; --ink:#19202e; --slate:#687189; --hair:#dfe3ec;
    --velvet:#4a3ad8; --danger:#c2334d;
    --fold-a: rgba(74,58,216,.10); --fold-b: rgba(74,58,216,.03);
    position: fixed; inset: 0; z-index: 2147483647;
    display: grid; place-items: center;
    background:
      repeating-linear-gradient(90deg, var(--fold-a) 0, var(--fold-b) 40px, var(--fold-a) 80px),
      var(--mist);
    color: var(--ink);
    font: 400 14px/1.5 "Plus Jakarta Sans", "Segoe UI", system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    transform: translateY(0);
    transition: transform .6s cubic-bezier(.65,0,.25,1);
  }
  .screen.dark {
    --mist:#11131a; --paper:#1a1d27; --ink:#e9ebf3; --slate:#8f98ae; --hair:#2a2e3b;
    --velvet:#9b8fff; --danger:#ff7a8f;
    --fold-a: rgba(155,143,255,.08); --fold-b: rgba(155,143,255,.02);
  }
  .screen::before {
    content:""; position:absolute; top:0; left:0; right:0; height:6px; background: var(--velvet);
  }
  .screen.leaving, .screen.entering { transform: translateY(-101%); }
  .card {
    width: min(360px, calc(100vw - 32px));
    background: var(--paper); border-radius: 22px; padding: 32px 28px 22px;
    box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 24px 60px -24px rgba(25,32,46,.35);
    text-align: center;
  }
  .mark { width: 52px; height: 52px; display:block; margin: 0 auto 16px; }
  h1 { margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -.02em; }
  .sub { margin: 6px 0 22px; color: var(--slate); font-size: 13.5px; }
  .pin { position: relative; display: flex; justify-content: center; gap: 10px; margin-bottom: 14px; }
  .slot {
    width: 38px; height: 46px; border-radius: 12px; border: 1.5px solid var(--hair);
    display: grid; place-items: center; background: var(--mist);
    transition: border-color .15s, background .15s;
  }
  .slot.filled::after { content:""; width: 11px; height: 11px; border-radius: 50%; background: var(--ink); }
  .slot.next { border-color: var(--velvet); }
  .pin input {
    position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0;
    border: 0; padding: 0; margin: 0; font-size: 16px; cursor: text; caret-color: transparent;
  }
  .pin input:focus-visible { outline: none; }
  .pin:focus-within .slot.next { box-shadow: 0 0 0 3px color-mix(in srgb, var(--velvet) 25%, transparent); }
  .pin.shake { animation: shake .38s; }
  .pin.shake .slot { border-color: var(--danger); }
  .pin.busy .slot { opacity: .5; }
  @keyframes shake { 20%{transform:translateX(-8px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(3px)} }
  .msg { min-height: 20px; margin: 0 0 6px; font-size: 13px; color: var(--slate); }
  .msg.err { color: var(--danger); font-weight: 600; }
  .foot { margin: 14px 0 0; padding-top: 14px; border-top: 1px solid var(--hair); font-size: 12px; color: var(--slate); }
  @media (prefers-reduced-motion: reduce) { .screen, .pin.shake { transition: none; animation: none; } }
  `;

  const MARK = `<svg class="mark" viewBox="0 0 512 512" aria-hidden="true"><defs><linearGradient id="tirai-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6f68e6"/><stop offset=".55" stop-color="#4639c4"/><stop offset="1" stop-color="#211d66"/></linearGradient><linearGradient id="tirai-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient><radialGradient id="tirai-glow" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><linearGradient id="tirai-rod" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e4e6f3"/><stop offset="1" stop-color="#a9adcb"/></linearGradient><linearGradient id="tirai-slat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eef0fa"/><stop offset="1" stop-color="#a7aed8"/></linearGradient><linearGradient id="tirai-rodshadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1850" stop-opacity=".35"/><stop offset="1" stop-color="#1b1850" stop-opacity="0"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#tirai-bg)"/><rect width="512" height="512" rx="112" fill="url(#tirai-sheen)"/><ellipse cx="256" cy="282" rx="190" ry="170" fill="url(#tirai-glow)"/><g fill="url(#tirai-slat)" fill-opacity=".94"><path d="M110 134h31v262l-31-8z"/><path d="M139 134h31v270l-31-8z"/><path d="M168 134h31v264l-31-8z"/><path d="M197 134h31v272l-31-8z"/><path d="M226 134h31v266l-31-8z"/><path d="M255 134h31v274l-31-8z"/><path d="M284 134h31v266l-31-8z"/><path d="M313 134h31v272l-31-8z"/><path d="M342 134h31v264l-31-8z"/><path d="M371 134h31v270l-31-8z"/></g><rect x="104" y="128" width="304" height="26" fill="url(#tirai-rodshadow)"/><rect x="90" y="96" width="332" height="36" rx="18" fill="url(#tirai-rod)"/><rect x="104" y="101" width="304" height="7" rx="3.5" fill="#fff" fill-opacity=".9"/></svg>`;

  function buildUi() {
    const host = document.createElement("tirai-lock");
    const root = host.attachShadow({ mode: "closed" });
    root.innerHTML = `<style>${CSS}</style>
      <div class="screen" role="dialog" aria-modal="true" aria-labelledby="t">
        <div class="card">
          ${MARK}
          <h1 id="t">WhatsApp Web terkunci</h1>
          <p class="sub">Masukkan PIN Tirai untuk melanjutkan</p>
          <div class="pin">
            <div class="slots"></div>
            <input type="password" inputmode="numeric" autocomplete="off" aria-label="PIN" />
          </div>
          <p class="msg" aria-live="polite"></p>
          <p class="foot">Lupa PIN? Hapus lalu pasang ulang ekstensi Tirai untuk mengatur PIN baru.</p>
        </div>
      </div>`;
    const el = {
      host,
      screen: root.querySelector(".screen"),
      pin: root.querySelector(".pin"),
      slots: root.querySelector(".slots"),
      input: root.querySelector("input"),
      msg: root.querySelector(".msg"),
      countdown: null
    };
    el.slots.style.display = "contents";
    el.input.addEventListener("input", () => onType(el));
    el.screen.addEventListener("mousedown", (e) => {
      if (e.target !== el.input) { e.preventDefault(); el.input.focus(); }
    });
    return el;
  }

  function paintSlots(el) {
    const n = lock.pinLength || 6;
    const len = el.input.value.length;
    if (el.slots.childElementCount !== n) {
      el.slots.innerHTML = Array.from({ length: n }, () => '<span class="slot"></span>').join("");
      el.input.maxLength = n;
    }
    [...el.slots.children].forEach((s, i) => {
      s.classList.toggle("filled", i < len);
      s.classList.toggle("next", i === len);
    });
  }

  function say(el, text, isErr) {
    el.msg.textContent = text;
    el.msg.classList.toggle("err", Boolean(isErr));
  }

  function startCooldown(el, until) {
    clearInterval(el.countdown);
    el.input.disabled = true;
    const tick = () => {
      const left = until - Date.now();
      if (left <= 0) {
        clearInterval(el.countdown);
        el.input.disabled = false;
        say(el, "Silakan coba lagi.");
        el.input.focus();
        return;
      }
      say(el, `Terlalu banyak percobaan. Coba lagi dalam ${L.fmtWait(left)}.`, true);
    };
    tick();
    el.countdown = setInterval(tick, 1000);
  }

  async function onType(el) {
    el.input.value = el.input.value.replace(/\D/g, "").slice(0, lock.pinLength || 8);
    paintSlots(el);
    if (el.input.value.length < lock.pinLength) return;

    el.pin.classList.add("busy");
    el.input.disabled = true;
    const res = await L.unlock(el.input.value);
    el.pin.classList.remove("busy");
    el.input.value = "";
    paintSlots(el);

    if (res.ok) return; // storage change hides the screen in every tab
    el.input.disabled = false;
    el.pin.classList.remove("shake");
    void el.pin.offsetWidth;
    el.pin.classList.add("shake");
    if (res.reason === "cooldown") startCooldown(el, res.until);
    else say(el, `PIN salah. Sisa ${res.left} percobaan.`, true);
    el.input.focus();
  }

  function isDark() {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function showLock() {
    html.setAttribute(ATTR, "");
    if (!ui) ui = buildUi();
    ui.screen.classList.toggle("dark", isDark());
    ui.screen.classList.remove("leaving");
    if (!ui.host.isConnected) {
      // Drop the curtain in. Force a reflow instead of rAF: rAF doesn't run in background tabs.
      ui.screen.classList.add("entering");
      html.appendChild(ui.host);
      void ui.screen.offsetHeight;
      ui.screen.classList.remove("entering");
    }
    ui.input.value = "";
    ui.pin.classList.remove("shake");
    paintSlots(ui);
    if (lock.lockoutUntil > Date.now()) startCooldown(ui, lock.lockoutUntil);
    else { ui.input.disabled = false; say(ui, ""); }
    setTimeout(() => ui && ui.input.focus(), 50);
  }

  function hideLock() {
    if (!ui || !ui.host.isConnected) { html.removeAttribute(ATTR); return; }
    clearInterval(ui.countdown);
    html.removeAttribute(ATTR);
    ui.screen.classList.add("leaving");
    const host = ui.host;
    const done = () => {
      if (html.hasAttribute(ATTR)) return; // locked again mid-animation
      host.remove();
      ui.screen.classList.remove("leaving");
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) done();
    else setTimeout(done, 620);
  }

  /* Keep WhatsApp's own keyboard shortcuts and typing out while locked. */
  function guardKeys(e) {
    if (!html.hasAttribute(ATTR) || !ui || !ui.host.isConnected) return;
    if (e.composedPath().includes(ui.host)) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    ui.input.focus();
  }
  ["keydown", "keypress", "keyup", "paste"].forEach((t) => window.addEventListener(t, guardKeys, true));

  /* 3. Auto-lock on inactivity */
  function schedule() {
    clearTimeout(timer);
    if (!L.hasPin(lock) || lock.locked || !lock.autoLock) return;
    const wait = Math.max(lastSeen + lock.autoLock * 1000 - Date.now(), 1000);
    timer = setTimeout(checkIdle, wait);
  }

  async function checkIdle() {
    if (!L.hasPin(lock) || lock.locked || !lock.autoLock) return;
    lastSeen = Math.max(lastSeen, await L.lastActivity()); // another WA tab may have been active
    if (Date.now() - lastSeen >= lock.autoLock * 1000) await L.lockNow();
    else schedule();
  }

  let lastWrite = 0;
  function onActivity() {
    if (!L.hasPin(lock) || lock.locked) return;
    const now = Date.now();
    // Coming back after a long sleep: lock before this movement counts as activity.
    if (lock.autoLock && now - lastSeen >= lock.autoLock * 1000) { checkIdle(); return; }
    lastSeen = now;
    if (now - lastWrite > 10000) { lastWrite = now; L.touch(); }
    schedule();
  }
  ["mousemove", "mousedown", "keydown", "wheel", "touchstart"].forEach((t) =>
    window.addEventListener(t, onActivity, { passive: true, capture: true })
  );
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkIdle(); });

  /* 4. State */
  function apply() {
    try {
      if (L.hasPin(lock)) localStorage.setItem(HINT, "1");
      else localStorage.removeItem(HINT);
    } catch {}
    if (L.hasPin(lock) && lock.locked) showLock();
    else hideLock();
    schedule();
  }

  async function init() {
    const [saved, settings, seen] = await Promise.all([
      L.load(),
      chrome.storage.sync.get(self.TIRAI.STORAGE_KEY),
      L.lastActivity()
    ]);
    lock = saved;
    theme = self.TIRAI.withDefaults(settings[self.TIRAI.STORAGE_KEY]).theme;
    lastSeen = seen || Date.now();
    // Tab opened after the idle window passed (e.g. WhatsApp was closed for a while): start locked.
    if (L.hasPin(lock) && !lock.locked && lock.autoLock && Date.now() - lastSeen >= lock.autoLock * 1000) {
      lock = await L.lockNow();
    } else if (L.hasPin(lock) && !lock.locked) {
      lastSeen = Date.now();
    }
    apply();
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[L.LOCK_KEY]) {
      const prev = lock;
      lock = L.withDefaults(changes[L.LOCK_KEY].newValue);
      if (prev.locked && !lock.locked) lastSeen = Date.now();
      if (prev.locked !== lock.locked || prev.hash !== lock.hash || prev.pinLength !== lock.pinLength) apply();
      else schedule();
    }
    if (area === "local" && changes[L.ACTIVITY_KEY]) {
      lastSeen = Math.max(lastSeen, Number(changes[L.ACTIVITY_KEY].newValue) || 0);
    }
    if (area === "sync" && changes[self.TIRAI.STORAGE_KEY]) {
      theme = self.TIRAI.withDefaults(changes[self.TIRAI.STORAGE_KEY].newValue).theme;
      if (ui) ui.screen.classList.toggle("dark", isDark());
    }
  });

  /* WhatsApp re-renders parts of the document; put the hiding style, the locked flag,
     and the lock screen back if any of them got removed while locked. */
  setInterval(() => {
    if (!base.isConnected) (document.head || html).appendChild(base);
    if (!L.hasPin(lock) || !lock.locked) return;
    if (!html.hasAttribute(ATTR)) html.setAttribute(ATTR, "");
    if (ui && !ui.host.isConnected) html.appendChild(ui.host);
  }, 500);

  init();
})();
