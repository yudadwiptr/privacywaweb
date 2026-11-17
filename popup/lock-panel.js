/* "Kunci layar" panel in the popup: set, change, or remove the PIN, lock now, auto-lock options. */
(function () {
  const L = window.TIRAI_LOCK;
  const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
  const panel = document.getElementById("lockPanel");
  const lockBtn = document.getElementById("lockBtn");

  const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON_LOCK = svg('<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2"/>');
  const ICON_OPEN = svg('<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7"/>');

  const AUTO = [
    [60, "1 menit"], [300, "5 menit"], [900, "15 menit"], [1800, "30 menit"], [3600, "1 jam"], [0, "Tidak pernah"]
  ];
  const autoLabel = (s) => (AUTO.find(([v]) => v === s) || [0, `${Math.round(s / 60)} menit`])[1];

  let lock = L.withDefaults();
  let mode = null; // null | "set" | "change" | "off"

  const pinInput = (name, label, hint) => `
    <label class="field"><span>${label}</span>
      <input name="${name}" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8"
        autocomplete="off" placeholder="${hint || ""}" required />
    </label>`;

  function formFor(m) {
    if (m === "set") {
      return `<form class="pin-form" data-form="set">
        ${pinInput("pin", "PIN baru", "4 sampai 8 angka")}
        ${pinInput("again", "Ulangi PIN")}
        <p class="form-msg" aria-live="polite"></p>
        <div class="form-actions">
          <button type="button" class="btn ghost" data-act="cancel">Batal</button>
          <button type="submit" class="btn primary">Simpan PIN</button>
        </div></form>`;
    }
    if (m === "change") {
      return `<form class="pin-form" data-form="change">
        ${pinInput("old", "PIN sekarang")}
        ${pinInput("pin", "PIN baru", "4 sampai 8 angka")}
        ${pinInput("again", "Ulangi PIN baru")}
        <p class="form-msg" aria-live="polite"></p>
        <div class="form-actions">
          <button type="button" class="btn ghost" data-act="cancel">Batal</button>
          <button type="submit" class="btn primary">Ganti PIN</button>
        </div></form>`;
    }
    if (m === "off") {
      return `<form class="pin-form" data-form="off">
        <p class="form-note">Tanpa PIN, siapa pun yang memakai komputer ini bisa membuka WhatsApp Web.</p>
        ${pinInput("old", "PIN sekarang")}
        <p class="form-msg" aria-live="polite"></p>
        <div class="form-actions">
          <button type="button" class="btn ghost" data-act="cancel">Batal</button>
          <button type="submit" class="btn danger">Matikan kunci</button>
        </div></form>`;
    }
    return "";
  }

  function render() {
    const on = L.hasPin(lock);
    lockBtn.hidden = !on;
    lockBtn.innerHTML = ICON_LOCK;
    lockBtn.disabled = lock.locked;
    lockBtn.title = lock.locked ? "WhatsApp Web sedang terkunci" : "Kunci sekarang";

    if (!on) {
      panel.innerHTML = `
        <div class="row${mode === "set" ? " open" : ""}">
          <div class="row-main">
            <span class="ico">${ICON_OPEN}</span>
            <div class="row-text"><strong>Kunci dengan PIN</strong>
              <span>Minta PIN sebelum WhatsApp Web bisa dilihat</span></div>
            ${mode ? "" : '<button type="button" class="btn pill" data-act="set">Atur PIN</button>'}
          </div>
          ${formFor(mode)}
        </div>`;
    } else {
      const status = lock.locked
        ? "Sedang terkunci. Masukkan PIN di tab WhatsApp."
        : lock.autoLock
          ? `Terkunci otomatis setelah ${autoLabel(lock.autoLock)} tanpa aktivitas`
          : "Aktif. Kunci manual dengan tombol di kanan.";
      const opts = AUTO.map(([v, t]) => `<option value="${v}"${v === lock.autoLock ? " selected" : ""}>${t}</option>`).join("");
      panel.innerHTML = `
        <div class="row is-on">
          <div class="row-main">
            <span class="ico">${ICON_LOCK}</span>
            <div class="row-text"><strong>Kunci dengan PIN</strong><span>${status}</span></div>
            <button type="button" class="btn pill primary" data-act="lock"${lock.locked ? " disabled" : ""}>
              ${lock.locked ? "Terkunci" : "Kunci"}</button>
          </div>
        </div>
        <div class="row">
          <label class="row-main compact"><span class="row-text"><strong>Kunci setelah tidak aktif</strong></span>
            <select data-auto>${opts}</select></label>
        </div>
        <div class="row">
          <label class="row-main compact" for="lockStartup"><span class="row-text"><strong>Kunci saat browser dibuka</strong></span>
            <span class="switch"><input type="checkbox" id="lockStartup"${lock.lockOnStartup ? " checked" : ""} />
            <span class="track"><span class="thumb"></span></span></span></label>
        </div>
        <div class="row${mode ? " open" : ""}">
          ${mode ? formFor(mode) : `
          <div class="row-main compact links">
            <button type="button" class="link" data-act="change">Ganti PIN</button>
            <button type="button" class="link danger" data-act="off">Matikan kunci</button>
          </div>`}
        </div>`;
    }

    wire();
  }

  function wire() {
    panel.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => act(b.dataset.act)));
    const auto = panel.querySelector("[data-auto]");
    if (auto) auto.addEventListener("change", async () => { lock = await L.save({ autoLock: Number(auto.value) }); render(); });
    const startup = panel.querySelector("#lockStartup");
    if (startup) startup.addEventListener("change", async () => { lock = await L.save({ lockOnStartup: startup.checked }); });

    const form = panel.querySelector(".pin-form");
    if (form) {
      form.querySelectorAll("input").forEach((i) => i.addEventListener("input", () => { i.value = i.value.replace(/\D/g, ""); }));
      form.addEventListener("submit", (e) => { e.preventDefault(); submit(form); });
      const first = form.querySelector("input");
      if (first) first.focus();
    }
  }

  async function act(what) {
    if (what === "cancel") { mode = null; return render(); }
    if (what === "lock") { lock = await L.lockNow(); return render(); }
    mode = what;
    render();
  }

  function failText(res) {
    if (res.reason === "cooldown") return `Terlalu banyak percobaan. Coba lagi dalam ${L.fmtWait(res.until - Date.now())}.`;
    return `PIN sekarang salah. Sisa ${res.left} percobaan.`;
  }

  async function submit(form) {
    const msg = form.querySelector(".form-msg");
    const v = (n) => (form.elements[n] ? form.elements[n].value : "");
    const fail = (t) => { msg.textContent = t; msg.classList.add("err"); };
    const kind = form.dataset.form;
    const btn = form.querySelector('[type="submit"]');

    if (kind !== "off") {
      if (!L.isValidPin(v("pin"))) return fail("PIN harus 4 sampai 8 angka.");
      if (v("pin") !== v("again")) return fail("Kedua PIN baru tidak sama.");
    }

    btn.disabled = true;
    try {
      if (kind === "change" || kind === "off") {
        const res = await L.attempt(v("old"));
        if (!res.ok) { btn.disabled = false; return fail(failText(res)); }
      }
      if (kind === "off") lock = await L.removePin();
      else lock = await L.setPin(v("pin"));
      mode = null;
      render();
    } catch (err) {
      btn.disabled = false;
      fail(err.message || "Gagal menyimpan PIN.");
    }
  }

  lockBtn.addEventListener("click", () => act("lock"));

  L.load().then((saved) => { lock = saved; render(); });

  if (hasChrome) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[L.LOCK_KEY]) return;
      const next = L.withDefaults(changes[L.LOCK_KEY].newValue);
      // failed attempts only bump failCount: don't wipe an open form for that
      const relevant = ["hash", "locked", "autoLock", "lockOnStartup"].some((k) => next[k] !== lock[k]);
      lock = next;
      if (relevant && !mode) render();
    });
  }
})();
