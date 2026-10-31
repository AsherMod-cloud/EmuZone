// Helper bersama untuk halaman admin (Reports). Gaya & teks mengikuti dashboard.
const AdminUtils = (() => {
  const $ = id => document.getElementById(id);
  const fmt = n => Number(n || 0).toLocaleString("id-ID");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function toDate(v) {
    if (!v) return null;
    if (v.toDate) return v.toDate();
    const d = new Date(v);
    return isNaN(d) ? null : d;
  }
  function relTime(d) {
    if (!d) return "";
    const s = (Date.now() - d.getTime()) / 1000;
    if (s < 60) return "baru saja";
    if (s < 3600) return Math.floor(s / 60) + " menit lalu";
    if (s < 86400) return Math.floor(s / 3600) + " jam lalu";
    if (s < 2592000) return Math.floor(s / 86400) + " hari lalu";
    return fullDate(d);
  }
  function fullDate(d) {
    return d ? d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  }
  function toast(msg, err) {
    const t = $("toast");
    t.textContent = msg;
    t.className = "toast show" + (err ? " error" : "");
    clearTimeout(t._t);
    t._t = setTimeout(() => (t.className = "toast"), 2500);
  }
  function statState(valueId, state, value) {
    const el = $(valueId);
    el.className = state === "success" ? "" : "stat-" + state;
    el.closest(".stat").setAttribute("aria-busy", String(state === "loading"));
    el.textContent = state === "loading" ? "Memuat…" : state === "error" ? "Gagal dimuat" : fmt(value);
  }
  return { $, fmt, esc, toDate, relTime, fullDate, toast, statState };
})();
