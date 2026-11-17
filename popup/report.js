/* "Salin laporan": asks the WhatsApp tab for a structure-only report and copies it. */
(function () {
  const btn = document.getElementById("reportBtn");
  const msg = document.getElementById("reportMsg");
  const say = (text, isErr) => {
    msg.textContent = text;
    msg.classList.toggle("err", Boolean(isErr));
  };

  btn.addEventListener("click", async () => {
    if (typeof chrome === "undefined" || !chrome.tabs) {
      say("Tombol ini hanya bekerja di dalam ekstensi.", true);
      return;
    }
    btn.disabled = true;
    say("Mengambil laporan…");
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const res = await chrome.tabs.sendMessage(tab.id, { type: "tirai-diagnose" });
      if (!res || !res.ok) throw new Error(res ? res.error : "no response");
      await navigator.clipboard.writeText(JSON.stringify(res.report, null, 1));
      say("Laporan tersalin. Tempel di GitHub Issues atau kirim ke pengembang. Isinya hanya struktur halaman, tanpa isi chat.");
    } catch (err) {
      say("Tirai tidak berjalan di tab ini. Buka popup dari tab web.whatsapp.com. Kalau masih gagal, tutup tab WhatsApp lalu buka lagi.", true);
    } finally {
      btn.disabled = false;
    }
  });
})();
