guardAdminPage(() => initReports());

function initReports() {
  const { $, esc, toDate, relTime, fullDate, toast, statState } = AdminUtils;
  const reportsRef = db.collection("reports");
  const STATUS_LABEL = { pending: "Pending", in_progress: "Diproses", completed: "Selesai" };
  const CATEGORY_LABEL = { broken_link: "Link rusak", not_playable: "Tidak bisa dimainkan", wrong_info: "Info salah", other: "Lainnya" };
  let reports = [];
  let state = "loading";
  let unsubscribe = null;
  let openId = null;

  ["fSearch", "fStatus", "fCategory"].forEach(id => $(id).addEventListener("input", render));

  const statusOf = r => (STATUS_LABEL[r.status] ? r.status : "pending");
  const statusBadge = r => `<span class="badge status-${statusOf(r)}">${STATUS_LABEL[statusOf(r)]}</span>`;
  const categoryLabel = r => CATEGORY_LABEL[r.category] || (r.category ? esc(r.category) : "Tanpa kategori");
  const summary = s => { s = String(s || ""); return s.length > 120 ? s.slice(0, 117) + "…" : s; };

  function load() {
    if (unsubscribe) unsubscribe();
    state = "loading";
    ["stTotal", "stPending", "stProgress", "stDone"].forEach(id => statState(id, "loading"));
    render();
    unsubscribe = reportsRef.orderBy("createdAt", "desc").limit(500).onSnapshot(snap => {
      reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      state = "success";
      statState("stTotal", "success", reports.length);
      statState("stPending", "success", reports.filter(r => statusOf(r) === "pending").length);
      statState("stProgress", "success", reports.filter(r => statusOf(r) === "in_progress").length);
      statState("stDone", "success", reports.filter(r => statusOf(r) === "completed").length);
      render();
      if (openId) renderDetail();
    }, err => {
      console.error(err);
      state = "error";
      ["stTotal", "stPending", "stProgress", "stDone"].forEach(id => statState(id, "error"));
      render();
    });
  }
  window.addEventListener("pagehide", () => unsubscribe && unsubscribe());

  function stateBox(icon, text, extra = "", role = "status") {
    return `<div class="request-state${role === "alert" ? " request-error" : ""}" role="${role}">${icon}<strong>${text}</strong>${extra}</div>`;
  }

  function filtered() {
    const q = $("fSearch").value.trim().toLowerCase();
    const st = $("fStatus").value, cat = $("fCategory").value;
    return reports.filter(r =>
      (st === "all" || statusOf(r) === st) &&
      (cat === "all" || r.category === cat) &&
      (!q || String(r.gameTitle || "").toLowerCase().includes(q) || String(r.message || "").toLowerCase().includes(q)));
  }

  function render() {
    const box = $("reportList");
    box.setAttribute("aria-busy", String(state === "loading"));
    if (state === "loading") return (box.innerHTML = stateBox(`<span class="spinner chart-spinner" aria-hidden="true"></span>`, "Memuat laporan…"));
    if (state === "error") return (box.innerHTML = stateBox(`<span class="material-symbols-outlined" aria-hidden="true">error_outline</span>`, "Laporan gagal dimuat. Periksa koneksi dan izin admin.", `<button class="back-btn" data-act="retry" type="button"><span class="material-symbols-outlined" aria-hidden="true">refresh</span>Coba lagi</button>`, "alert"));
    if (!reports.length) return (box.innerHTML = stateBox(`<span class="material-symbols-outlined" aria-hidden="true">flag</span>`, "Belum ada laporan dari pengguna."));
    const list = filtered();
    if (!list.length) return (box.innerHTML = stateBox(`<span class="material-symbols-outlined" aria-hidden="true">search_off</span>`, "Tidak ada laporan yang cocok dengan filter."));
    box.innerHTML = `<div class="report-table" role="table" aria-label="Daftar laporan">
      <div class="report-row report-head" role="row"><span role="columnheader">Game</span><span role="columnheader">Kategori</span><span role="columnheader">Ringkasan</span><span role="columnheader">Status</span><span role="columnheader">Dibuat</span><span role="columnheader">Selesai</span><span></span></div>
      ${list.map(r => `<div class="report-row" role="row">
        <span class="r-game" role="cell"><b>${esc(r.gameTitle || "Tanpa nama game")}</b></span>
        <span role="cell"><span class="badge">${categoryLabel(r)}</span></span>
        <span class="r-msg" role="cell">${esc(summary(r.message)) || "<em>Tanpa pesan</em>"}</span>
        <span role="cell">${statusBadge(r)}</span>
        <span class="r-date" role="cell" title="${esc(fullDate(toDate(r.createdAt)))}"><i>Dibuat </i>${esc(relTime(toDate(r.createdAt)) || "—")}</span>
        <span class="r-date" role="cell">${r.completedAt ? `<i>Selesai </i>${esc(fullDate(toDate(r.completedAt)))}` : `<i>Selesai </i>—`}</span>
        <span class="r-act" role="cell"><button class="back-btn" data-act="open" data-id="${esc(r.id)}" type="button"><span class="material-symbols-outlined" aria-hidden="true">visibility</span>Detail</button></span>
      </div>`).join("")}</div>`;
  }

  $("reportList").addEventListener("click", e => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    if (b.dataset.act === "retry") load();
    if (b.dataset.act === "open") { openId = b.dataset.id; renderDetail(); $("detailOverlay").hidden = false; $("detailClose").focus(); }
  });

  function closeDetail() { openId = null; $("detailOverlay").hidden = true; }
  $("detailClose").onclick = closeDetail;
  $("detailOverlay").addEventListener("click", e => { if (e.target.id === "detailOverlay") closeDetail(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && openId) closeDetail(); });

  function renderDetail() {
    const r = reports.find(x => x.id === openId);
    if (!r) { closeDetail(); return; }
    $("detailTitle").textContent = r.gameTitle || "Tanpa nama game";
    $("detailSub").textContent = "ID laporan: " + r.id;
    const row = (k, v) => `<div class="d-row"><dt>${k}</dt><dd>${v}</dd></div>`;
    const gameLink = r.gameId ? `<a href="/game?slug=${encodeURIComponent(r.gameId)}" target="_blank" rel="noopener">${esc(r.gameId)}</a>` : "—";
    $("detailBody").innerHTML = `<dl class="detail-list">
        ${row("Status", statusBadge(r))}
        ${row("Kategori", categoryLabel(r))}
        ${row("ID game", gameLink)}
        ${row("Dibuat", esc(fullDate(toDate(r.createdAt))))}
        ${row("Diperbarui", esc(fullDate(toDate(r.updatedAt))))}
        ${row("Selesai", esc(fullDate(toDate(r.completedAt))))}
        ${row("Dihapus otomatis", r.expiresAt ? "Setelah " + esc(fullDate(toDate(r.expiresAt))) + " (bisa tertunda)" : "—")}
      </dl>
      <h4 class="d-label">Pesan</h4>
      <p class="d-message">${esc(r.message) || "<em>Tanpa pesan</em>"}</p>
      <h4 class="d-label">Ubah status</h4>
      <div class="seg d-status" role="group" aria-label="Ubah status">
        ${ReportRetention.REPORT_STATUSES.map(s => `<button type="button" data-status="${s}" class="${statusOf(r) === s ? "active" : ""}" ${statusOf(r) === s ? "disabled" : ""}>${STATUS_LABEL[s]}</button>`).join("")}
      </div>
      <div class="d-actions"><button class="back-btn danger" id="deleteReport" type="button"><span class="material-symbols-outlined" aria-hidden="true">delete</span>Hapus laporan</button></div>`;
    $("detailBody").querySelectorAll("[data-status]").forEach(b => (b.onclick = () => changeStatus(r, b.dataset.status)));
    $("deleteReport").onclick = () => removeReport(r);
  }

  async function changeStatus(r, status) {
    const msg = status === "completed"
      ? `Tandai laporan "${r.gameTitle || r.id}" selesai? Laporan akan terhapus otomatis sekitar 15 hari lagi.`
      : `Ubah status laporan "${r.gameTitle || r.id}" menjadi ${STATUS_LABEL[status]}?`;
    if (!confirm(msg)) return;
    try {
      const update = ReportRetention.buildStatusUpdate(status, new Date(), firebase.firestore.FieldValue.delete());
      await reportsRef.doc(r.id).update(update);
      toast("Status diperbarui: " + STATUS_LABEL[status]);
    } catch (err) {
      console.error(err);
      toast("Gagal mengubah status.", true);
    }
  }

  async function removeReport(r) {
    if (!confirm(`Hapus laporan "${r.gameTitle || r.id}" secara permanen?`)) return;
    try {
      await reportsRef.doc(r.id).delete();
      closeDetail();
      toast("Laporan dihapus.");
    } catch (err) {
      console.error(err);
      toast("Gagal menghapus laporan.", true);
    }
  }

  load();
}
