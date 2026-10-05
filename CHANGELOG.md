# Changelog

## 2026-10-06

### Changed
- Mengganti nama project dari `Emulator Games ID` menjadi `EmuZone.ID`.
- Mengganti URL website menjadi `https://emuzone.pages.dev/`.
- Memperbarui branding website dan metadata terkait ke identitas `EmuZone`.
- Mengganti favicon dan `og-image`.
- Memperbarui nama, profile, deskripsi, dan format share pada channel.
- Memperbarui status channel menjadi aktif kembali.

## 2026-10-03

### Added
- Menambahkan metadata SEO beranda, canonical URL, Open Graph, Twitter Card, dan tag warna tema.
- Menambahkan gambar sosial cadangan khusus di `assets/image/og-image.png`.
- Menambahkan modal selamat datang per sesi pada halaman beranda untuk menjelaskan tujuan dan status pengembangan project.

### Notes
- Fokus rilis V1 adalah publish versi yang sudah stabil dan usable terlebih dahulu. Penyempurnaan OG image dan metadata sosial lanjutan dapat ditunda ke tahap berikutnya agar tidak menahan publikasi.

### Improved
- Peningkatan pada pengaturan metadata sosial `game.html` dan penanganan URL kanonik.
- Halaman game sekarang menggunakan cover game terlebih dahulu, kemudian banner, untuk `og:image` dan gambar Twitter.
- Menambahkan validasi gambar saat runtime dengan fallback ke gambar OG utama ketika cover/banner hilang atau tidak valid.
- Tautan game yang tidak valid atau hilang sekarang mengatur ulang metadata sosial ke gambar fallback utama.

## 2026-09-18

### Added

- Added roadmap export system with three output formats:
  - **📄 Export as .js** — generate blueprint `DEFAULT_ROADMAP` (id, category, title only, tanpa status) siap paste ke `roadmap.js`.
  - **💾 Download JSON** — snapshot lengkap dengan status & timestamp, cocok buat backup.
  - **📝 Export as .md** — tabel Markdown dengan status symbol (✅/🟡/⬜/❌/⛔), cocok buat changelog / docs.
- Added preview modal untuk format `.js` dan `.md` dengan tombol **📋 Copy** dan **💾 Download**.
- Added `preview-info` counter yang menampilkan total baris dan jumlah karakter.
- Added `Select All` behavior via native long-press di preview content (dengan `user-select: text` scoped).

### Changed

- **Roadmap arsitektur dipisah jadi dua sumber:**
  - `roadmap.js` → **blueprint** (id, category, title). Semua item di-seed dengan `status: "planned"`.
  - Firestore → **single source of truth** untuk status live.
- `DEFAULT_ROADMAP` sekarang **tanpa field `status`** — mencegah drift antara kode dan Firestore.
- `seedRoadmap()` dan `addMissingDefaultItems()` sekarang set `status: "planned"` secara eksplisit saat seeding.
- `generateRoadmapCode()`, `generateRoadmapJSON()`, dan `generateRoadmapMarkdown()` sekarang mengikuti **urutan `DEFAULT_ROADMAP`**, bukan urutan alfabet.
- Export JS sekarang **menghilangkan `status`** dari output (blueprint only).
- Export JSON tetap menyimpan `status` (buat restore kalau Firestore ke-wipe).
- Preview modal **tidak bisa ditutup dengan klik area luar** — konsisten dengan error modal. Hanya tombol ×, ESC, atau aksi (Copy/Download) yang menutup.
- Tombol Copy dan Download sekarang **otomatis menutup modal** + menampilkan toast.
- `copyToClipboard()` dirombak dengan fallback `execCommand('copy')` yang lebih reliable di mobile + toast menampilkan jumlah karakter yang di-copy.

### Fixed

- Fixed `textarea` yang tidak bisa render konten > ~15.000 karakter di Chrome Android — diganti ke `<pre>` dengan `white-space: pre` dan `overflow: auto`.
- Fixed preview yang keliatan "kepotong" — ternyata bukan bug render, tapi urutan alfabet yang bikin user salah kira.
- Fixed `user-select` yang bocor ke title/filename/tombol di preview modal — sekarang scoped hanya ke `<pre>`.
- Fixed typo `JS.values` → `JS` di entry 2026-09-17.

### Notes

- **Rule baru:** kode = blueprint, Firestore = state. Jangan edit `title`/`category` di `DEFAULT_ROADMAP` setelah item ada di Firestore — pakai mode Edit di UI roadmap.
- **Backup workflow:** export JSON secara berkala → simpen di folder `backups/` di repo → commit. Ini jadi historical snapshot kalau Firestore perlu di-restore.
- Item baru di `DEFAULT_ROADMAP` otomatis ke-seed dengan status `planned` lewat `addMissingDefaultItems()` tanpa menyentuh item lama yang sudah punya status berbeda.

## 2026-09-17

### Added

