(function () {
    "use strict";

    // Search punya state sendiri, tidak memakai allGames dari index.html.
    let searchGames = [];
    let currentPage = 1;
    let isSearching = false;
    let currentQuery = "";
    let searchRequestId = 0;

    const PAGE_SIZE = 20;

    const form = document.getElementById("searchForm");
    const input = document.getElementById("searchInput");
    const grid = document.getElementById("searchGrid");
    const resultInfo = document.getElementById("resultInfo");
    const pageInfo = document.getElementById("pageInfo");
    const pagination = document.getElementById("pagination");
    const pageNumber = document.getElementById("pageNumber");
    const prevPage = document.getElementById("prevPage");
    const nextPage = document.getElementById("nextPage");
    const searchTitle = document.getElementById("searchTitle");

    const COLORS = [
        "var(--red)",
        "var(--purple)",
        "var(--blue)",
        "var(--amber)",
        "var(--green)"
    ];

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function colorFor(consoleName) {
        let hash = 0;
        const value = String(consoleName || "Lainnya");

        for (let i = 0; i < value.length; i++) {
            hash = (hash * 31 + value.charCodeAt(i)) % COLORS.length;
        }

        return COLORS[hash];
    }

    function normalizeWord(word) {
        return word
            .toLocaleLowerCase("id-ID")
            .normalize("NFKC")
            .replace(/[^\p{L}\p{N}]/gu, "");
    }

    function tokenize(query) {
        return query
            .trim()
            .split(/\s+/)
            .map(normalizeWord)
            .filter(Boolean);
    }

    function getTitleWords(game) {
        if (Array.isArray(game.title_words) && game.title_words.length) {
            return game.title_words.map(normalizeWord).filter(Boolean);
        }
        return String(game.title || "")
            .toLocaleLowerCase("id-ID")
            .normalize("NFKC")
            .split(/[^\p{L}\p{N}]+/u)
            .map(normalizeWord)
            .filter(Boolean);
    }

    function getTitleSubstrings(game) {
        if (Array.isArray(game.title_substrings) && game.title_substrings.length) {
            return game.title_substrings.map(normalizeWord).filter(Boolean);
        }
        return [];
    }

    function matchesAllWords(game, queryWords) {
        const titleWords = getTitleWords(game);
        const titleSubstrings = getTitleSubstrings(game);
        return queryWords.every(function (word) {
            return titleWords.some(titleWord => titleWord === word || titleWord.includes(word))
                || titleSubstrings.includes(word);
        });
    }

    function showMessage(message) {
        grid.innerHTML =
            '<div class="empty">' + escapeHtml(message) + '</div>';
        pagination.hidden = true;
        pageInfo.textContent = "";
    }

    function renderResults() {
        const total = searchGames.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const start = (currentPage - 1) * PAGE_SIZE;
        const pageGames = searchGames.slice(start, start + PAGE_SIZE);

        resultInfo.textContent =
            total + (total === 1 ? " game ditemukan" : " game ditemukan");

        pageInfo.textContent = total
            ? "Menampilkan " + (start + 1) + "–" +
              Math.min(start + PAGE_SIZE, total) + " dari " + total
            : "";

        pageNumber.textContent = currentPage + " / " + totalPages;
        prevPage.disabled = currentPage <= 1;
        nextPage.disabled = currentPage >= totalPages;
        pagination.hidden = total <= PAGE_SIZE;

        grid.innerHTML = "";

        if (!pageGames.length) {
            showMessage("Tidak ada game yang cocok dengan pencarian ini. klik tombol 'Request Game' untuk membuka Request form");
            resultInfo.textContent = "0 game ditemukan";
            return;
        }

        pageGames.forEach(function (game) {
            const title = game.title || "Game tanpa judul";
            const consoleName = game.console || "Lainnya";
            const color = colorFor(consoleName);
            const detailUrl =
                "game.html?slug=" +
                encodeURIComponent(game.slug || game.id);

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <div class="card-strip" style="background:${color}"></div>
                <div class="card-body">
                    <span class="tag" style="background:${color}">
                        ${escapeHtml(consoleName)}
                    </span>
                    <h3>${escapeHtml(title)}</h3>
                    <div class="meta">
                        <span>${escapeHtml(game.size || "-")}</span>
                        <span>siap main</span>
                    </div>
                    <div class="card-actions">
                        <a class="btn primary"
                           href="${detailUrl}">DETAIL GAME</a>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });
    }

    async function searchByDocumentId(query) {
        try {
            const snap = await gamesRef.doc(query.trim()).get();
            return snap.exists ? [{ id: snap.id, ...snap.data() }] : [];
        } catch (error) {
            console.warn("Pencarian ID gagal:", error);
            return [];
        }
    }

    async function searchBySlug(query) {
        try {
            const snap = await gamesRef.where("slug", "==", query.trim()).limit(1).get();
            return snap.empty ? [] : [{ id: snap.docs[0].id, ...snap.docs[0].data() }];
        } catch (error) {
            console.warn("Pencarian slug gagal:", error);
            return [];
        }
    }

    async function searchByWords(queryWords) {
        if (!queryWords.length) {
            return [];
        }

        const candidateWord = queryWords.reduce(function (longest, word) {
            return word.length > longest.length ? word : longest;
        }, queryWords[0]);
        const field = candidateWord.length >= 2 ? "title_substrings" : "title_words";
        const fallbackField = field === "title_substrings" ? "title_words" : null;

        const queries = [gamesRef.where(field, "array-contains", candidateWord).get()];
        if (fallbackField) queries.push(gamesRef.where(fallbackField, "array-contains", candidateWord).get());

        const snapshots = await Promise.all(queries);
        const byId = new Map();
        snapshots.forEach(snap => snap.docs.forEach(doc => byId.set(doc.id, { id: doc.id, ...doc.data() })));
        return [...byId.values()].filter(game => matchesAllWords(game, queryWords));
    }

    async function runSearch(query) {
        const requestId = ++searchRequestId;
        currentQuery = query.trim();
        input.value = currentQuery;

        if (!currentQuery) {
            searchGames = [];
            currentPage = 1;
            searchTitle.textContent = "Cari Game";
            resultInfo.textContent = "Masukkan kata pencarian.";
            showMessage("Masukkan judul game untuk mulai mencari.");
            return;
        }

        isSearching = true;
        currentPage = 1;
        searchGames = [];

        searchTitle.textContent = 'Hasil: "' + currentQuery + '"';
        resultInfo.textContent = "Mencari game...";
        showMessage("Menghubungkan ke database...");

        try {
            const queryWords = tokenize(currentQuery);

            // Prioritas: document ID, slug, lalu pencarian judul.
            const idResults = await searchByDocumentId(currentQuery);
            if (requestId !== searchRequestId) return;

            const slugResults = idResults.length ? [] : await searchBySlug(currentQuery);
            if (requestId !== searchRequestId) return;

            if (idResults.length) {
                searchGames = idResults;
            } else if (slugResults.length) {
                searchGames = slugResults;
            } else {
                searchGames = await searchByWords(queryWords);
            }
            if (requestId !== searchRequestId) return;

            // Urutkan hasil berdasarkan judul.
            searchGames.sort(function (a, b) {
                return String(a.title || "").localeCompare(
                    String(b.title || ""),
                    "id",
                    { sensitivity: "base" }
                );
            });

            renderResults();

        } catch (error) {
            console.error("Search error:", error);
            resultInfo.textContent = "Pencarian gagal.";
            showMessage(
                "Gagal mencari game. Periksa koneksi dan konfigurasi Firestore."
            );
        } finally {
            if (requestId === searchRequestId) isSearching = false;
        }
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const query = input.value.trim();
        const url = new URL(window.location.href);

        if (query) {
            url.searchParams.set("q", query);
        } else {
            url.searchParams.delete("q");
        }

        history.replaceState(null, "", url.toString());
        runSearch(query);
    });

    prevPage.addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            renderResults();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });

    nextPage.addEventListener("click", function () {
        const totalPages = Math.ceil(searchGames.length / PAGE_SIZE);

        if (currentPage < totalPages) {
            currentPage++;
            renderResults();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });

    // Mendukung URL langsung: search.html?q=galaxy+mario
    const initialQuery =
        new URLSearchParams(window.location.search).get("q") || "";

    if (initialQuery.trim()) {
        runSearch(initialQuery);
    }
})();
