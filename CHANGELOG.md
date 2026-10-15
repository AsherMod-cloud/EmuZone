# Changelog

## 2026-10-16

### Fixed

- **Fixed `getEmulatorInfo is not defined` di `editor.js`** — penyebabnya race condition: `editor.js` dieksekusi sebelum `emulator-config.js` selesai di-parse, sehingga function `getEmulatorInfo()` belum terdefinisi saat form editor diinisialisasi. Solusi: memindahkan `<script src="js/emulator-config.js">` dari akhir `<body>` ke dalam `<head>` `editor.html`, sebelum script halaman dimuat. Ini menjamin semua helper & registry emulator tersedia sebelum `editor.js` berjalan.
- **Fixed fitur Save di editor yang stuck tanpa error** — gejalanya tombol tidak berubah menjadi `"Saving..."`, tidak ada error di Console, tapi game tidak tersimpan. Akar masalah: `buildGameSearchFields()` dipanggil di save handler `editor.js`, tapi function tersebut berada di `script.js` yang tidak dimuat di `editor.html`. Hal ini menyebabkan `ReferenceError` yang tidak tertangkap dan menghentikan handler secara silent.
- **Fixed `buildGameSearchFields` not found saat save** — ditambahkan safe check `if (typeof buildGameSearchFields === "function")` di save handler `editor.js`. Jika function tidak tersedia, save tetap berjalan dan hanya search fields (`title_words`, `title_substrings`) yang di-skip, bukan menggagalkan seluruh proses save.

### Changed

- **Search helpers dipindahkan dari `script.js` ke `emulator-config.js`:**
  - `normalizeSearchText()` — normalisasi teks untuk pencarian.
  - `generateTitleWords()` — pecah judul menjadi array kata unik.
  - `generateTitleSubstrings()` — generate substring (2+ karakter) untuk mendukung partial word search.
  - `buildGameSearchFields()` — gabungkan `title_words` + `title_substrings` untuk disimpan ke Firestore.
  - **Alasan:** function-function ini dipakai di 3 halaman berbeda (`editor.html` untuk save game, `index.html` untuk filter live, `search.html` untuk server-side search). Menaruhnya di `emulator-config.js` sebagai *shared helper* memastikan semua halaman mendapat akses yang sama tanpa duplikasi kode.
- **Script order di 3 halaman diselaraskan:**
  - `editor.html`, `index.html`, dan `search.html` sekarang memuat `emulator-config.js` **sebelum** `script.js` / `editor.js` / `search.js`.
  - Urutan konsisten: `firebase.js` → `emulator-config.js` → `auth.js` → `error-modal.js` → halaman JS.

### Cleaned up

- Menghapus semua `console.log` debug sementara:
  - `[CONFIG] emulator-config.js LOADED...` di `emulator-config.js`.
  - `[EDITOR] editor.js LOADED...` di `editor.js`.
  - Semua log `[SAVE] 1` hingga `[SAVE] 14` di save handler `editor.js`.
- Mempertahankan `console.warn` untuk emulator tidak dikenal dan `console.error` di catch block — sesuai best practice: `console.log` untuk debug (dihapus), `warn`/`error` untuk error tracking (dipertahankan).

### Notes

- **Pelajaran penting — script order matters.** Script yang berisi helper/function murni (`emulator-config.js`) harus dimuat di `<head>` agar tersedia sebelum script halaman. Script yang butuh DOM (akses `document.getElementById`, dll) harus dimuat di akhir `<body>`.
- **Race condition itu silent.** Bug ini tidak memunculkan error saat halaman load — baru muncul ketika user berinteraksi (klik Save). Ini membuat debugging lebih sulit dibanding error yang muncul langsung.
- **Shared helper = 1 sumber kebenaran.** Jika ada bug di `buildGameSearchFields`, perbaikan cukup dilakukan di `emulator-config.js` dan otomatis berlaku untuk semua halaman yang memakainya.
- **Safe check sebelum panggil function.** Pola `if (typeof fn === "function")` berguna untuk mencegah crash total saat function optional tidak tersedia — terutama di environment yang bisa berubah (deploy partial, cache stale, dll).