- Added a reusable error modal system (`js/error-modal.js` + `css/error-modal.css`) supporting three error types with distinct accent colors:
  - `404` — biru (`#5fb0ff`) untuk halaman/game tidak ditemukan.
  - `500` — merah (`#ff5555`) untuk kegagalan koneksi Firestore.
  - `403` — kuning (`#ffcc00`) untuk akses admin yang ditolak.
- Added auto-injection of error modal HTML into `document.body`, so each page only needs to include the CSS + JS once.
- Added `showErrorModal(code)` public API — reusable across `game.html`, `editor.html`, dan `roadmap.html`.
- Added dynamic `<title>` update in the error modal (contoh: `404 — GAME NOT FOUND | Emulator Games ID`), mencegah URL bar nyangkut di `"Loading..."`.
- Added auth loader (`spinner + "Memverifikasi akses..."`) yang muncul saat `guardAdminPage()` sedang memvalidasi sesi admin.
- Added `MutationObserver` pada `<body>` untuk auto-remove auth loader kapanpun class `auth-pending` dihapus — mencegah loader nyangkut.
- Added `guardAdminPage(onAuthorized)` di `js/auth.js` sebagai pengganti `requireAdmin()` untuk editor dan roadmap.

### Changed

- Editor dan roadmap sekarang menyembunyikan seluruh konten via `body.auth-pending` sampai auth check selesai, sehingga tidak ada flash of unauthorized content sebelum modal 403 muncul.
- Error modal sengaja **tidak dapat ditutup dengan klik area luar** — satu-satunya jalan keluar adalah tombol aksi atau tombol `ESC` (yang otomatis men-trigger tombol aksi).
- Warna aksen modal (`--err-accent` dan `--err-accent-rgb`) di-set per tipe error via inline CSS variable, sehingga satu komponen CSS bisa dipakai untuk semua jenis error.
- `game.js` `renderNotFound()` sekarang memanggil `showErrorModal(404)` alih-alih merender fallback HTML inline.
- `editor.js` dan `roadmap.js` dibungkus ke dalam `initEditor()` / `initRoadmap()` dan dijalankan lewat `guardAdminPage()`.
- `auth.js` `guardAdminPage()` sekarang menghapus auth loader dan class `auth-pending` secara eksplisit saat admin tervalidasi.

### Fixed

- Fixed `roadmap.html` typo: closing tag `</>` diganti `</body>`.
- Fixed black screen di `editor.html` yang muncul sebentar sebelum konten tampil — sekarang ada loading indicator yang konsisten.
- Fixed auth loader yang nyangkut di `roadmap.html` ketika `auth-pending` dihapus tapi loader tidak ikut dibersihkan.
- Fixed `auth is not defined` pada `roadmap.js` dengan memastikan urutan script: `firebase.js` → `auth.js` → `error-modal.js` → halaman JS.

### Security

- Migrated from `requireAdmin()` (yang hanya redirect) ke `guardAdminPage()` yang menahan render konten sampai auth check selesai — mencegah flash of unauthorized content.
- Auth guard sekarang handle session non-admin dengan `signOut()` otomatis sebelum menampilkan modal 403.

## 2026-08-28

### Added

- Added an admin-only `roadmap.html` page with the simplified Emulator Games ID roadmap.
- Added Firestore-backed roadmap persistence with automatic initial roadmap seeding.
- Added custom roadmap status controls: `○ Planned`, `✓ Done`, `~ Partial`, `X Rejected`, and `! Blocked`.
- Added edit mode with Cancel and disabled-until-changed Save behavior.
- Added roadmap progress summary counters.
- Added the Notepad navigation button between Add Game and Join Channel.

### Changed

- Reused the existing `requireLogin()` guard for roadmap access.
- Updated shared controls toward a calmer outlined visual style.
- Fixed the inherited `emulator-config.js` closing-parenthesis syntax error.
- Updated roadmap dirty-state handling so Save automatically disables when all values are restored to their original state.
- Fixed roadmap action visibility so Cancel and Save are hidden in normal mode and only appear during editing.

## 2026-08-29

### Security

- Converted `ADMINS` into a shared UID-based admin allowlist.
- Login now rejects identifiers that are not registered in `ADMINS` before attempting Firebase authentication.
- Added `requireAdmin()` for the editor and roadmap pages.
- Added a post-login UID authorization check and sign-out for authenticated accounts without admin access.

### Required configuration

- Replace `PASTE_OWNER_FIREBASE_UID_HERE` in `js/auth.js` with the owner UID used in Firestore Rules before deploying.

## Login rate limiting

- Added ADMINS-first filtering before Firebase login requests.
- Added a localStorage cooldown after repeated failed owner login attempts.
- Added exponential cooldown growth from 30 seconds up to 10 minutes.
- Clears the local cooldown after a successful authorized admin login.
- Handles Firebase `auth/too-many-requests` without replacing Firebase server-side throttling.

## Content safety roadmap

- Added planned roadmap entries for a pre-detail-game content warning modal and confirmation flow.
- Added planned roadmap entries for a future Restricted 18+ setting and hiding 18+ tags or genres.
- Added automatic insertion of newly defined default roadmap items into an existing Firestore roadmap without overwriting current items.
