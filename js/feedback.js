(() => {
  const endpoint = "/api/feedback";
  let activeType = "request";
  let activeContext = {};

  const decode = value => {
    try { return decodeURIComponent(value || ""); } catch { return value || ""; }
  };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  function ensureModal() {
    if (document.getElementById("feedbackOverlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "feedback-overlay";
    overlay.id = "feedbackOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "feedbackTitle");
    overlay.innerHTML = `
      <div class="feedback-card">
        <button class="feedback-close" id="feedbackClose" type="button" aria-label="Tutup">&times;</button>
        <h2 id="feedbackTitle">Request Game</h2>
        <p id="feedbackIntro">Belum menemukan game yang kamu cari? Kirim request dan akan kami cek.</p>
        <form class="feedback-form" id="feedbackForm">
          <label class="feedback-field request-only">Judul game <span class="feedback-required">*</span>
            <input id="feedbackTitleInput" name="title" type="text" maxlength="160" required placeholder="Contoh: Persona 5">
          </label>
          <label class="feedback-field request-only">Console / platform
            <input id="feedbackPlatform" name="platform" type="text" maxlength="80" placeholder="Contoh: PS2, PSP, Android">
          </label>
          <div class="feedback-field report-only" hidden>Game yang dilaporkan
            <input id="feedbackGameTitle" type="text" readonly>
          </div>
          <label class="feedback-field report-only" hidden>Kategori <span class="feedback-required">*</span>
            <select id="feedbackCategory" name="category">
              <option value="" selected disabled>Pilih kategori laporan</option>
              <option value="broken_link">Link rusak</option>
              <option value="not_playable">Tidak bisa dimainkan</option>
              <option value="wrong_info">Informasi salah</option>
              <option value="other">Lainnya</option>
            </select>
          </label>
          <label class="feedback-field">Nama <span>(opsional)</span>
            <input id="feedbackName" name="name" type="text" maxlength="80" placeholder="Nama atau username">
          </label>
          <label class="feedback-field">Pesan <span class="feedback-required">*</span>
            <textarea id="feedbackMessage" name="message" maxlength="2000" required placeholder="Tulis detailnya di sini..."></textarea>
          </label>
          <p class="feedback-status" id="feedbackStatus" role="status" aria-live="polite"></p>
          <button class="feedback-submit" id="feedbackSubmit" type="submit">Kirim Request</button>
        </form>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById("feedbackClose").addEventListener("click", closeModal);
    overlay.addEventListener("click", event => { if (event.target === overlay) closeModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && overlay.classList.contains("is-open")) closeModal(); });
    document.getElementById("feedbackForm").addEventListener("submit", submitFeedback);
  }

  function setMode(type, context = {}) {
  activeType = type === "report" ? "report" : "request";
  activeContext = context;
  const isReport = activeType === "report";
  const overlay = document.getElementById("feedbackOverlay");
  const title = document.getElementById("feedbackTitle");
  const intro = document.getElementById("feedbackIntro");
  const submit = document.getElementById("feedbackSubmit");
  const status = document.getElementById("feedbackStatus");
  const form = document.getElementById("feedbackForm");

  // Tampilkan / sembunyikan field
  overlay.querySelectorAll(".request-only").forEach(node => { 
      node.style.display = isReport ? "none" : "flex"; 
  });
  overlay.querySelectorAll(".report-only").forEach(node => { 
      node.style.display = !isReport ? "none" : "flex"; 
  });

  // ⬇️ TAMBAHIN BAGIAN INI BUAT FIX BUG REQUIRED ⬇️
  const titleInput = document.getElementById("feedbackTitleInput");
  const categoryInput = document.getElementById("feedbackCategory");

  if (isReport) {
      if (titleInput) titleInput.required = false; // Jangan wajibin judul request
      if (categoryInput) categoryInput.required = true; // Wajibin kategori
  } else {
      if (titleInput) titleInput.required = true;
      if (categoryInput) categoryInput.required = false;
  }
  // ⬆️ SAMPAI SINI ⬆️

  title.textContent = isReport ? "Report Game" : "Request Game";
  intro.textContent = isReport ? "Bantu kami memperbaiki data atau link game ini." : "Belum menemukan game yang kamu cari? Kirim request dan akan kami cek.";
  submit.textContent = isReport ? "Kirim Report" : "Kirim Request";
  status.textContent = "";
  status.className = "feedback-status";
  form.reset();

  if (isReport) {
      document.getElementById("feedbackGameTitle").value = context.title || "Game";
  } else {
      document.getElementById("feedbackTitleInput").value = context.title || "";
  }
}

  function openModal(type, context) {
    ensureModal();
    setMode(type, context);
    const overlay = document.getElementById("feedbackOverlay");
    overlay.classList.add("is-open");
    document.body.classList.add("modal-open");
    const focusTarget = type === "report" ? document.getElementById("feedbackCategory") : document.getElementById("feedbackTitleInput");
    setTimeout(() => focusTarget?.focus(), 30);
  }

  function closeModal() {
    const overlay = document.getElementById("feedbackOverlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("modal-open");
  }

  async function submitFeedback(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = document.getElementById("feedbackSubmit");
    const status = document.getElementById("feedbackStatus");
    const data = new FormData(form);
    const payload = {
      type: activeType,
      name: data.get("name"),
      message: data.get("message")
    };

    if (activeType === "request") {
      payload.title = data.get("title");
      payload.platform = data.get("platform");
    } else {
      payload.category = data.get("category");
      payload.gameTitle = activeContext.title;
      payload.gameSlug = activeContext.slug;
      payload.gameConsole = activeContext.console;
    }

    submit.disabled = true;
    status.className = "feedback-status";
    status.textContent = "Mengirim...";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || "Feedback gagal dikirim.");
      status.className = "feedback-status success";
      status.textContent = result.message || "Berhasil dikirim.";
      form.reset();
      setTimeout(closeModal, 1200);
    } catch (error) {
      status.className = "feedback-status error";
      status.textContent = error.message || "Terjadi kesalahan. Coba lagi.";
    } finally {
      submit.disabled = false;
    }
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-feedback]");
    if (!trigger) return;

    const context = {
        title: decode(trigger.dataset.gameTitle),
        slug: decode(trigger.dataset.gameSlug),
        console: decode(trigger.dataset.gameConsole)
    };

    if (trigger.dataset.feedback === "request") {
        const searchInput = document.querySelector("#searchInput");
        context.title ||= searchInput?.value.trim() || "";
    }

    openModal(trigger.dataset.feedback, context);
});

  ensureModal();
})();
