// Aturan status & retensi laporan/request. Dipakai di dashboard dan diuji terpisah.
(function (root) {
  // Tambahin "done" biar bisa dipake buat Request
  const REPORT_STATUSES = ["pending", "in_progress", "completed", "done"];
  const RETENTION_DAYS = 15;
  const DAY_MS = 86400000;

  // Field yang harus ditulis saat status berubah. `remove` diisi penanda hapus field Firestore.
  function buildStatusUpdate(status, now, remove) {
    if (!REPORT_STATUSES.includes(status)) throw new Error("Status tidak valid: " + status);
    
    const update = { status, updatedAt: now };
    
    // Kalau statusnya "completed" (Report) ATAU "done" (Request)
    if (status === "completed" || status === "done") {
      update.completedAt = now;
      update.expiresAt = new Date(now.getTime() + RETENTION_DAYS * DAY_MS);
    } else {
      update.completedAt = remove;
      update.expiresAt = remove;
    }
    return update;
  }

  const api = { REPORT_STATUSES, RETENTION_DAYS, buildStatusUpdate };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ReportRetention = api;
})(typeof window !== "undefined" ? window : globalThis);