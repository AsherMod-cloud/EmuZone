/* ============================================================
   ERROR MODAL — Reusable standalone
   Author: EmuZone
   Deps:   css/error-modal.css (wajib di-include)
   Usage:  showErrorModal(404);
           showErrorModal(500);
           showErrorModal(403);
   ============================================================ */

(function (global) {
  "use strict";

  // ------- Konfigurasi tiap tipe error -------
  // accent (hex)  -> dipakai buat inline style
  // accentRgb     -> dipakai CSS buat bikin rgba()
  const ERROR_TYPES = {
    404: {
      tag: "[ ERROR 404 - GAME NOT FOUND ]",
      icon: "⚠️",
      title: "GAME NOT FOUND",
      desc: "Game yang kamu cari udah gak ada, dihapus, atau link-nya salah. Coba cek daftar game di halaman utama.",
      btnText: "< BACK TO HOME >",
      btnHref: "index.html",
      accent: "#5fb0ff",       // biru
      accentRgb: "95, 176, 255",
    },
    500: {
      tag: "[ ERROR 500 - CONNECTION FAILED ]",
      icon: "💥",
      title: "KONEKSI TERPUTUS",
      desc: "Gagal nyambung ke server. Cek koneksi internet kamu, terus coba lagi ya.",
      btnText: "< COBA LAGI >",
      btnHref: "javascript:location.reload()",
      accent: "#ff5555",       // merah
      accentRgb: "255, 85, 85",
    },
    403: {
      tag: "[ ERROR 403 - ACCESS DENIED ]",
      icon: "🔒",
      title: "AKSES DITOLAK",
      desc: "Halaman ini cuma bisa diakses admin. Login dulu pakai akun yang berhak.",
      btnText: "< BACK TO HOME >",
      btnHref: "index.html",
      accent: "#ffcc00",       // kuning
      accentRgb: "255, 204, 0",
    },
  };

  // ------- Auto-inject HTML modal kalau belum ada -------
  function ensureModalInDOM() {
    if (document.getElementById("errorModalOverlay")) return;

    const html = `
      <div class="error-modal-overlay" id="errorModalOverlay">
        <div class="error-modal-card" id="errorModalCard">
          <div class="error-modal-tag" id="errTag"></div>
          <div class="error-modal-icon" id="errIcon"></div>
          <h2 class="error-modal-title" id="errTitle"></h2>
          <p class="error-modal-desc" id="errDesc"></p>
          <a class="error-modal-btn" id="errBtn" href="#"></a>
          <p class="error-modal-footer" id="errFooter">// press ESC to dismiss</p>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);
  }

  // ------- Tampilkan modal -------
  function showErrorModal(code) {
    const cfg = ERROR_TYPES[code] || ERROR_TYPES[404];
    ensureModalInDOM();

    // Update teks
    document.getElementById("errTag").textContent = cfg.tag;
    document.getElementById("errIcon").textContent = cfg.icon;
    document.getElementById("errTitle").textContent = cfg.title;
    document.getElementById("errDesc").textContent = cfg.desc;

    // Update tombol
    const btn = document.getElementById("errBtn");
    btn.textContent = cfg.btnText;
    btn.setAttribute("href", cfg.btnHref);

    // Update warna aksen lewat CSS variable
    const card = document.getElementById("errorModalCard");
    card.style.setProperty("--err-accent", cfg.accent);
    card.style.setProperty("--err-accent-rgb", cfg.accentRgb);

    // Update title browser (biar gak nyangkut "Loading...")
    document.title = `${code} — ${cfg.title} | EmuZone`;

    // Update meta description kalau ada
    const metaDesc = document.getElementById("metaDesc");
    if (metaDesc) metaDesc.setAttribute("content", cfg.desc);

    const loader = document.querySelector(".auth-loader");
    if (loader) loader.remove();

    // Munculin modal
    const overlay = document.getElementById("errorModalOverlay");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";

    // ESC = trigger tombol utama (redirect / reload sesuai konteks)
    document.addEventListener("keydown", handleEsc);
  }

  // ------- Handler ESC -------
  function handleEsc(e) {
    if (e.key !== "Escape") return;
    const btn = document.getElementById("errBtn");
    if (btn) btn.click();
    document.removeEventListener("keydown", handleEsc);
  }

  // ------- API publik -------
  global.showErrorModal = showErrorModal;
  global.ERROR_TYPES = ERROR_TYPES;

})(window);

// ============================================================
// ADMIN PAGE GUARD
// Sembunyiin konten sampe auth check selesai.
// Admin valid  -> tampilkan konten, jalankan callback.
// Bukan admin  -> tampilkan error modal 403.
// ============================================================
function guardAdminPage(onAuthorized) {
  // Backup: kalau body belum punya class auth-pending (misal lupa di HTML)
  document.body.classList.add("auth-pending");

  auth.onAuthStateChanged(user => {
    // Belum login ATAU bukan admin
    if (!user || !isAdminUser(user)) {
      // Kalau ada session non-admin, bersihin
      if (user) {
        auth.signOut(); // otomatis trigger onAuthStateChanged lagi dengan user=null
        return;
      }

      // Tampilkan modal 403 (isi konten tetap hidden karena body masih auth-pending)
      showErrorModal(403);
      return;
    }

    // ✅ Admin valid
    document.body.classList.remove("auth-pending");

    if (typeof onAuthorized === "function") {
      onAuthorized(user, getAdminProfile(user));
    }
  });
}

function ensureAuthLoaderInDOM() {
  if (document.querySelector(".auth-loader")) return;
  if (!document.body.classList.contains("auth-pending")) return;

  const html = `
    <div class="auth-loader">
      <div class="auth-loader-spinner"></div>
      <div class="auth-loader-text">
        Memverifikasi akses<span class="auth-loader-dots"></span>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("afterbegin", html);
}

// 👇 👇 👇 TAMBAH FUNGSI BARU INI 👇 👇 👇
function watchAuthPending() {
  const observer = new MutationObserver(() => {
    const stillPending = document.body.classList.contains("auth-pending");
    const loader = document.querySelector(".auth-loader");

    if (!stillPending && loader) {
      loader.remove();
    }
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });
}
// 👆 👆 👆 SAMPAI SINI 👆 👆 👆

// Panggil saat DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    ensureAuthLoaderInDOM();
    watchAuthPending();        // ⬅️ TAMBAH INI
  });
} else {
  ensureAuthLoaderInDOM();
  watchAuthPending();          // ⬅️ TAMBAH INI
}