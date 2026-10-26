// ---------- Hidden admin login ----------
function checkAdminHash(){
    if (location.hash === "#admin-login") {
        window.location.replace("/admin/login");
    }
}
checkAdminHash();
window.addEventListener("hashchange", checkAdminHash);

// ---------- Console Registry ----------
// Sumber kebenaran buat chip kategori.
// Tambah console baru = tinggal tambah entry di sini.
// `active: false` = sembunyiin dari chip
// (console gak siap / coming soon).

const CONSOLE_LIST = [
    // ---------- PlayStation ----------
    { name: "PS1",                  active: true },
    { name: "PS2",                  active: true },
    { name: "PS3",                  active: true },
    { name: "PSP",                  active: true },
    { name: "PS Vita",              active: true },

    // ---------- Nintendo ----------
    { name: "NES",                  active: true },
    { name: "SNES",                 active: true },
    { name: "Game Boy",             active: true },
    { name: "Game Boy Color",       active: true },
    { name: "Game Boy Advance",     active: true },
    { name: "Nintendo DS",          active: true },
    { name: "Nintendo 3DS",         active: true },
    { name: "Nintendo 64",          active: true },
    { name: "GameCube",             active: true },
    { name: "Wii",                  active: true },
    { name: "Wii U",                active: true },
    { name: "Nintendo Switch",      active: true },

    // ---------- SEGA ----------
    { name: "Master System",        active: true },
    { name: "Game Gear",            active: true },
    { name: "Mega Drive / Genesis", active: true },
    { name: "Sega Saturn",          active: true },
    { name: "Dreamcast",            active: true },

    // ---------- Arcade ----------
    { name: "Arcade",               active: true },
    { name: "Neo Geo",              active: true },

    // ---------- Other Platforms ----------
    { name: "Gamehub",              active: true },
    { name: "Joiplay",              active: true },
    { name: "PC",                   active: true },
    { name: "Android",              active: true },

    // Belum memiliki konfigurasi emulator khusus
    { name: "Other",                active: false }
];

// ---------- Helpers ----------
const CONSOLE_COLORS = ["var(--red)","var(--purple)","var(--blue)","var(--amber)","var(--green)"];
function colorFor(consoleName){
    let hash = 0;
    for(const ch of String(consoleName || "Lainnya")) hash = (hash * 31 + ch.charCodeAt(0)) % CONSOLE_COLORS.length;
    return CONSOLE_COLORS[hash];
}

function normalizeConsoleName(value) {
    return String(value || "").normalize("NFKC").trim().toLocaleLowerCase("id-ID");
}

const CONSOLE_LOOKUP = new Map(
    CONSOLE_LIST.map(consoleItem => [normalizeConsoleName(consoleItem.name), consoleItem.name])
);

function canonicalConsoleName(value) {
    const normalized = normalizeConsoleName(value);
    return CONSOLE_LOOKUP.get(normalized) || String(value || "").trim();
}

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Bisa dipakai oleh script admin untuk menyimpan indeks pencarian.
window.generateTitleWords = generateTitleWords;
window.generateTitleSubstrings = generateTitleSubstrings;
window.buildGameSearchFields = buildGameSearchFields;


// ---------- Backfill Search Index ----------

async function backfillGameTitleSubstrings() {
    if (!isAdmin) {
        alert("Login admin terlebih dahulu.");
        return;
    }

    const confirmed = window.confirm(
        "Buat indeks pencarian untuk semua game di Firestore?"
    );

    if (!confirmed) return;

    const BATCH_SIZE = 400;

    let lastDoc = null;
    let scanned = 0;
    let updated = 0;

    try {
        while (true) {
            let query = gamesRef
                .orderBy(firebase.firestore.FieldPath.documentId())
                .limit(BATCH_SIZE);

            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }

            const snapshot = await query.get();

            if (snapshot.empty) break;

            const batch = gamesRef.firestore.batch();
            let batchUpdates = 0;

            for (const doc of snapshot.docs) {
                scanned++;

                const data = doc.data();
                const fields = buildGameSearchFields(data.title);

                const oldWords = Array.isArray(data.title_words)
                    ? data.title_words
                    : [];

                const oldSubstrings = Array.isArray(
                    data.title_substrings
                )
                    ? data.title_substrings
                    : [];

                const wordsMatch =
                    oldWords.length === fields.title_words.length &&
                    oldWords.every(
                        (value, index) =>
                            value === fields.title_words[index]
                    );

                const substringsMatch =
                    oldSubstrings.length ===
                        fields.title_substrings.length &&
                    oldSubstrings.every(
                        (value, index) =>
                            value === fields.title_substrings[index]
                    );

                if (wordsMatch && substringsMatch) continue;

                batch.update(doc.ref, {
                    title_words: fields.title_words,
                    title_substrings: fields.title_substrings
                });

                batchUpdates++;
            }

            if (batchUpdates > 0) {
                await batch.commit();
                updated += batchUpdates;
            }

            lastDoc = snapshot.docs[snapshot.docs.length - 1];

            console.info(
                `Backfill: diperiksa ${scanned}, diperbarui ${updated}`
            );

            if (snapshot.docs.length < BATCH_SIZE) break;
        }

        alert(
            "Backfill selesai!\n" +
            `Game diperiksa: ${scanned}\n` +
            `Game diperbarui: ${updated}`
        );

        return {
            completed: true,
            scanned,
            updated
        };
    } catch (error) {
        console.error("Backfill gagal:", error);

        alert(
            "Backfill gagal. Periksa console untuk detail error.\n" +
            error.message
        );

        return {
            completed: false,
            scanned,
            updated,
            error: error.message
        };
    }
}