## 2026-10-12

### Added

- **Dynamic SEO via Cloudflare Function** (`functions/game.js`):
  - Upgrade dari *dynamic OG image* menjadi *dynamic SEO* penuh per game.
  - **SEO Title** dengan format `{title} ROM ({console}) - Download on {emulator} | EmuZone` (auto-truncate jika kepanjangan).
  - **SEO Description** data-driven: `Download {title} ROM untuk {console}. Playable di Android via {emulator}. Ukuran {size}, region {region}. Gratis & cepat di EmuZone.` — field kosong otomatis di-skip.
  - **JSON-LD `VideoGame` schema** — mengirim metadata terstruktur (name, image, genre, developer, release date, rating, screenshots, price, availability) untuk memicu rich snippet di Google Search.
  - **JSON-LD `BreadcrumbList` schema** — menampilkan breadcrumb (Home › Console › Game) di hasil pencarian.
  - **Helper `stripMarkdown()`** — membersihkan deskripsi markdown dari Firestore menjadi plain text sebelum dikirim ke meta tags & JSON-LD.
  - **Helper `escapeHtml()` & `toAbsoluteUrl()`** — reusable untuk semua injeksi meta & JSON-LD.
  - Fetch field Firestore yang lebih lengkap: `genre`, `developer`, `publisher`, `releaseDate`, `rating`, dan `screenshots` (array).

### Changed

- Meta tag strategy di `game.html` sekarang fully server-rendered: `og:title`, `og:description`, `og:image`, `og:url`, `twitter:title`, `twitter:description`, `twitter:image`, `<meta name="description">`, `<title>`, dan `canonical URL` — semua di-inject via CF Function.
- Replaced dynamic `sitemap.xml` and `robots.txt` Pages Functions with static root files for more reliable crawler access.
- Generated static `sitemap.xml` from the current Firestore snapshot with 32 valid game slugs plus homepage and search page.

### Notes

- **Kenapa Functions, bukan file statis:**
  - `sitemap.xml` dan `robots.txt` disajikan lewat Cloudflare Pages Functions (bukan file statis di root) agar sitemap auto-update dari Firestore.
  - **Penting:** Jangan menaruh `sitemap.xml` atau `robots.txt` statis di root repo — file statis akan override Function dan menyebabkan sitemap/robots tidak ter-update otomatis.
- **Konvensi file-based routing:** Nama file di `functions/` menentukan route. `functions/sitemap.xml.js` menangani `/sitemap.xml`, `functions/robots.txt.js` menangani `/robots.txt`, dan `functions/game.js` menangani `/game`.
- **Firestore Rules:** Sitemap & SEO function melakukan fetch publik ke Firestore. Pastikan collection `games` mengizinkan `read: true` untuk publik.
- **JSON-LD rating:** Menggunakan rating admin (integer 1–5) sebagai `aggregateRating` sementara. Dapat di-upgrade ke rating user di masa mendatang.
- **OG image vs SEO:** OG image tetap di-inject (untuk preview sosial media), tapi tidak memengaruhi ranking Google. Yang memengaruhi SEO: `<title>`, `<meta name="description">`, JSON-LD, dan konten halaman.

### Removed
- Removed `functions/sitemap.xml.js`, `functions/robots.txt.js`, and the sitemap-only helper `functions/_seo-data.js`.

## 2026-10-11

### Added

- Menambahkan halaman pencarian khusus **("search.html")** untuk mencari game.
- Menambahkan fitur pencarian multi-kata kunci dengan urutan kata yang fleksibel.
- Menambahkan fitur pencarian game berbasis Firestore menggunakan **"title_words"**.
- Menambahkan **pagination** untuk hasil pencarian.
- Menambahkan dukungan untuk pencarian game melalui parameter kueri URL **("?q=")**.
- Menambahkan **navigation** langsung dari hasil pencarian ke halaman detail game.

