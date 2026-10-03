// Redirect hidden admin login
function checkAdminHash(){
    if (location.hash === "#admin-login") {
        window.location.replace("Login.html");
    }
}
checkAdminHash();
window.addEventListener("hashchange", checkAdminHash);

  const CONSOLE_COLORS = ["var(--red)","var(--purple)","var(--blue)","var(--amber)","var(--green)"];
  function colorFor(consoleName){
    let hash = 0;
    for(const ch of consoleName) hash = (hash * 31 + ch.charCodeAt(0)) % CONSOLE_COLORS.length;
    return CONSOLE_COLORS[hash];
  }

  let allGames = [];
  let activeConsole = "all";
  let isAdmin = false;

  // ---------- Auth ----------
  const addBtn = document.getElementById("addBtn");
  const roadmapBtn = document.getElementById("roadmapBtn");
  const logoutLink = document.getElementById("logoutLink");
  const totalGamesBadge = document.getElementById("totalGamesBadge");
  const totalGamesCount = document.getElementById("totalGamesCount");

  logoutLink.addEventListener("click", logout);

  function updateTotalGamesStat(){
    totalGamesCount.textContent = allGames.length;
  }

  onAdminStateChanged((loggedIn) => {

    isAdmin = loggedIn;

    addBtn.style.display = loggedIn
        ? "inline-flex"
        : "none";

    if (roadmapBtn) {
      roadmapBtn.style.display = loggedIn
          ? "inline-flex"
          : "none";
    }

    logoutLink.style.display = loggedIn
        ? "inline"
        : "none";

    totalGamesBadge.style.display = loggedIn
        ? "inline-flex"
        : "none";

    updateTotalGamesStat();

    renderGrid();

});

  // ---------- Live data ----------
  gamesRef.orderBy("createdAt", "desc").onSnapshot(snap => {
    allGames = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateTotalGamesStat();
    renderChips();
    renderGrid();
  }, err => {
    document.getElementById("grid").innerHTML =
      `<div class="empty">Gagal konek ke database. Cek firebaseConfig kamu di kode.<br><span style="opacity:.6">${err.message}</span></div>`;
  });

  // ---------- Chips (dynamic categories) ----------
  const chipRow = document.getElementById("chipRow");
  function renderChips(){
    const consoles = [...new Set(allGames.map(g => g.console).filter(Boolean))].sort();
    chipRow.innerHTML = "";
    const makeChip = (label, value) => {
      const b = document.createElement("button");
      b.className = "chip" + (activeConsole === value ? " active" : "");
      b.textContent = label;
      b.addEventListener("click", () => { activeConsole = value; renderChips(); renderGrid(); });
      return b;
    };
    chipRow.appendChild(makeChip("SEMUA", "all"));
    consoles.forEach(c => chipRow.appendChild(makeChip(c.toUpperCase(), c)));
  }

  // ---------- Grid ----------
  const grid = document.getElementById("grid");
  const search = document.getElementById("search");
  search.addEventListener("input", renderGrid);

  function renderGrid(){
    const q = search.value.trim().toLowerCase();
    const filtered = allGames.filter(g =>
      (activeConsole === "all" || g.console === activeConsole) &&
      (g.title || "").toLowerCase().includes(q)
    );

    grid.innerHTML = "";
    if(filtered.length === 0){
      grid.innerHTML = `<div class="empty">Belum ada game yang cocok. Coba kata kunci lain, atau request lewat WA.</div>`;
      return;
    }

    filtered.forEach(g => {
      const color = colorFor(g.console || "Lainnya");
      const detailUrl = `game.html?slug=${encodeURIComponent(g.slug || g.id)}`;
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-strip" style="background:${color}"></div>
        <div class="card-body">
          <span class="tag" style="background:${color}">${g.console || "Lainnya"}</span>
          <h3>${g.title}</h3>
          <div class="meta"><span>${g.size || "-"}</span><span>siap main</span></div>
          <div class="card-actions">
            <a class="btn primary" data-act="open" href="${detailUrl}">DOWNLOAD</a>
          </div>
        </div>
      `;

      // ---- Long press = Quick Card, tap biasa gak ngapa-ngapain selain lewat tombol ----
      let pressTimer = null;
      let longPressed = false;
      const startPress = (e) => {
        if(e.target.closest("[data-act]")) return;
        longPressed = false;
        pressTimer = setTimeout(() => {
          longPressed = true;
          openQuickCard(g, detailUrl);
        }, 500);
      };
      const cancelPress = () => clearTimeout(pressTimer);
      card.addEventListener("touchstart", startPress, { passive: true });
      card.addEventListener("touchend", cancelPress);
      card.addEventListener("touchmove", cancelPress);
      card.addEventListener("mousedown", startPress);
      card.addEventListener("mouseup", cancelPress);
      card.addEventListener("mouseleave", cancelPress);
      card.addEventListener("click", (e) => {
        if(longPressed){ e.preventDefault(); longPressed = false; }
      });

      grid.appendChild(card);
    });
  }

  // ---------- Quick Card (long-press preview) ----------
  const modalOverlay = document.getElementById("modalOverlay");
  const modalCard = document.getElementById("modalCard");

  function openQuickCard(g, detailUrl){
    const color = colorFor(g.console || "Lainnya");
    document.getElementById("modalTag").textContent = g.console || "Lainnya";
    document.getElementById("modalTag").style.background = color;
    document.getElementById("modalTitle").textContent = g.title;
    document.getElementById("modalCover").style.backgroundImage = g.cover ? `url('${g.cover}')` : "none";

    // Cuma informasi inti — genre, developer/publisher, tahun, size, rating
    const infoParts = [];
    if(g.genre) infoParts.push(g.genre);
    if(g.developer || g.publisher){
      infoParts.push([g.developer, g.publisher].filter(Boolean).join(" / "));
    }
    if(g.releaseYear) infoParts.push(g.releaseYear);
    if(g.size) infoParts.push(g.size);
    if(g.rating) infoParts.push("⭐".repeat(Number(g.rating)));
    document.getElementById("modalInfo").innerHTML = infoParts
      .map(p => `<span class="info-pill">${p}</span>`).join("");

    document.getElementById("modalViewDetails").href = detailUrl;

    modalOverlay.classList.add("open");
  }

  function closeQuickCard(){
    modalOverlay.classList.remove("open");
  }

  document.getElementById("modalClose").addEventListener("click", closeQuickCard);
  modalOverlay.addEventListener("click", (e) => {
    if(e.target === modalOverlay) closeQuickCard();
  });
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closeQuickCard();
  });
  modalCard.addEventListener("click", (e) => e.stopPropagation());

// ---------- Welcome modal (per-session) ----------
(function setupWelcomeModal(){
  const overlay = document.getElementById("welcomeOverlay");
  const continueBtn = document.getElementById("welcomeContinue");
  const sessionCheck = document.getElementById("welcomeSessionCheck");
  const sessionKey = "emulatorGamesIdWelcomeSeen";
  if(!overlay || !continueBtn || !sessionCheck) return;

  const close = () => {
    if(sessionCheck.checked){
      sessionStorage.setItem(sessionKey, "1");
    }
    overlay.classList.remove("open");
    document.body.classList.remove("modal-open");
  };

  if(!sessionStorage.getItem(sessionKey)){
    requestAnimationFrame(() => {
      overlay.classList.add("open");
      document.body.classList.add("modal-open");
    });
  } else {
    overlay.remove();
  }

  continueBtn.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if(event.target === overlay) close();
  });
  document.addEventListener("keydown", (event) => {
    if(event.key === "Escape" && overlay.classList.contains("open")) close();
  });
})();