window.backfillGameTitleSubstrings =
    backfillGameTitleSubstrings;

// ---------- State ----------
let allGames = [];
let activeConsole = "all";
let isAdmin = false;

const PAGE_SIZE = 15;

let lastVisibleDoc = null;
// Jumlah semua game dalam katalog
let catalogTotalCount = null;

// Jumlah game untuk filter yang sedang aktif
let activeTotalCount = null;
let hasMore = false;
let isLoading = false;
let queryVersion = 0;

// ---------- DOM ----------
const dashboardBtn = document.getElementById("dashboardBtn");
const logoutLink = document.getElementById("logoutLink");
const totalGamesBadge = document.getElementById("totalGamesBadge");
const totalGamesCount = document.getElementById("totalGamesCount");
const grid = document.getElementById("grid");
const search = document.getElementById("search");
const chipRow = document.getElementById("chipRow");
const loadMoreWrap = document.getElementById("loadMoreWrap");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const loadMoreCount = document.getElementById("loadMoreCount");
const loadMoreLabel = loadMoreBtn.querySelector(".load-more-label");

logoutLink.addEventListener("click", logout);

function updateTotalGamesStat() {
    if (catalogTotalCount !== null) {
        totalGamesCount.textContent = catalogTotalCount;
    } else if (activeConsole === "all") {
        totalGamesCount.textContent = allGames.length;
    } else {
        totalGamesCount.textContent = "—";
    }
}

// ---------- Auth state ----------
onAdminStateChanged((loggedIn) => {
    isAdmin = loggedIn;

    // Ganti logika addBtn dan roadmapBtn dengan ini:
    if (dashboardBtn) {
        dashboardBtn.style.display = loggedIn ? "inline-flex" : "none";
    }
    
    logoutLink.style.display = loggedIn ? "inline" : "none";
    totalGamesBadge.style.display = loggedIn ? "inline-flex" : "none";

    updateTotalGamesStat();
    renderGrid();
});

// ---------- Get total count via Firestore REST API ----------
async function getGamesCount(consoleName = "all") {
    const projectId = "emulator-games-id-bf695";
    const url =
        `https://firestore.googleapis.com/v1/projects/${projectId}` +
        `/databases/(default)/documents:runAggregationQuery`;

    const structuredQuery = {
        from: [{ collectionId: "games" }]
    };

    if (consoleName !== "all") {
        structuredQuery.where = {
            fieldFilter: {
                field: { fieldPath: "console" },
                op: "EQUAL",
                value: { stringValue: consoleName }
            }
        };
    }

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                structuredAggregationQuery: {
                    structuredQuery,
                    aggregations: [
                        { alias: "total", count: {} }
                    ]
                }
            })
        });

        if (!res.ok) {
            console.warn("Count REST gagal:", res.status);
            return null;
        }

        const data = await res.json();
        const raw = data[0]?.result?.aggregateFields?.total?.integerValue;

        return raw === undefined ? null : parseInt(raw, 10);
    } catch (err) {
        console.warn("Count REST error:", err);
        return null;
    }
}

// ---------- Build Firestore query ----------
function buildGamesQuery(consoleName = activeConsole) {
    let query = gamesRef;

    if (consoleName !== "all") {
        query = query.where("console", "==", canonicalConsoleName(consoleName));
    }

    return query.orderBy("createdAt", "desc");
}

