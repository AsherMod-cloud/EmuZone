// Pencatat traffic sederhana: 1 kunjungan per halaman per sesi browser.
// Data disimpan di collection "traffic", 1 dokumen per hari (YYYY-MM-DD).
(function () {
  try {
    if (typeof db === "undefined") return;
    const page = location.pathname.split("/")[1] || "home";
    const key = "ez_tr_" + page + "_" + location.search;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const d = new Date();
    const id = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const inc = firebase.firestore.FieldValue.increment(1);
    const data = { date: id, views: inc, pages: {} };
    data.pages[page.replace(/[^a-z0-9_-]/gi, "_")] = inc;
    db.collection("traffic").doc(id).set(data, { merge: true }).catch(() => {});
  } catch (e) {}
})();