### Improved

- CSS inline `search.html` telah diubah menjadi `css/search.css`.
- JavaScript inline di `search.html` telah diubah menjadi `js/search.js`.
- Tombol kirim di halaman beranda dan halaman pencarian telah didesain ulang agar sesuai dengan tema EmuZone yang tenang dan berdesain minimalis.
- Penyelarasan spasi halaman pencarian, warna, batas, status fokus, penomoran halaman, status kosong, dan tata letak seluler dengan halaman beranda.
- **Pemisahan tanggung jawab pencarian:** `index.html` sekarang hanya menjadi *pintu masuk* pencarian (form submit ke `search.html`), sedangkan logika pencarian sepenuhnya ditangani oleh `search.html` dan `js/search.js`.
- Search bar di `index.html` tidak lagi melakukan filter live — hanya mengirim query via URL parameter saat form di-submit.

### Fixed

- Memperbaiki pemfilteran konsol dengan menormalisasi nama konsol dan menampilkan entri registri aktif serta konsol Firestore yang tidak dikenal.
- Memperbaiki pencarian judul parsial dengan melakukan kueri `title_substrings` dengan fallback `title_words`.
- Menambahkan dukungan pencarian slug di `search.html` di samping pencarian ID dokumen.
- Memperbaiki permintaan pencarian yang tumpang tindih sehingga kueri lama yang lebih lambat tidak dapat menimpa hasil yang lebih baru.
- Editor sekarang menyimpan dan memperbarui `title_words` dan `title_substrings` secara otomatis.
- **Menghapus `search.addEventListener("input", renderGrid)`** di `script.js` — sebelumnya listener ini membuat `index.html` ikut melakukan filter live pada katalog, yang menyebabkan hasil pencarian bocor ke halaman beranda.
- **Menghapus filter query (`normalizeSearchText(g.title).includes(q)`) di `renderGrid()`** — fungsi `renderGrid()` sekarang hanya bertanggung jawab untuk memfilter berdasarkan konsol yang aktif, bukan berdasarkan kata kunci pencarian. Ini mencegah duplikasi logika pencarian antara `index.html` dan `search.html`.

## 2026-10-09

### Added

- **Load More pagination** pada katalog beranda:
  - Batch pertama ambil 15 game dari Firestore.
  - Tombol **↓ Load More (N lagi)** muncul di bawah grid, N = sisa game yang belum ke-load.
  - Setiap klik mengambil 15 game berikutnya via `startAfter(lastVisibleDoc)`.
  - Tombol **otomatis hilang** kalau batch terakhir berisi kurang dari 15 game.
- **Rocket scroll-to-top button** di kanan bawah:
  - Muncul otomatis saat user scroll > 400px.
  - Animasi roket meluncur ke atas + lidah api (flame trail) selama ~900ms.
  - Smooth scroll bareng dengan animasi roket.
  - Tombol hilang otomatis setelah scroll ke atas.
- **`getGamesCount()` via Firestore REST API** (`runAggregationQuery`):
  - Menghitung total game tanpa membaca dokumen (1 read operation).
  - Digunakan untuk badge "Total Games" di header + label sisa game di tombol Load More.
  - Dipilih karena `gamesRef.count()` **tidak tersedia** di Firebase compat SDK v10.12.2 yang dipakai.

### Changed

- `loadInitialData()` sekarang jalan secara paralel: `Promise.all([getGamesCount(), fetchPage()])` — count + data diambil sekaligus, biar load awal gak nunggu dua kali.
- Tombol Load More dipindah dari **di dalam grid** ke **elemen statis di luar grid**:
  - Sebelumnya tombol di-recreate setiap `renderGrid()` — rawan duplikasi listener.
  - Sekarang tombol cuma dibuat sekali seumur halaman, hanya visibility & label yang di-update via `updateLoadMoreButton()`.
