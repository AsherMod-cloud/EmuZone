guardAdminPage((user, profile) => initDashboard(profile));

function initDashboard(profile) {
  const $ = id => document.getElementById(id);
  const fmt = n => Number(n || 0).toLocaleString("id-ID");
  // Aktifkan hanya setelah form request dan izin akses admin tersedia.
  const requestsEnabled = document.body.dataset.requestsEnabled === "true";
  const requestsRef = requestsEnabled ? db.collection("requests") : null;
  let unsubscribeRequests = null;
  const trafficRef = db.collection("traffic");
  let trafficDays = [];
  let range = 14;
  let reqFilter = "pending";
  let requests = [];
  let trafficState = "loading";
  let requestState = requestsEnabled ? "loading" : "unavailable";

  function statState(valueId, detailId, state, value, detail) {
    const el = $(valueId);
    el.className = state === "success" ? "" : "stat-" + state;
    el.closest(".stat").setAttribute("aria-busy", String(state === "loading"));
    el.textContent = state === "loading" ? "Memuat…" : state === "error" ? "Gagal dimuat" : state === "unavailable" ? "Belum aktif" : fmt(value);
    $(detailId).className = "";
    $(detailId).textContent = detail;
  }

  $("logoutBtn").onclick = () => logout();

  function toast(msg, err) {
    const t = $("toast");
    t.textContent = msg;
    t.className = "toast show" + (err ? " error" : "");
    clearTimeout(t._t);
    t._t = setTimeout(() => (t.className = "toast"), 2500);
  }

  function dayId(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
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
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- TRAFFIC ----------
async function loadTraffic() {
    trafficState = "loading";
    statState("stToday", "stTodayDiff", "loading", null, "Mengambil kunjungan hari ini");
    statState("stMonth", "stAvg", "loading", null, "Mengambil kunjungan 30 hari");
    renderChart();

    // ==========================================
    // 1. AMBIL DATA FIRESTORE DULU (Buat Grafik & Fallback)
    // ==========================================
    const start = new Date();
    start.setDate(start.getDate() - 29);
    const map = {};
    
    try {
        const snap = await trafficRef.where("date", ">=", dayId(start)).get();
        snap.forEach(doc => (map[doc.id] = doc.data()));
    } catch (e) {
        console.error("Gagal ambil data Firestore:", e);
    }

    // Susun data grafik
    trafficDays = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const id = dayId(d);
        trafficDays.push({ date: d, views: map[id]?.views || 0, pages: map[id]?.pages || {} });
    }

    // Simpan angka dari Firestore buat jaga-jaga
    const fsToday = trafficDays[29].views;
    const fsYesterday = trafficDays[28].views;
    const fsMonth = trafficDays.reduce((a, b) => a + b.views, 0);

    trafficState = "success";
    renderChart(); // Render grafiknya sekarang

    // ==========================================
    // 2. AMBIL DATA DARI CLOUDFLARE API (Buat Stat Card)
    // ==========================================
    try {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error("Gagal fetch /api/stats");
        const cfStats = await res.json();

        // Pakai data dari CF
        const today = cfStats.today.visits;
        const yesterday = cfStats.yesterday.visits;
        const month = cfStats.month.visits;

        statState("stToday", "stTodayDiff", "success", today, "Kemarin: " + fmt(yesterday));
        if (yesterday > 0) {
            const p = Math.round(((today - yesterday) / yesterday) * 100);
            $("stTodayDiff").textContent = (p >= 0 ? "▲ " : "▼ ") + Math.abs(p) + "% dari kemarin";
            $("stTodayDiff").className = p >= 0 ? "up" : "down";
        } else {
            $("stTodayDiff").textContent = "Kemarin: 0";
        }
        statState("stMonth", "stAvg", "success", month, "Rata-rata " + fmt(Math.round(month / 30)) + "/hari");

    } catch (e) {
        console.warn("CF API Gagal, fallback ke data Firestore:", e);
        
        // ==========================================
        // 3. FALLBACK: Pakai data Firestore kalau CF Error
        // ==========================================
        statState("stToday", "stTodayDiff", "success", fsToday, "Kemarin: " + fmt(fsYesterday));
        if (fsYesterday > 0) {
            const p = Math.round(((fsToday - fsYesterday) / fsYesterday) * 100);
            $("stTodayDiff").textContent = (p >= 0 ? "▲ " : "▼ ") + Math.abs(p) + "% dari kemarin";
            $("stTodayDiff").className = p >= 0 ? "up" : "down";
        } else {
            $("stTodayDiff").textContent = "Kemarin: 0";
        }
        statState("stMonth", "stAvg", "success", fsMonth, "Rata-rata " + fmt(Math.round(fsMonth / 30)) + "/hari");
    }
}

  function renderChart() {
    const chart = $("chart");
    chart.setAttribute("aria-busy", String(trafficState === "loading"));
    $("topPages").innerHTML = "";
    $("topPages").hidden = true;
    if (trafficState !== "success") {
      chart.className = "chart chart-state";
      chart.innerHTML = trafficState === "loading"
        ? `<div class="chart-message" role="status"><span class="spinner chart-spinner" aria-hidden="true"></span><strong>Memuat kunjungan…</strong></div>`
        : `<div class="chart-message" role="alert"><span class="material-symbols-outlined chart-error-icon" aria-hidden="true">error_outline</span><strong>Gagal memuat data kunjungan</strong><p>Periksa koneksi dan izin akses, lalu coba kembali.</p><button class="back-btn" id="retryTraffic" type="button"><span class="material-symbols-outlined" aria-hidden="true">refresh</span>Coba lagi</button></div>`;
      const retry = $("retryTraffic");
      if (retry) retry.onclick = loadTraffic;
      return;
    }
    const days = trafficDays.slice(-range);
    if (!days.some(d => d.views > 0)) {
      chart.className = "chart chart-state";
      chart.innerHTML = `<div class="chart-message" role="status"><span class="material-symbols-outlined" aria-hidden="true">bar_chart</span><strong>Belum ada data kunjungan</strong><p>Statistik akan muncul setelah kunjungan tercatat.</p></div>`;
      return;
    }
    chart.className = "chart";
    const max = Math.max(1, ...days.map(d => d.views));
    const step = range > 14 ? 5 : range > 7 ? 2 : 1;
    $("chart").innerHTML = days.map((d, i) => `
      <div class="bar-col" title="${d.date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}: ${fmt(d.views)} kunjungan">
        <span class="bar-val">${fmt(d.views)}</span>
        <div class="bar-slot"><div class="bar" style="height:${(d.views / max) * 100}%"></div></div>
        ${i % step === 0 || i === days.length - 1 ? `<span class="bar-lbl">${d.date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>` : ""}
      </div>`).join("");

    const pages = {};
    days.forEach(d => Object.entries(d.pages).forEach(([k, v]) => (pages[k] = (pages[k] || 0) + v)));
    const names = { home: "Beranda", game: "Halaman game", search: "Pencarian" };
    const top = Object.entries(pages).sort((a, b) => b[1] - a[1]).slice(0, 6);
    $("topPages").innerHTML = top.length
      ? top.map(([k, v]) => `<span class="chip">${esc(names[k] || k)}<b>${fmt(v)}</b></span>`).join("")
      : "";
    $("topPages").hidden = !top.length;
  }

  $("rangeSeg").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    range = Number(b.dataset.r);
    $("rangeSeg").querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
    renderChart();
  });

  // ---------- GAMES ----------
  async function loadGames() {
    statState("stGames", "stGamesNew", "loading", null, "Mengambil koleksi game");
    $("statusList").setAttribute("aria-busy", "true");
    $("statusList").innerHTML = `<div class="game-state" role="status">Memuat status game…</div>`;
    $("latestGames").innerHTML = `<li><small>Memuat game terbaru…</small></li>`;
    try {
      const snap = await gamesRef.get();
      $("statusList").setAttribute("aria-busy", "false");
      const games = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      statState("stGames", "stGamesNew", "success", games.length, "Tidak ada tambahan minggu ini");
      const weekAgo = Date.now() - 7 * 86400000;
      const fresh = games.filter(g => (toDate(g.createdAt)?.getTime() || 0) > weekAgo).length;
      $("stGamesNew").textContent = fresh ? `+${fresh} minggu ini` : "Tidak ada tambahan minggu ini";
      if (fresh) $("stGamesNew").className = "up";

      const plat = {};
      games.forEach(g => {
        const k = g.platform || g.console || g.emulator || "Lainnya";
        plat[k] = (plat[k] || 0) + 1;
      });
      const pmax = Math.max(1, ...Object.values(plat));
      const platformEntries = Object.entries(plat).sort((a, b) => b[1] - a[1]);
      const equalCounts = platformEntries.length > 1 && platformEntries.every(([, count]) => count === platformEntries[0][1]);
      $("platformNote").textContent = equalCounts ? "Jumlah game sama di semua platform." : "";
      $("platformNote").hidden = !equalCounts;
      $("platformList").innerHTML = platformEntries.map(([k, v]) => `
        <div><div class="brow-top"><span>${esc(k)}</span><span>${fmt(v)} game</span></div>
        <div class="track" role="meter" aria-label="${esc(k)}: ${fmt(v)} game" aria-valuemin="0" aria-valuemax="${pmax}" aria-valuenow="${v}"><div class="fill" style="width:${(v / pmax) * 100}%"></div></div></div>`).join("") || `<div class="empty">Belum ada game</div>`;

      const st = { Playable: 0, Testing: 0, Broken: 0, Unknown: 0 };
      games.forEach(g => {
        const key = ["Playable", "Testing", "Broken"].includes(g.status) ? g.status : "Unknown";
        st[key]++;
      });
      const label = { Playable: ["Bisa dimainkan", "ok"], Testing: ["Uji coba", "warn"], Broken: ["Bermasalah", "bad"], Unknown: ["Belum dikategorikan", "unknown"] };
      const total = Math.max(1, games.length);
      const populated = Object.entries(st).filter(([, count]) => count > 0);
      const statusList = $("statusList");
      statusList.dataset.mode = !games.length ? "empty" : populated.length === 1 ? "compact" : "full";
      const row = ([key, count]) => `<div><div class="brow-top"><span>${label[key][0]}</span><span>${fmt(count)} · ${Math.round((count / total) * 100)}%</span></div><div class="track" role="meter" aria-label="${label[key][0]}" aria-valuemin="0" aria-valuemax="${games.length}" aria-valuenow="${count}"><div class="fill ${label[key][1]}" style="width:${(count / total) * 100}%"></div></div></div>`;
      statusList.innerHTML = !games.length
        ? `<div class="game-state" role="status">Belum ada game</div>`
        : populated.length === 1
          ? row(populated[0])
          : Object.entries(st).filter(([key, count]) => key !== "Unknown" || count > 0).map(row).join("");

      const latest = games.filter(g => toDate(g.createdAt)).sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()).slice(0, 5);
      $("latestGames").innerHTML = latest.map(g => {
        const title = esc(g.title || g.id);
        const platform = esc(g.platform || g.console || g.emulator || "Platform belum tersedia");
        const href = "/game?slug=" + encodeURIComponent(g.slug || g.id);
        return `<li><div class="latest-info"><a class="latest-title" href="${href}">${title}</a><div class="latest-meta"><span class="badge platform-badge">${platform}</span><small>${relTime(toDate(g.createdAt))}</small></div></div><a class="icon-btn latest-open" href="${href}" title="Buka detail ${title}" aria-label="Buka detail ${title}"><span class="material-symbols-outlined" aria-hidden="true">arrow_outward</span></a></li>`;
      }).join("") || `<li><small>Belum ada data game terbaru</small></li>`;
    } catch (e) {
      console.error(e);
      statState("stGames", "stGamesNew", "error", null, "Data koleksi tidak tersedia");
      $("statusList").setAttribute("aria-busy", "false");
      $("statusList").dataset.mode = "error";
      $("statusList").innerHTML = `<div class="game-state game-error" role="alert">Gagal memuat status game</div>`;
      $("latestGames").innerHTML = `<li><small>Gagal memuat game terbaru</small></li>`;
      toast("Gagal memuat data game.", true);
    }
  }

  // ---------- REQUESTS ----------
  function loadRequests() {
    if (unsubscribeRequests) {
      unsubscribeRequests();
      unsubscribeRequests = null;
    }
    $("reqSeg").querySelectorAll("button").forEach(button => { button.disabled = !requestsEnabled; });
    if (!requestsRef) {
      requestState = "unavailable";
      statState("stReq", "stReqTotal", "unavailable", null, "Fitur request belum tersedia");
      renderRequests();
      return;
    }
    requestState = "loading";
    statState("stReq", "stReqTotal", "loading", null, "Mengambil request user");
    renderRequests();
    try {
      unsubscribeRequests = requestsRef.orderBy("createdAt", "desc").limit(200).onSnapshot(snap => {
        requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const pending = requests.filter(r => r.status !== "done").length;
        requestState = "success";
        statState("stReq", "stReqTotal", "success", pending, `${fmt(requests.length)} request dimuat`);
        renderRequests();
      }, requestFailed);
    } catch (err) {
      requestFailed(err);
    }
  }

  function requestFailed(err) {
    console.error(err);
    requestState = "error";
    statState("stReq", "stReqTotal", "error", null, "Data request tidak tersedia");
    renderRequests();
  }

  window.addEventListener("pagehide", () => {
    if (unsubscribeRequests) unsubscribeRequests();
  });

  function renderRequests() {
    const container = $("reqList");
    container.setAttribute("aria-busy", String(requestState === "loading"));
    if (requestState !== "success") {
      container.innerHTML = requestState === "unavailable"
        ? `<div class="request-state" role="status"><span class="material-symbols-outlined" aria-hidden="true">inbox</span><strong>Fitur request belum tersedia.</strong></div>`
        : requestState === "loading"
          ? `<div class="request-state" role="status"><span class="spinner chart-spinner" aria-hidden="true"></span><strong>Memuat request...</strong></div>`
          : `<div class="request-state request-error" role="alert"><span class="material-symbols-outlined" aria-hidden="true">error_outline</span><strong>Request gagal dimuat.</strong><button class="back-btn" data-act="retry" type="button"><span class="material-symbols-outlined" aria-hidden="true">refresh</span>Coba lagi</button></div>`;
      return;
    }
    const list = requests.filter(r => reqFilter === "all" || (reqFilter === "done" ? r.status === "done" : r.status !== "done"));
    if (!list.length) {
      const message = !requests.length ? "Belum ada request dari pengunjung." : reqFilter === "pending" ? "Tidak ada request yang menunggu." : "Belum ada request yang selesai.";
      container.innerHTML = `<div class="request-state" role="status"><span class="material-symbols-outlined" aria-hidden="true">inbox</span><strong>${message}</strong></div>`;
      return;
    }
    $("reqList").innerHTML = list.map(r => `
      <div class="req">
        <div>
          <h4>${esc(r.title || r.game || "Tanpa judul")}${r.status === "done" ? `<span class="badge done">Selesai</span>` : ""}${r.platform ? `<span class="badge">${esc(r.platform)}</span>` : ""}</h4>
          <div class="meta">${esc(r.name || "Anonim")} · ${relTime(toDate(r.createdAt))}</div>
          ${r.note || r.message ? `<div class="note">${esc(r.note || r.message)}</div>` : ""}
        </div>
        <div class="req-actions">
          <button class="icon-btn" data-act="toggle" data-id="${r.id}" title="${r.status === "done" ? "Tandai menunggu" : "Tandai selesai"}">
            <span class="material-symbols-outlined">${r.status === "done" ? "undo" : "check"}</span></button>
          <button class="icon-btn del" data-act="del" data-id="${r.id}" title="Hapus"><span class="material-symbols-outlined">delete</span></button>
        </div>
      </div>`).join("");
  }

  $("reqSeg").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    reqFilter = b.dataset.f;
    $("reqSeg").querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
    renderRequests();
  });

  $("reqList").addEventListener("click", async e => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    if (b.dataset.act === "retry") { loadRequests(); return; }
    if (!requestsRef || requestState !== "success") return;
    const r = requests.find(x => x.id === b.dataset.id);
    if (!r) return;
    try {
      if (b.dataset.act === "del") {
        if (!confirm(`Hapus request "${r.title || r.game}"?`)) return;
        await requestsRef.doc(r.id).delete();
        toast("Request dihapus.");
      } else {
        const done = r.status !== "done";
        await requestsRef.doc(r.id).update({ status: done ? "done" : "pending" });
        toast(done ? "Ditandai selesai." : "Dikembalikan ke menunggu.");
      }
    } catch (err) {
      console.error(err);
      toast("Aksi gagal. Cek izin Firestore.", true);
    }
  });

  loadTraffic();
  loadGames();
  loadRequests();
}
