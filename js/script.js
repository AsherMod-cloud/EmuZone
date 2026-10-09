// ---------- Hidden admin login ----------
function checkAdminHash(){
    if (location.hash === "#admin-login") {
        window.location.replace("Login.html");
    }
}
checkAdminHash();
window.addEventListener("hashchange", checkAdminHash);

// ---------- Helpers ----------
const CONSOLE_COLORS = ["var(--red)","var(--purple)","var(--blue)","var(--amber)","var(--green)"];
function colorFor(consoleName){
    let hash = 0;
    for(const ch of consoleName) hash = (hash * 31 + ch.charCodeAt(0)) % CONSOLE_COLORS.length;
    return CONSOLE_COLORS[hash];
}

// ---------- State ----------
let allGames = [];
let activeConsole = "all";
let isAdmin = false;

const PAGE_SIZE = 15;
let lastVisibleDoc = null;
let totalCount = 0;
let hasMore = false;
let isLoading = false;

// ---------- DOM ----------
const addBtn = document.getElementById("addBtn");
const roadmapBtn = document.getElementById("roadmapBtn");
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

function updateTotalGamesStat(){
    // Kalau count valid, tampil total. Kalau gak, tampil jumlah yang ke-load.
    const display = (totalCount !== null) ? totalCount : allGames.length;
    totalGamesCount.textContent = display;
}

// ---------- Auth state ----------
onAdminStateChanged((loggedIn) => {
    isAdmin = loggedIn;

    addBtn.style.display = loggedIn ? "inline-flex" : "none";
    if (roadmapBtn) {
        roadmapBtn.style.display = loggedIn ? "inline-flex" : "none";
    }
    logoutLink.style.display = loggedIn ? "inline" : "none";
    totalGamesBadge.style.display = loggedIn ? "inline-flex" : "none";

    updateTotalGamesStat();
    renderGrid();
});

