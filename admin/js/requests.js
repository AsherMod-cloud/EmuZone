guardAdminPage((user, profile) => initRequests());

function initRequests() {
  const $ = id => document.getElementById(id);
  const requestsRef = db.collection("requests");
  let unsubscribe = null;
  let requests = [];
  let filter = "pending";
  let state = "loading";

  const fmt = value => Number(value || 0).toLocaleString("id-ID");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  function toDate(value) {
    if (!value) return null;
    if (value.toDate) return value.toDate();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function relTime(date) {
    if (!date) return "";
    const seconds = (Date.now() - date.getTime()) / 1000;
    if (seconds < 60) return "baru saja";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }

  function toast(message, error = false) {
    const node = $("toast");
    node.textContent = message;
    node.className = `toast show${error ? " error" : ""}`;
    clearTimeout(node._timer);
    node._timer = setTimeout(() => { node.className = "toast"; }, 2500);
  }

  function setStat(id, value, detail) {
    const node = $(id);
    node.className = "";
    node.textContent = fmt(value);
    node.closest(".stat").setAttribute("aria-busy", "false");
    node.nextElementSibling.textContent = detail;
  }

  function render() {
    const container = $("reqList");
    container.setAttribute("aria-busy", String(state === "loading"));
    if (state !== "success") {
      container.innerHTML = state === "loading"
        ? `<div class="request-state" role="status"><span class="spinner chart-spinner" aria-hidden="true"></span><strong>Memuat request...</strong></div>`
        : `<div class="request-state request-error" role="alert"><span class="material-symbols-outlined" aria-hidden="true">error_outline</span><strong>Request gagal dimuat.</strong><button class="back-btn" data-act="retry" type="button"><span class="material-symbols-outlined" aria-hidden="true">refresh</span>Coba lagi</button></div>`;
      return;
    }

    const list = requests.filter(item => filter === "all" || (filter === "done" ? item.status === "done" : item.status !== "done"));
    if (!list.length) {
      const message = !requests.length ? "Belum ada request dari pengunjung." : filter === "pending" ? "Tidak ada request yang menunggu." : "Belum ada request yang selesai.";
      container.innerHTML = `<div class="request-state" role="status"><span class="material-symbols-outlined" aria-hidden="true">inbox</span><strong>${message}</strong></div>`;
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="req">
        <div>
          <h4>${esc(item.title || item.game || "Tanpa judul")}${item.status === "done" ? '<span class="badge done">Selesai</span>' : ""}${item.platform ? `<span class="badge">${esc(item.platform)}</span>` : ""}</h4>
          <div class="meta">${esc(item.name || "Anonim")} · ${relTime(toDate(item.createdAt))}</div>
          ${item.note || item.message ? `<div class="note">${esc(item.note || item.message)}</div>` : ""}
        </div>
        <div class="req-actions">
          <button class="icon-btn" data-act="toggle" data-id="${esc(item.id)}" title="${item.status === "done" ? "Tandai menunggu" : "Tandai selesai"}"><span class="material-symbols-outlined">${item.status === "done" ? "undo" : "check"}</span></button>
          <button class="icon-btn del" data-act="delete" data-id="${esc(item.id)}" title="Hapus"><span class="material-symbols-outlined">delete</span></button>
        </div>
      </div>`).join("");
  }

  function load() {
    if (unsubscribe) unsubscribe();
    state = "loading";
    render();
    unsubscribe = requestsRef.orderBy("createdAt", "desc").limit(200).onSnapshot(snapshot => {
      requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const pending = requests.filter(item => item.status !== "done").length;
      setStat("stPending", pending, "Request yang belum selesai");
      setStat("stDone", requests.length - pending, "Request yang sudah diproses");
      setStat("stTotal", requests.length, "Data yang tersimpan");
      state = "success";
      render();
    }, error => {
      console.error(error);
      state = "error";
      ["stPending", "stDone", "stTotal"].forEach(id => {
        const node = $(id);
        node.className = "stat-error";
        node.textContent = "Gagal dimuat";
      });
      render();
    });
  }

  $("reqSeg").addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    filter = button.dataset.f;
    $("reqSeg").querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
    render();
  });

  $("reqList").addEventListener("click", async event => {
  const button = event.target.closest("button[data-act]");
  if (!button) return;
  if (button.dataset.act === "retry") return load();
  if (state !== "success") return;
  const item = requests.find(entry => entry.id === button.dataset.id);
  if (!item) return;

  try {
    if (button.dataset.act === "delete") {
      if (!confirm(`Hapus request "${item.title || item.game || "Tanpa judul"}"?`)) return;
      await requestsRef.doc(item.id).delete();
      toast("Request dihapus.");
    } else {
      // ==========================================
      // UBAH BAGIAN INI BRO
      // ==========================================
      const newStatus = item.status === "done" ? "pending" : "done";
      
      // Pastikan report-retention.js udah di-load sebelum file ini!
      const now = new Date();
      const removeMarker = firebase.firestore.FieldValue.delete();
      const updateData = ReportRetention.buildStatusUpdate(newStatus, now, removeMarker);

      await requestsRef.doc(item.id).update(updateData);
      
      toast(newStatus === "done" ? "Ditandai selesai (Auto-delete 15 hari)." : "Dikembalikan ke menunggu.");
    }
  } catch (error) {
    console.error(error);
    toast("Aksi gagal. Cek izin Firestore.", true);
  }
});

  window.addEventListener("pagehide", () => { if (unsubscribe) unsubscribe(); });
  load();
}