- Event listener Load More di-attach **sekali seumur halaman**, gak lagi di dalam `renderGrid()`.

### Fixed

- Fixed tombol Load More yang **nyangkut di state "Memuat..."** saat pertama kali halaman dibuka:
  - Akar masalah: `renderGrid()` dipanggil **sebelum** `isLoading = false`, jadi `updateLoadMoreButton()` melihat `isLoading` masih `true` dan men-disable tombol selamanya.
  - Solusi: pindahkan `renderGrid()` ke dalam blok `finally`, **setelah** `isLoading = false`.
- Fixed Load More yang **auto-trigger tanpa user klik**: ditambahkan guard `if (!e.isTrusted) return;` pada listener tombol, plus cek state `isLoading` / `hasMore` / `lastVisibleDoc` di awal `loadMore()`.
- Fixed duplikasi `<main>` dan `<div id="grid">` di `index.html` — disatukan jadi satu `<main>` dengan grid + Load More wrap.
- Fixed edge case pagination ketika total game tepat kelipatan `PAGE_SIZE` — tombol Load More sekarang hilang tepat setelah batch terakhir.
- Fixed `getGamesCount()` yang return `0` saat gagal — sekarang return `null`, sehingga `totalCount` bisa dibedakan antara "0 game valid" vs "count gagal". Fallback: pakai batch-based `hasMore` (`snap.docs.length === PAGE_SIZE`) tanpa klaim total yang keliru.

### Notes

#### 🐛 Bug yang masih ada

- **Kategori/chip console gak konsisten dengan pagination:**
  - Chip di-generate dari `allGames` (data yang udah ke-load), bukan dari seluruh database.
  - Akibat: console baru (mis. PS3) **belum muncul di chip** sampai user klik Load More beberapa kali.
  - Akibat turunan: user yang pilih console X bisa lihat hasil kosong, padahal ada game console X yang belum ke-load.
- **Chip row overflow:** chip pertama ("SEMUA") bisa kepotong di sisi kiri karena padding container kurang.
- **Filter + Search cuma jalan di game yang udah ke-load:**
  - Kalau user search "Mario" tapi Mario belum ke-load, gak akan muncul.
  - Ini trade-off dari pagination — bisa di-improve nanti dengan server-side search.
- **Real-time updates hilang:** `onSnapshot` diganti `get()`, jadi game baru gak muncul otomatis di katalog user. Untuk sekarang, refresh manual dianggap cukup.

#### 💡 Ide / Rencana Perbaikan

1. **Hardcode `CONSOLE_LIST`** dengan urutan custom (PS1, PS2, PS3, PSP, Vita, NDS, Wii, GBC, dst — bukan alfabet). Chip jadi selalu tampil semua console yang didukung, terlepas dari pagination.
2. **Fix chip row padding** biar chip "SEMUA" gak kepotong.
3. **Server-side search:**
   - Prefix search via `where("title_lowercase", ">=", q)` + `where("title_lowercase", "<=", q + "\uf8ff")`.
   - Perlu backfill `title_lowercase` di game lama + tambah field ini di `editor.js`.
   - Perlu composite index di Firebase Console untuk kombinasi `title_lowercase` + `console`.
   - Search mode punya pagination sendiri: 20 per page (bedain sama home yang 15).
   - Debounce 300ms di input search biar gak query tiap ketikan.
4. **User preference PAGE_SIZE:** setting buat user pilih 12 / 15 / 18 per page, disimpen di `localStorage`.
5. **Tombol Refresh manual** khusus admin di header, buat narik game baru tanpa reload halaman.
6. **Alarm reminder:** jangan kelamaan implement — target akhir Oktober 2026.

## 2026-10-06

### Added