// ---------- Get total count via Firestore REST API ----------
async function getGamesCount() {
    const projectId = "emulator-games-id-bf695";
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runAggregationQuery`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                structuredAggregationQuery: {
                    structuredQuery: {
                        from: [{ collectionId: "games" }]
                    },
                    aggregations: [{ alias: "total", count: {} }]
                }
            })
        });

        if (!res.ok) {
            console.warn("Count REST gagal:", res.status);
            return null;  // ⬅️ NULL = gagal, bukan 0
        }

        const data = await res.json();
        const raw = data[0]?.result?.aggregateFields?.total?.integerValue;
        
        if (raw === undefined) {
            console.warn("Count response format tidak terduga:", data);
            return null;
        }
        
        return parseInt(raw, 10);
    } catch (err) {
        console.warn("Count REST error:", err);
        return null;  // ⬅️ NULL = gagal
    }
}

// ---------- Load data (paginated) ----------
async function loadInitialData(){
    if (isLoading) return;
    isLoading = true;
    grid.innerHTML = `<div class="empty">Memuat game...</div>`;

    let success = false;

    try {
        const [countResult, snap] = await Promise.all([
            getGamesCount(),
            gamesRef.orderBy("createdAt", "desc").limit(PAGE_SIZE).get()
        ]);

        allGames = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        lastVisibleDoc = snap.docs[snap.docs.length - 1] || null;

        // ⬇️ Bedain: count valid vs count gagal
        if (countResult !== null) {
            totalCount = countResult;                    // count valid
            hasMore = allGames.length < totalCount;      // akurat!
        } else {
            totalCount = null;                           // count gagal
            hasMore = snap.docs.length === PAGE_SIZE;    // fallback: cek batch penuh
        }

        updateTotalGamesStat();
        renderChips();
        success = true;
    } catch (err) {
        grid.innerHTML = `<div class="empty">Gagal konek ke database.<br><span style="opacity:.6">${err.message}</span></div>`;
    } finally {
        isLoading = false;
        if (success) renderGrid();
    }
}

async function loadMore(){
    if (isLoading || !hasMore || !lastVisibleDoc) return;

    isLoading = true;
    loadMoreBtn.disabled = true;
    loadMoreLabel.textContent = "Memuat...";
    loadMoreCount.textContent = "";

    try {
        const snap = await gamesRef
            .orderBy("createdAt", "desc")
            .startAfter(lastVisibleDoc)
            .limit(PAGE_SIZE)
            .get();

        const newGames = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        allGames = allGames.concat(newGames);

        if (snap.docs.length > 0) {
            lastVisibleDoc = snap.docs[snap.docs.length - 1];
        }

        // ⬇️ Update hasMore dengan logika yang bener
        if (totalCount !== null) {
            // Count valid: hasMore = masih ada sisa
            hasMore = allGames.length < totalCount;
        } else {
            // Count gagal: fallback ke batch-based
            hasMore = snap.docs.length === PAGE_SIZE;
        }

        updateTotalGamesStat();
        renderChips();
    } catch (err) {
        console.error("Load more gagal:", err);
    } finally {
        isLoading = false;
        renderGrid();
    }
}

// ---------- Load More event listener (attach SEKALI) ----------
loadMoreBtn.addEventListener("click", (e) => {
    if (!e.isTrusted) return;  // cuma respon click user asli
    loadMore();
});

// ---------- Chips ----------  
function renderChips(){
    const consoles = [...new Set(allGames.map(g => g.console).filter(Boolean))].sort();
    chipRow.innerHTML = "";

    const makeChip = (label, value) => {
        const b = document.createElement("button");
        b.className = "chip" + (activeConsole === value ? " active" : "");
        b.textContent = label;
        b.addEventListener("click", () => {
            activeConsole = value;
            renderChips();
            renderGrid();
        });
        return b;
    };

    chipRow.appendChild(makeChip("SEMUA", "all"));
    consoles.forEach(c => chipRow.appendChild(makeChip(c.toUpperCase(), c)));
}

// ---------- Grid (cuma render game, gak nyentuh tombol Load More) ----------
search.addEventListener("input", renderGrid);

function renderGrid(){
    const q = search.value.trim().toLowerCase();
    const filtered = allGames.filter(g =>
        (activeConsole === "all" || g.console === activeConsole) &&
        (g.title || "").toLowerCase().includes(q)
    );

    grid.innerHTML = "";

    if (filtered.length === 0) {
        const emptyMsg = allGames.length === 0
            ? "Belum ada game di katalog."
            : "Belum ada game yang cocok. Coba kata kunci lain, atau Load More.";
        grid.innerHTML = `<div class="empty">${emptyMsg}</div>`;
    } else {
        filtered.forEach(g => {
            const color = colorFor(g.console || "Lainnya");
            const detailUrl = `game.html?slug=${encodeURIComponent(g.slug || g.id)}`;
            const card = document.createElement("div")
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

            grid.appendChild(card);
        });
    }

    // Update tombol Load More (cuma visibility & label — gak recreate)
    updateLoadMoreButton();
}

function updateLoadMoreButton(){
    if (!hasMore) {
        loadMoreWrap.style.display = "none";
        return;
    }

    loadMoreWrap.style.display = "flex";
    loadMoreBtn.disabled = isLoading;
    loadMoreLabel.textContent = isLoading ? "Memuat..." : "↓ Load More";

    // Cuma tampil angka sisa kalau totalCount valid
    if (totalCount !== null) {
        const remaining = totalCount - allGames.length;
        loadMoreCount.textContent = (!isLoading && remaining > 0) ? `(${remaining} lagi)` : "";
    } else {
        loadMoreCount.textContent = "";  // count gagal → gak nampilin angka
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

// ---------- Welcome modal ----------
(function setupWelcomeModal(){
    const overlay = document.getElementById("welcomeOverlay");
    const continueBtn = document.getElementById("welcomeContinue");
    const sessionCheck = document.getElementById("welcomeSessionCheck");
    const sessionKey = "emulatorGamesIdWelcomeSeen";
    if (!overlay || !continueBtn || !sessionCheck) return;

    const close = () => {
        if (sessionCheck.checked) {
            sessionStorage.setItem(sessionKey, "1");
        }
        overlay.classList.remove("open");
        document.body.classList.remove("modal-open");
    };

    if (!sessionStorage.getItem(sessionKey)) {
        requestAnimationFrame(() => {
            overlay.classList.add("open");
            document.body.classList.add("modal-open");
        });
    } else {
        overlay.remove();
    }

    continueBtn.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && overlay.classList.contains("open")) close();
    });
})();

// ---------- Boot ----------
loadInitialData();