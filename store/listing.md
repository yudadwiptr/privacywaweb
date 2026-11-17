# Store listing: Tirai

Copy-paste material for Chrome Web Store, Microsoft Edge Add-ons, and Firefox Add-ons (AMO).
Images are in `store/images/` (regenerate with `tools/render-promo.ps1`).

| Asset | File | Required by |
| --- | --- | --- |
| Store icon 128×128 | `icons/icon128.png` | Chrome, Edge |
| Screenshots 1280×800 | `store/images/screenshot-*.png` | Chrome (1–5), Edge, AMO |
| Small promo tile 440×280 | `store/images/small-tile-440x280.png` | Chrome, Edge |
| Marquee 1400×560 | `store/images/marquee-1400x560.png` | Chrome (optional, for featuring) |
| Privacy policy URL | https://yudadwiptr.github.io/privacywaweb/privacy.html | all |
| Homepage URL | https://yudadwiptr.github.io/privacywaweb/ | all |
| Support URL | https://github.com/yudadwiptr/privacywaweb/issues | all |

Category: **Productivity → Tools** (Chrome), **Productivity** (Edge), **Privacy & Security** (Firefox).

---

## Bahasa Indonesia

**Nama**
Tirai: Privasi untuk WhatsApp Web

**Ringkasan** (maks. 132 karakter)
Blur chat, foto, nama, dan foto profil di WhatsApp Web. Arahkan kursor untuk melihat, kunci dengan PIN saat ditinggal.

**Deskripsi**

Tirai menutup WhatsApp Web dari mata yang lewat. Cocok untuk kamu yang membuka WhatsApp di kantor, kafe, kelas, atau saat berbagi layar.

Yang bisa diburamkan, satu per satu:
• Isi pesan di ruang obrolan
• Pratinjau pesan terakhir di daftar chat
• Foto dan video di chat
• Galeri media di info kontak
• Kolom ketik
• Foto profil
• Nama kontak dan grup

Arahkan kursor ke bagian yang buram untuk melihatnya sebentar. Tekan Alt+Shift+B untuk membuka atau menutup semua blur sekaligus, dan atur ketebalan blur sesuai selera.

Kunci dengan PIN
Pergi sebentar? Kunci WhatsApp Web dengan PIN 4 sampai 8 angka. WhatsApp Web terkunci saat:
• kamu menekan Kunci di popup atau Alt+Shift+L
• tidak ada aktivitas selama 1 menit sampai 1 jam (bisa diatur)
• browser dibuka ulang
Setiap 5 kali PIN salah, percobaan ditahan dan jedanya terus bertambah.

Privasi, termasuk dari kami
• Tidak membaca, menyimpan, atau mengirim isi chat
• Tidak ada server, analitik, atau iklan
• PIN tidak disimpan, hanya hash PBKDF2-nya
• Hanya berjalan di web.whatsapp.com
• Kode terbuka: https://github.com/yudadwiptr/privacywaweb

Catatan: kunci PIN melindungi dari orang yang sekadar melihat atau memakai komputermu sebentar. Untuk perlindungan penuh, kunci juga komputermu.

Tirai adalah proyek independen dan tidak berafiliasi dengan WhatsApp atau Meta.

---

## English

**Name**
Tirai: Privacy for WhatsApp Web

**Summary** (max 132 characters)
Blur chats, photos, names and profile pictures on WhatsApp Web. Hover to peek, lock with a PIN when you step away.

**Description**

Tirai ("curtain" in Indonesian) keeps WhatsApp Web private from people walking past your screen: at the office, in a café, in class, or while screen sharing.

Blur each part on its own:
• Messages in the open chat
• Last-message previews in the chat list
• Photos and videos in chats
• Media gallery in contact info
• The text you're typing
• Profile pictures
• Contact and group names

Hover over anything blurred to peek. Press Alt+Shift+B to toggle all blurring, and pick how strong the blur should be.

Lock with a PIN
Stepping away? Lock WhatsApp Web with a 4–8 digit PIN. It locks when:
• you click Lock in the popup or press Alt+Shift+L
• there's no activity for 1 minute to 1 hour (your choice)
• the browser restarts
Every 5 wrong attempts pause input, and the pause grows each time.

Private, including from us
• Never reads, stores or sends your messages
• No servers, no analytics, no ads
• Your PIN is never stored, only a PBKDF2 hash
• Runs only on web.whatsapp.com
• Open source: https://github.com/yudadwiptr/privacywaweb

Note: the PIN lock stops casual snooping. For full protection, lock your computer too.

The extension interface is currently in Indonesian.

Tirai is an independent project and is not affiliated with WhatsApp or Meta.

---

## Chrome Web Store: Privacy practices tab

**Single purpose**
Hide the content of WhatsApp Web from onlookers by blurring it, and optionally lock WhatsApp Web behind a PIN.

**Permission justifications**
- `storage`: saves the user's blur settings and the hash of their PIN locally in the browser.
- Host access `https://web.whatsapp.com/*` (content script): applies the blur styles and shows the PIN lock screen on WhatsApp Web. The extension runs on no other site.

**Remote code**: No. All code is bundled in the package.

**Data usage**: the extension collects none of the listed data types. Tick the three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

## Search keywords to keep in mind

privasi WhatsApp Web, blur WhatsApp Web, kunci WhatsApp Web, sembunyikan chat WhatsApp Web, PIN WhatsApp Web, WhatsApp Web privacy, blur WhatsApp, WhatsApp Web lock, hide WhatsApp messages