- **Cloudflare Pages Function** (`functions/game.js`) untuk server-side rendering metadata sosial per game:
  - Fetch data game dari Firestore REST API berdasarkan `slug`.
  - Inject `og:title`, `og:description`, `og:image`, `og:url`, `twitter:title`, `twitter:description`, `twitter:image` langsung ke HTML sebelum dikirim ke client.
  - Dynamic `canonical URL` dan `<title>` per game.
  - Auto-generate OG description berbasis template: `"Download {title} untuk {console}. Playable via {emulator}..."` dengan fallback bertingkat jika console/emulator kosong.
- Helper `escapeHtml()` untuk mencegah XSS & karakter rusak di meta tags.
- Helper `toAbsoluteUrl()` untuk konversi relative path gambar ke absolute URL (wajib untuk OG image).

### Changed

- **Migrasi pendekatan dynamic metadata: runtime JS → Cloudflare Pages Function (SSR).**
  - Alasan: crawler sosial media (Facebook, WhatsApp, Twitter, Google, Discord, Telegram) **tidak mengeksekusi JavaScript**. Metadata yang di-inject via `game.js` setelah DOM load **tidak terbaca**.
  - Solusi: CF Function intercept request `/game?slug=xxx` → fetch data → inject meta tags ke HTML → return ke crawler.
- `game.html` `<head>` di-refactor: semua tag meta sekarang punya `property="og:..."` atau `name="twitter:..."` sebagai target replace.
- `replaceMeta()` di CF Function di-refactor agar mempertahankan attribute `property`/`name` saat replace `content` (sebelumnya attribute ini hilang saat replace).
- `og:image` sekarang di-set ke absolute URL secara otomatis via `toAbsoluteUrl()`.
- `og:url` default di `game.html` di-set ke homepage, di-replace oleh CF Function dengan URL spesifik game saat request.
- Mengganti nama project dari `Emulator Games ID` menjadi `EmuZone.ID`.
- Mengganti URL website menjadi `https://emuzone.pages.dev/`.
- Memperbarui branding website dan metadata terkait ke identitas `EmuZone`.
- Mengganti favicon dan `og-image`.
- Memperbarui nama, profile, deskripsi, dan format share pada channel.
- Memperbarui status channel menjadi aktif kembali.

### Fixed

- Fixed `og:image` fallback ke `og-image.png` ketika game tidak punya `cover` maupun `banner`.
- Fixed meta description (`<meta name="description">`) yang sebelumnya tidak ikut ter-replace oleh CF Function.
- Fixed escaping title yang sebelumnya hanya escape `<` & `>` — sekarang pakai `escapeHtml()` lengkap (`&`, `"`, `<`, `>`).

### Notes

- **Arsitektur meta tags:**
  - `game.html` = **template statis** dengan tag OG/Twitter default (punya `id` + `property`/`name`).
  - CF Function = **injector** — replace `content` per request berdasarkan data Firestore.
  - Crawler baca hasil akhir = meta tags sudah ter-personalisasi per game.
- **Kenapa CF Function menang dibanding runtime JS:**
  1. Crawler gak eksekusi JS.
  2. SSR menjamin meta tags ada di HTML response pertama.
  3. Cepat — Firestore query dilakuin server-side, gak nunggu client render.

## 2026-10-03

### Added

- Menambahkan metadata SEO beranda, canonical URL, Open Graph, Twitter Card, dan tag warna tema.
- Menambahkan gambar sosial cadangan khusus di `assets/image/og-image.png`.
- Menambahkan modal selamat datang per sesi pada halaman beranda untuk menjelaskan tujuan dan status pengembangan project.

### Notes

- Fokus rilis V1 adalah publish versi yang sudah stabil dan usable terlebih dahulu. Penyempurnaan OG image dan metadata sosial lanjutan dapat ditunda ke tahap berikutnya agar tidak menahan publikasi.
- **⚠️ Superseded (2026-10-06):** Pendekatan dynamic metadata via runtime `game.js` **tidak berhasil** karena crawler (Facebook, WhatsApp, Twitter, Google) **tidak mengeksekusi JavaScript** saat membaca HTML. Digantikan oleh solusi Cloudflare Pages Functions (lihat entry 2026-10-06).

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
