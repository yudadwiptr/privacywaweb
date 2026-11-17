/* PIN lock: hashing, lockout, and storage. Shared by popup, content script, and service worker.
 *
 * The PIN itself is never stored. We keep a PBKDF2-SHA256 hash + random salt in
 * chrome.storage.local (not synced), which web pages cannot read.
 */
(function (root) {
  const LOCK_KEY = "tiraiLock";
  const ACTIVITY_KEY = "tiraiActivity";
  const MAX_TRIES = 5;
  const ITERATIONS = 150000;

  const DEFAULTS = {
    hash: "",
    salt: "",
    iterations: ITERATIONS,
    pinLength: 0,
    autoLock: 300, // seconds of inactivity, 0 = never
    lockOnStartup: true,
    locked: false,
    failCount: 0,
    lockoutUntil: 0
  };

  /* chrome.storage.local inside the extension, localStorage when previewing the popup as a page */
  const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
  const area = hasChrome
    ? chrome.storage.local
    : {
        async get(key) {
          try { return { [key]: JSON.parse(localStorage.getItem(key)) }; } catch { return {}; }
        },
        async set(obj) {
          for (const [k, v] of Object.entries(obj)) {
            try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
          }
        }
      };

  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function derive(pin, salt, iterations) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: unb64(salt), iterations },
      key,
      256
    );
    return b64(bits);
  }

  function sameString(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  function withDefaults(saved) {
    return Object.assign({}, DEFAULTS, saved || {});
  }

  async function load() {
    const data = await area.get(LOCK_KEY);
    return withDefaults(data[LOCK_KEY]);
  }

  async function save(patch) {
    const next = Object.assign(await load(), patch);
    await area.set({ [LOCK_KEY]: next });
    return next;
  }

  const isValidPin = (pin) => /^\d{4,8}$/.test(pin);
  const hasPin = (lock) => Boolean(lock.hash);

  async function setPin(pin) {
    if (!isValidPin(pin)) throw new Error("PIN harus 4 sampai 8 angka.");
    const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await derive(pin, salt, ITERATIONS);
    await touch();
    return save({ hash, salt, iterations: ITERATIONS, pinLength: pin.length, locked: false, failCount: 0, lockoutUntil: 0 });
  }

  async function removePin() {
    return save({ hash: "", salt: "", pinLength: 0, locked: false, failCount: 0, lockoutUntil: 0 });
  }

  /* Check a PIN, counting failures. Every 5th miss starts a cooldown that doubles each time (max 15 min). */
  async function attempt(pin) {
    const lock = await load();
    const now = Date.now();
    if (!hasPin(lock)) return { ok: false, reason: "nopin" };
    if (lock.lockoutUntil > now) return { ok: false, reason: "cooldown", until: lock.lockoutUntil };

    const ok = sameString(await derive(pin, lock.salt, lock.iterations), lock.hash);
    if (ok) {
      await save({ failCount: 0, lockoutUntil: 0 });
      return { ok: true };
    }

    const failCount = lock.failCount + 1;
    const patch = { failCount };
    if (failCount % MAX_TRIES === 0) {
      const round = failCount / MAX_TRIES; // 1, 2, 3...
      patch.lockoutUntil = now + Math.min(30000 * 2 ** (round - 1), 15 * 60000);
    }
    await save(patch);
    return patch.lockoutUntil
      ? { ok: false, reason: "cooldown", until: patch.lockoutUntil }
      : { ok: false, reason: "wrong", left: MAX_TRIES - (failCount % MAX_TRIES) };
  }

  async function lockNow() {
    const lock = await load();
    if (!hasPin(lock)) return lock;
    return save({ locked: true });
  }

  async function unlock(pin) {
    const res = await attempt(pin);
    if (res.ok) {
      await touch();
      await save({ locked: false });
    }
    return res;
  }

  async function touch() {
    await area.set({ [ACTIVITY_KEY]: Date.now() });
  }

  async function lastActivity() {
    const data = await area.get(ACTIVITY_KEY);
    return Number(data[ACTIVITY_KEY]) || 0;
  }

  const fmtWait = (ms) => {
    const s = Math.ceil(ms / 1000);
    return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} menit` : `${s} detik`;
  };

  root.TIRAI_LOCK = {
    LOCK_KEY, ACTIVITY_KEY, MAX_TRIES, DEFAULTS,
    withDefaults, load, save, isValidPin, hasPin,
    setPin, removePin, attempt, lockNow, unlock, touch, lastActivity, fmtWait
  };
})(typeof self !== "undefined" ? self : window);
