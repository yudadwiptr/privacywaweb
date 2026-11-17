(function () {
  const { STORAGE_KEY, withDefaults } = window.TIRAI;
  const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync;

  /* Storage: chrome.storage.sync inside the extension, localStorage when the
     popup is opened as a plain file for previewing. */
  const store = {
    async get() {
      if (hasChrome) {
        const data = await chrome.storage.sync.get(STORAGE_KEY);
        return withDefaults(data[STORAGE_KEY]);
      }
      try { return withDefaults(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
      catch { return withDefaults(); }
    },
    async set(value) {
      if (hasChrome) return chrome.storage.sync.set({ [STORAGE_KEY]: value });
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch {}
    }
  };

  const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    messages: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/>'),
    preview: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 13h6"/>'),
    input: svg('<rect x="3" y="7" width="18" height="10" rx="3"/><path d="M7 12h.01M11 12h.01M15 12h2"/>'),
    media: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-8 9"/>'),
    gallery: svg('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>'),
    avatars: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.2a6.5 6.5 0 0 1 11 0"/>'),
    names: svg('<path d="M4 7V5h16v2M12 5v14M9 19h6"/>'),
    idle: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    appHover: svg('<path d="m5 3 6 16 2.2-6.3L19.5 10 5 3Z"/>'),
    noTransition: svg('<path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z"/>'),
    chevron: svg('<path d="m6 9 6 6 6-6"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>'),
    auto: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/>')
  };

  const GROUPS = [
    {
      title: "Percakapan",
      rows: [
        { id: "messages", label: "Isi pesan", hint: "Semua gelembung chat di ruang obrolan" },
        { id: "preview", label: "Pratinjau pesan terakhir", hint: "Cuplikan pesan di daftar chat" },
        { id: "input", label: "Kolom ketik", hint: "Teks yang sedang kamu tulis" }
      ]
    },
    {
      title: "Media",
      rows: [
        { id: "media", label: "Foto dan video di chat", hint: "Gambar, video, dan stiker yang dikirim" },
        { id: "gallery", label: "Galeri media", hint: "Media, tautan, dan dokumen di info kontak" }
      ]
    },
    {
      title: "Identitas",
      rows: [
        { id: "avatars", label: "Foto profil", hint: "Kontak, grup, dan dirimu sendiri" },
        { id: "names", label: "Nama kontak dan grup", hint: "Di daftar chat dan judul obrolan" }
      ]
    },
    {
      title: "Perilaku",
      rows: [
        { id: "idle", label: "Tutup saat ditinggal", hint: "Samarkan seluruh layar ketika tidak ada aktivitas", kind: "idle" },
        { id: "appHover", label: "Buka saat kursor di WhatsApp", hint: "Tirai hanya menutup ketika kursor keluar dari tab", kind: "flag" },
        { id: "noTransition", label: "Tanpa animasi", hint: "Blur muncul dan hilang seketika", kind: "flag" }
      ]
    }
  ];

  const IDLE_CHOICES = [15, 30, 60, 120, 300, 600];
  const fmtIdle = (s) => (s < 60 ? `${s} detik` : `${s / 60} menit`);

  const $ = (sel) => document.querySelector(sel);
  let state;

  function save() {
    store.set(state);
    paint();
  }

  function isOn(row) {
    if (row.kind === "flag") return state[row.id];
    if (row.kind === "idle") return state.idle.on;
    return state.items[row.id].on;
  }

  function setOn(row, value) {
    if (row.kind === "flag") state[row.id] = value;
    else if (row.kind === "idle") state.idle.on = value;
    else state.items[row.id].on = value;
  }

  function drawerFor(row) {
    if (row.kind === "flag") return "";
    if (row.kind === "idle") {
      const opts = IDLE_CHOICES.map(
        (s) => `<option value="${s}"${s === state.idle.seconds ? " selected" : ""}>${fmtIdle(s)}</option>`
      ).join("");
      return `<label class="opt"><span>Tutup setelah tidak aktif</span><select data-idle>${opts}</select></label>`;
    }
    const hover = state.items[row.id].hover;
    return `<label class="opt"><span>Lihat saat kursor di atasnya</span>
      <span class="switch small"><input type="checkbox" data-hover="${row.id}"${hover ? " checked" : ""} />
      <span class="track"><span class="thumb"></span></span></span></label>`;
  }

  function render() {
    const root = $("#groups");
    root.innerHTML = GROUPS.map((g) => `
      <section class="group">
        <h3>${g.title}</h3>
        <div class="list">
          ${g.rows.map((r) => {
            const drawer = drawerFor(r);
            return `
            <div class="row" data-row="${r.id}">
              <div class="row-main">
                <span class="ico">${ICONS[r.id]}</span>
                <label class="row-text" for="t-${r.id}">
                  <strong>${r.label}</strong><span>${r.hint}</span>
                </label>
                ${drawer ? `<button class="more" type="button" aria-expanded="false" aria-controls="d-${r.id}" aria-label="Opsi ${r.label}">${ICONS.chevron}</button>` : ""}
                <label class="switch">
                  <input type="checkbox" id="t-${r.id}" />
                  <span class="track"><span class="thumb"></span></span>
                </label>
              </div>
              ${drawer ? `<div class="drawer" id="d-${r.id}"><div>${drawer}</div></div>` : ""}
            </div>`;
          }).join("")}
        </div>
      </section>`).join("");

    const rowsById = Object.fromEntries(GROUPS.flatMap((g) => g.rows).map((r) => [r.id, r]));

    root.querySelectorAll(".row").forEach((el) => {
      const row = rowsById[el.dataset.row];
      const toggle = el.querySelector(`#t-${row.id}`);
      toggle.addEventListener("change", () => { setOn(row, toggle.checked); save(); });

      const more = el.querySelector(".more");
      if (more) {
        more.addEventListener("click", () => {
          const open = el.classList.toggle("open");
          more.setAttribute("aria-expanded", String(open));
        });
      }
    });

    root.querySelectorAll("[data-hover]").forEach((input) => {
      input.addEventListener("change", () => { state.items[input.dataset.hover].hover = input.checked; save(); });
    });
    const idleSel = root.querySelector("[data-idle]");
    if (idleSel) idleSel.addEventListener("change", () => { state.idle.seconds = Number(idleSel.value); save(); });
  }

  const THEMES = ["system", "light", "dark"];
  const THEME_LABEL = { system: "ikuti sistem", light: "terang", dark: "gelap" };

  function paint() {
    document.body.classList.toggle("on", state.enabled);
    $("#enabled").checked = state.enabled;
    $("#statusTitle").textContent = state.enabled ? "Tirai tertutup" : "Tirai terbuka";
    $("#statusSub").textContent = state.enabled
      ? "Chat disamarkan di web.whatsapp.com"
      : "WhatsApp Web tampil apa adanya";

    const blur = $("#blur");
    blur.value = state.blur;
    $("#blurOut").textContent = `${state.blur} px`;
    blur.style.setProperty("--fill", `${((state.blur - blur.min) / (blur.max - blur.min)) * 100}%`);

    GROUPS.flatMap((g) => g.rows).forEach((r) => {
      const on = isOn(r);
      const el = document.querySelector(`[data-row="${r.id}"]`);
      el.classList.toggle("is-on", on);
      el.querySelector(`#t-${r.id}`).checked = on;
    });

    if (state.theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", state.theme);
    const btn = $("#themeBtn");
    btn.innerHTML = state.theme === "light" ? ICONS.sun : state.theme === "dark" ? ICONS.moon : ICONS.auto;
    btn.title = `Tema: ${THEME_LABEL[state.theme]}`;
    btn.setAttribute("aria-label", `Ganti tema, sekarang ${THEME_LABEL[state.theme]}`);
  }

  async function init() {
    state = await store.get();
    render();
    paint();

    $("#enabled").addEventListener("change", (e) => { state.enabled = e.target.checked; save(); });
    $("#blur").addEventListener("input", (e) => { state.blur = Number(e.target.value); save(); });
    $("#themeBtn").addEventListener("click", () => {
      state.theme = THEMES[(THEMES.indexOf(state.theme) + 1) % THEMES.length];
      save();
    });

    if (hasChrome) {
      $("#ver").textContent = chrome.runtime.getManifest().version;
      // keep in sync if the keyboard shortcut flips the curtain while the popup is open
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "sync" && changes[STORAGE_KEY]) {
          state = withDefaults(changes[STORAGE_KEY].newValue);
          paint();
        }
      });
    }
  }

  init();
})();