// ---------- Load data for active console ----------
async function loadInitialData() {
    const version = ++queryVersion;
    const consoleName = activeConsole;

    isLoading = true;
    allGames = [];
    lastVisibleDoc = null;
    catalogTotalCount = null;
    activeTotalCount = null;
    hasMore = false;

    grid.innerHTML = `<div class="empty">Memuat game...</div>`;
    updateTotalGamesStat();
    updateLoadMoreButton();

    try {
        const [catalogCount, filteredCount, snap] = await Promise.all([
            getGamesCount("all"),
            getGamesCount(consoleName),
            buildGamesQuery(consoleName).limit(PAGE_SIZE).get()
        ]);

        // Abaikan hasil dari filter yang sudah tidak aktif.
        if (version !== queryVersion) return;

        allGames = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        lastVisibleDoc = snap.docs[snap.docs.length - 1] || null;

        catalogTotalCount = catalogCount;
        activeTotalCount = filteredCount;

        // Pagination mengikuti jumlah game pada filter aktif.
        if (activeTotalCount !== null) {
            hasMore = allGames.length < activeTotalCount;
        } else {
            hasMore = snap.docs.length === PAGE_SIZE;
        }

        updateTotalGamesStat();
        renderChips();

    } catch (err) {
        if (version !== queryVersion) return;

        console.error("Load data gagal:", err);
        grid.innerHTML =
            `<div class="empty">Gagal konek ke database.<br>` +
            `<span style="opacity:.6">${escapeHtml(err.message)}</span></div>`;

    } finally {
        if (version === queryVersion) {
            isLoading = false;
            renderGrid();
        }
    }
}

// ---------- Load more for active console ----------
async function loadMore() {
    if (isLoading || !hasMore || !lastVisibleDoc) return;

    const version = queryVersion;
    const consoleName = activeConsole;

    isLoading = true;
    updateLoadMoreButton();

    try {
        let query = buildGamesQuery(consoleName)
            .startAfter(lastVisibleDoc)
            .limit(PAGE_SIZE);

        const snap = await query.get();

        // Jangan campurkan hasil dari konsol sebelumnya.
        if (version !== queryVersion) return;

        const newGames = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        allGames = allGames.concat(newGames);

        if (snap.docs.length > 0) {
            lastVisibleDoc = snap.docs[snap.docs.length - 1];
        }

        if (activeTotalCount !== null) {
            hasMore = allGames.length < activeTotalCount;
        } else {
            hasMore = snap.docs.length === PAGE_SIZE;
        }
    } catch (err) {
        if (version === queryVersion) {
            console.error("Load more gagal:", err);
        }
    } finally {
        if (version === queryVersion) {
            isLoading = false;
            renderGrid();
        }
    }
}
// ---------- Load More event listener (attach SEKALI) ----------
loadMoreBtn.addEventListener("click", (e) => {
    if (!e.isTrusted) return;  // cuma respon click user asli
    loadMore();
});

// ---------- Chips (dari CONSOLE_LIST, bukan allGames) ----------
function renderChips(){
    chipRow.innerHTML = "";

    const makeChip = (label, value) => {
        const b = document.createElement("button");
        b.className = "chip" + (activeConsole === value ? " active" : "");
        b.textContent = label;
        b.addEventListener("click", () => {
            if (activeConsole === value) return;

            activeConsole = value;
            renderChips();
            loadInitialData();
         });
        return b;
    };

    chipRow.appendChild(makeChip("SEMUA", "all"));

    const registered = new Set();
    CONSOLE_LIST
        .filter(c => c.active)
        .forEach(c => {
            registered.add(normalizeConsoleName(c.name));
            chipRow.appendChild(makeChip(c.name.toUpperCase(), c.name));
        });

    // Jangan sembunyikan console yang sudah ada di Firestore tetapi belum masuk registry.
    // Ini menjaga data tetap bisa difilter sambil registry dirapikan.
    [...new Set(allGames.map(game => canonicalConsoleName(game.console)).filter(Boolean))]
        .filter(name => !registered.has(normalizeConsoleName(name)))
        .sort((a, b) => a.localeCompare(b, "id"))
        .forEach(name => chipRow.appendChild(makeChip(name.toUpperCase(), name)));
}

// ---------- Grid (cuma render game, gak nyentuh tombol Load More) ----------

function renderGrid(){
    const filtered = allGames.filter(g =>
        activeConsole === "all" ||
        normalizeConsoleName(g.console) === normalizeConsoleName(activeConsole)
    );

    grid.innerHTML = "";

    if (filtered.length === 0) {
    let emptyMsg;

    if (allGames.length === 0) {
        emptyMsg = "Belum ada game di katalog.";
    } else if (q) {
        emptyMsg = `Belum ada game yang cocok dengan "<b>${escapeHtml(q)}</b>".`
                 + `<br><span style="opacity:.6">Coba kata kunci lain, atau klik Load More.</span>`;
    } else if (activeConsole !== "all") {
        emptyMsg = `🎮 Game belum tersedia untuk konsol <b>${escapeHtml(activeConsole)}</b>.`
                 + `<br><span style="opacity:.6">Konsol ini direncanakan — pantau terus ya!</span>`;
    } else {
        emptyMsg = "Belum ada game yang cocok.";
    }

    grid.innerHTML = `<div class="empty">${emptyMsg}</div>`;
  } else {
        filtered.forEach(g => {
            const displayConsole = canonicalConsoleName(g.console) || "Lainnya";
            const color = colorFor(displayConsole);
            const detailUrl = `/game?slug=${encodeURIComponent(g.slug || g.id)}`;
            const card = document.createElement("div")
            card.className = "card";
            card.innerHTML = `
                <div class="card-strip" style="background:${color}"></div>
                <div class="card-body">
                    <span class="tag" style="background:${color}">${escapeHtml(displayConsole)}</span>
                    <h3>${escapeHtml(g.title || "Game tanpa judul")}</h3>
                    <div class="meta"><span>${escapeHtml(g.size || "-")}</span><span>siap main</span></div>
                    <div class="card-actions">
                        <a class="btn primary" data-act="open" href="${detailUrl}">DOWNLOAD</a>
                    </div>
                </div>
            `;

            let pressTimer = null;
            let longPressed = false;
            const startPress = (e) => {
                if (e.target.closest("[data-act]")) return;
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
						    if (longPressed) { e.preventDefault(); longPressed = false; }
						});

						// ⬇️ TAMBAH 2 BARIS INI
						card.addEventListener("contextmenu", (e) => e.preventDefault());
						card.addEventListener("selectstart", (e) => e.preventDefault());

						grid.appendChild(card);
				});
			}

    // Update tombol Load More (cuma visibility & label — gak recreate)
    updateLoadMoreButton();
}

function updateLoadMoreButton() {
    if (!hasMore) {
        loadMoreWrap.style.display = "none";
        return;
    }

    loadMoreWrap.style.display = "flex";
    loadMoreBtn.disabled = isLoading;
    loadMoreLabel.textContent = isLoading
        ? "Memuat..."
        : "↓ Load More";

    if (activeTotalCount !== null) {
        const remaining = Math.max(
            0,
            activeTotalCount - allGames.length
        );

        loadMoreCount.textContent =
            !isLoading && remaining > 0
                ? `(${remaining} lagi)`
                : "";
    } else {
        loadMoreCount.textContent = "";
    }
}

// ---------- Quick Card ----------
const modalOverlay = document.getElementById("modalOverlay");
const modalCard = document.getElementById("modalCard");

function openQuickCard(g, detailUrl){
    const color = colorFor(g.console || "Lainnya");
    document.getElementById("modalTag").textContent = g.console || "Lainnya";
    document.getElementById("modalTag").style.background = color;
    document.getElementById("modalTitle").textContent = g.title;
    document.getElementById("modalCover").style.backgroundImage = g.cover ? `url('${g.cover}')` : "none";

    const infoParts = [];
    if (g.genre) infoParts.push(g.genre);
    if (g.developer || g.publisher) {
        infoParts.push([g.developer, g.publisher].filter(Boolean).join(" / "));
    }
    if (g.releaseYear) infoParts.push(g.releaseYear);
    if (g.size) infoParts.push(g.size);
    if (g.rating) infoParts.push("⭐".repeat(Number(g.rating)));

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
    if (e.target === modalOverlay) closeQuickCard();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeQuickCard();
});
modalCard.addEventListener("click", (e) => e.stopPropagation());

// ---------- Scroll to Top (rocket) ----------
(function setupScrollTop(){
    const btn = document.getElementById("scrollTopBtn");
    if (!btn) return;

    let isLaunching = false;

    function checkVisibility(){
        if (isLaunching) return;
        if (window.scrollY > 400) {
            btn.classList.add("visible");
        } else {
            btn.classList.remove("visible");
        }
    }

    window.addEventListener("scroll", checkVisibility, { passive: true });
    checkVisibility();

    btn.addEventListener("click", () => {
        if (isLaunching) return;
        isLaunching = true;
        btn.classList.add("launching");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
            btn.classList.remove("launching");
            isLaunching = false;
            checkVisibility();
        }, 950);
    });
})();

// ---------- Welcome modal (per-hari) ----------
(function setupWelcomeModal(){
  const overlay = document.getElementById("welcomeOverlay");
  const continueBtn = document.getElementById("welcomeContinue");
  const sessionCheck = document.getElementById("welcomeSessionCheck");
  const storageKey = "emuzoneWelcomeLastSeen";
  if(!overlay || !continueBtn || !sessionCheck) return;

  const today = new Date().toISOString().slice(0, 10); // "2026-10-17"
  const lastSeen = localStorage.getItem(storageKey);

  const close = () => {
    if(sessionCheck.checked){
      localStorage.setItem(storageKey, today);
    }
    overlay.classList.remove("open");
    document.body.classList.remove("modal-open");
  };

  // Tampilkan hanya kalau belum lihat hari ini
  if(lastSeen !== today){
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

// ---------- Boot ----------
loadInitialData();