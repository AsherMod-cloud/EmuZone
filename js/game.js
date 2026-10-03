const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const root = document.getElementById("gameRoot");

const DEFAULT_OG_IMAGE = "assets/image/og-image.png";

function absoluteUrl(value){
  try { return new URL(value, window.location.href).href; }
  catch { return new URL(DEFAULT_OG_IMAGE, window.location.href).href; }
}

function setFallbackSocialMetadata(){
  const fallback = absoluteUrl(DEFAULT_OG_IMAGE);
  document.title = "Game Tidak Ditemukan — Emulator Games ID";
  document.getElementById("metaDesc")?.setAttribute("content", "Game yang dicari tidak ditemukan di Emulator Games ID.");
  document.getElementById("ogTitle")?.setAttribute("content", "Emulator Games ID");
  document.getElementById("ogDesc")?.setAttribute("content", "Koleksi game emulator klasik, siap main.");
  document.getElementById("ogImage")?.setAttribute("content", fallback);
  document.getElementById("ogUrl")?.setAttribute("content", window.location.href);
  document.getElementById("twTitle")?.setAttribute("content", "Emulator Games ID");
  document.getElementById("twDesc")?.setAttribute("content", "Koleksi game emulator klasik, siap main.");
  document.getElementById("twImage")?.setAttribute("content", fallback);
  document.getElementById("canonicalUrl")?.setAttribute("href", window.location.href);
}

function setSocialImage(candidate){
  const fallback = absoluteUrl(DEFAULT_OG_IMAGE);
  const imageMeta = document.getElementById("ogImage");
  const twitterMeta = document.getElementById("twImage");
  const chosen = candidate ? absoluteUrl(candidate) : fallback;
  const apply = (url) => {
    imageMeta?.setAttribute("content", url);
    twitterMeta?.setAttribute("content", url);
  };
  apply(chosen);
  if(!candidate) return;
  const probe = new Image();
  probe.onload = () => apply(chosen);
  probe.onerror = () => apply(fallback);
  probe.src = chosen;
}

function renderNotFound(){
  setFallbackSocialMetadata();
  root.innerHTML = "";
  showErrorModal(404);
}

// ... di bagian paling bawah:
if(!slug){
  renderNotFound();
} else {
  gamesRef.where("slug", "==", slug).limit(1).get().then(snap => {
    if(snap.empty){
      gamesRef.doc(slug).get().then(doc => {
        if(!doc.exists){ renderNotFound(); return; }
        render(doc.data(), doc.id);
      }).catch(() => {
        root.innerHTML = "";
        showErrorModal(500);  // ⬅️ ganti renderNotFound jadi 500
      });
      return;
    }
    const doc = snap.docs[0];
    render(doc.data(), doc.id);
  }).catch(err => {
    console.error(err);
    root.innerHTML = "";
    showErrorModal(500);  // ⬅️ ganti renderNotFound jadi 500
  });
}

const STATUS_ICON = { Playable: "🟢", Testing: "🟡", Broken: "🔴" };

function downloadRows(g){
  const links = [
    { key: "link", icon: "🎮", label: "ROM" },
    { key: "saveData", icon: "💾", label: "Save Data" },
    { key: "texturePack", icon: "🎨", label: "Texture Pack" },
    { key: "cheatDb", icon: "🎯", label: "Cheat Database" },
    { key: "patch", icon: "🌐", label: "Patch / Translation" },
    // Requirement teknis (BIOS, firmware, keys, dst) sumbernya dari registry
    // di emulator-requirements.js, biar satu sumber kebenaran sama editor.
    ...Object.keys(REQUIREMENT_TYPES).map(id => ({
      key: id,
      icon: REQUIREMENT_TYPES[id].icon,
      label: REQUIREMENT_TYPES[id].label,
    })),
  ];
  return links
    .filter(item => g[item.key])
    .map(item => `
      <a class="dl-row" href="${g[item.key]}" target="_blank" rel="noopener">
        <span class="dl-icon">${item.icon}</span>
        <span class="dl-label">${item.label}</span>
        <span class="dl-arrow">›</span>
      </a>
    `).join("");
}

function infoList(g) {

  const rows = [];

  const addRow = (icon, label, value) => {
    if (value) rows.push([icon, label, value]);
  };

  addRow("🕹️", "Console", g.console);
  addRow("🏷", "Genre", g.genre);
  addRow("🏢", "Publisher", g.publisher);
  addRow("🛠", "Developer", g.developer);
  addRow("📅", "Release Date", g.releaseDate ?? g.releaseYear);
  addRow("🌎", "Region", g.region);
  addRow("📦", "Size", g.size);
  addRow("💽", "Series", g.series ?? g.version);

  if (g.status) {
    rows.push([
      STATUS_ICON[g.status] || "⚪",
      "Status",
      g.status
    ]);
  }

  return rows.map(([icon, title, value]) => `
    <div class="info-row">
      <span>${icon}</span>
      <strong>${title}</strong>
      <span>${value}</span>
    </div>
  `).join("");

}

// ---- Screenshot Gallery ----

let shotUrls = [];
let shotIndex = 0;

function buildShotThumbnails(g){
  const shots = (g.screenshots || []).filter(Boolean);
  if(shots.length === 0) return "";

  return shots.map((url, i) => `
    <div class="shot-thumb" data-idx="${i}">
      <img src="${url}" alt="${g.title} screenshot ${i + 1}" loading="lazy">
    </div>
  `).join("");
}

function openShotModal(idx){
  shotUrls = [...document.querySelectorAll(".shot-thumb")].map(el => {
    const img = el.querySelector("img");
    return img ? img.src : "";
  });
  shotIndex = idx;
  updateModalImage();
  document.getElementById("shotModalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";

  // Preload adjacent images
  preloadAdjacent(shotIndex);
}

function closeShotModal(){
  document.getElementById("shotModalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

function updateModalImage(){
  const img = document.getElementById("shotModalImg");
  const counter = document.getElementById("shotCounter");
  const total = shotUrls.length;

  img.src = shotUrls[shotIndex];
  img.alt = `Screenshot ${shotIndex + 1} of ${total}`;
  counter.textContent = `${shotIndex + 1} / ${total}`;

  // Update nav button states
  document.getElementById("shotPrev").disabled = shotIndex === 0;
  document.getElementById("shotNext").disabled = shotIndex === total - 1;
}

function navigateShot(direction){
  const newIndex = shotIndex + direction;
  if(newIndex < 0 || newIndex >= shotUrls.length) return;
  shotIndex = newIndex;
  updateModalImage();
  preloadAdjacent(shotIndex);
}

function preloadAdjacent(idx){
  const urls = [idx - 1, idx + 1].filter(i => i >= 0 && i < shotUrls.length);
  urls.forEach(i => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = shotUrls[i];
    link.as = "image";
    document.head.appendChild(link);
  });
}

// Swipe support for modal
(function setupShotSwipe(){
  let startX = 0;
  let startY = 0;
  let isSwiping = false;

  const overlay = document.getElementById("shotModalOverlay");

  overlay.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isSwiping = true;
  }, { passive: true });

  overlay.addEventListener("touchend", (e) => {
    if(!isSwiping) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX;
    const diffY = endY - startY;

    // Only trigger if horizontal swipe is dominant and exceeds threshold
    if(Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5){
      if(diffX < 0){
        navigateShot(1); // swipe left → next
      } else {
        navigateShot(-1); // swipe right → prev
      }
    }

    isSwiping = false;
  }, { passive: true });
})();

function setupShotGallery(){
  // Thumbnail click → open modal
  root.addEventListener("click", (e) => {
    const thumb = e.target.closest(".shot-thumb");
    if(!thumb) return;
    const idx = parseInt(thumb.dataset.idx, 10);
    openShotModal(idx);
  });

  // Close button
  document.getElementById("shotModalClose").addEventListener("click", closeShotModal);

  // Overlay click → close (but not image or buttons)
  document.getElementById("shotModalOverlay").addEventListener("click", (e) => {
    if(e.target === e.currentTarget) closeShotModal();
  });

  // Nav buttons
  document.getElementById("shotPrev").addEventListener("click", () => navigateShot(-1));
  document.getElementById("shotNext").addEventListener("click", () => navigateShot(1));

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    const overlay = document.getElementById("shotModalOverlay");
    if(!overlay.classList.contains("open")) return;

    if(e.key === "Escape") closeShotModal();
    if(e.key === "ArrowLeft") navigateShot(-1);
    if(e.key === "ArrowRight") navigateShot(1);
  });
}

function render(game, id){

  const g = {
    ...game,
    releaseDate: game.releaseDate ?? game.releaseYear,
    edition: game.edition ?? game.version
  };

  setupToolbar(g, id);
  setupShareModal(g);

  const shortDesc = (g.description || `Download ${g.title} untuk ${g.console}, siap main lewat emulator.`)
    .replace(/[#*`>_~]/g, "") // buang simbol markdown biar bersih di preview
    .slice(0, 155);
  const shareImage = g.cover || g.banner || "assets/image/favicon.png";

  document.title = `${g.title} — Emulator Games ID`;
  document.getElementById("metaDesc").setAttribute("content", shortDesc);

  document.getElementById("ogTitle").setAttribute("content", g.title);
  document.getElementById("ogDesc").setAttribute("content", shortDesc);
  document.getElementById("ogImage").setAttribute("content", shareImage);
  document.getElementById("ogUrl").setAttribute("content", location.href);

  document.getElementById("twTitle").setAttribute("content", g.title);
  document.getElementById("twDesc").setAttribute("content", shortDesc);
  document.getElementById("twImage").setAttribute("content", shareImage);

  const shotThumbnails = buildShotThumbnails(g);
  const hasShots = shotThumbnails.length > 0;

  // Store screenshot URLs BEFORE template render so counter is correct
  shotUrls = hasShots ? (g.screenshots || []).filter(Boolean) : [];

  const downloads = downloadRows(g);
  const hasEmulatorSection = g.emulator || g.emulatorDownload;

  root.innerHTML = `
    ${g.banner ? `<div class="game-banner" style="background-image:url('${g.banner}')"></div>` : `<div class="game-banner game-banner-empty"></div>`}

    <div class="game-hero">
      <div class="game-cover" style="${g.cover ? `background-image:url('${g.cover}')` : ""}"></div>
      <h1>${g.title}</h1>
      ${g.rating ? `<div class="game-rating">${"⭐".repeat(Number(g.rating))}</div>` : ""}
      <div class="info-list">${infoList(g)}</div>
    </div>

    <div class="game-divider"></div>

    <div class="game-sections">
      ${g.description ? `
        <section class="game-section">
          <h2>📝 Description</h2>
          <div class="md-body">${renderMarkdown(g.description)}</div>
        </section>
      ` : ""}

      ${hasShots ? `
        <section class="game-section">
          <h2>📷 Screenshots (${shotUrls.length})</h2>
          <div class="game-shots">${shotThumbnails}</div>
        </section>
      ` : ""}

      ${downloads ? `
        <section class="game-section">
          <h2>⬇ Downloads</h2>
          <div class="dl-list">${downloads}</div>
        </section>
      ` : ""}

      ${hasEmulatorSection ? `
<section class="game-section">
  <h2>🎮 Recommended Emulator</h2>

  ${g.emulator ? `
    <p class="emulator-name">
      Best played with <strong>${g.emulator}</strong>
    </p>
  ` : ""}

  ${g.emulatorDownload ? `
    <a class="btn primary emulator-btn"
       href="${g.emulatorDownload}"
       target="_blank"
       rel="noopener">
      ⬇ Download ${g.emulator || "Emulator"}
    </a>
  ` : ""}
</section>
` : ""}

    <div id="relatedWrap"></div>
  `;

  // shotUrls already set above before template render

  if(hasShots) setupShotGallery();

  loadRelated(g, id);
}

function loadRelated(g, id){
  if(!g.console) return;
  gamesRef.where("console", "==", g.console).limit(6).get().then(snap => {
    const items = snap.docs
      .filter(d => d.id !== id)
      .slice(0, 4)
      .map(d => ({ id: d.id, ...d.data() }));

    if(items.length === 0) return;

    const wrap = document.getElementById("relatedWrap");
    wrap.innerHTML = `
      <div class="game-divider"></div>
      <section class="game-section">
        <h2>🎮 Game Lainnya di ${g.console}</h2>
        <div class="related-grid">
          ${items.map(r => `
            <a class="related-card" href="game.html?slug=${r.slug || r.id}">
              <div class="related-cover" style="${r.cover ? `background-image:url('${r.cover}')` : ""}"></div>
              <div class="related-title-text">${r.title}</div>
            </a>
          `).join("")}
        </div>
      </section>
    `;
  });
}

let toastTimer = null;
function showToast(message, type = "success"){
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function setupShareModal(g){
  const overlay = document.getElementById("shareOverlay");
  const card = document.getElementById("shareCard");
  const fab = document.getElementById("shareFab");
  const url = location.href;
  const text = g.title ? `${g.title} — Emulator Games ID` : document.title;

  document.getElementById("shareWaBtn").href = `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`;
  document.getElementById("shareTgBtn").href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  document.getElementById("shareXBtn").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  document.getElementById("shareCopyBtn").onclick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link berhasil disalin!", "success");
    } catch {
      showToast("Gagal menyalin link", "error");
    }
  };

  const open = () => overlay.classList.add("open");
  const close = () => overlay.classList.remove("open");

  fab.onclick = open;
  document.getElementById("shareClose").onclick = close;
  card.onclick = (e) => e.stopPropagation();
}

function setupToolbar(g, id){

    // Admin

    firebase.auth().onAuthStateChanged(user=>{

        if(!user) return;

        document
        .getElementById("adminToolbar")
        .style.display="flex";

        document
        .getElementById("editGameBtn")
        .onclick=()=>{

            location.href=`editor.html?id=${id}`;

        };

        document
        .getElementById("duplicateGameBtn")
        .onclick=async()=>{

            if(!confirm("Duplikat game ini? Kamu bakal diarahkan ke editor buat nyesuain judul/link salinannya.")) return;

            const copy = { ...g };
            delete copy.slug; // biar slug baru otomatis dibikin pas disimpan di editor
            copy.title = copy.title + " (Copy)";

            try {
                const newDoc = await gamesRef.add({
                    ...copy,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                location.href = `editor.html?id=${newDoc.id}`;
            } catch(err) {
                alert("Gagal duplikat: " + err.message);
            }

        };

        document
        .getElementById("deleteGameBtn")
        .onclick=()=>{

            if(confirm("Hapus game ini?")){

                gamesRef.doc(id).delete()
                .then(()=>{

                    alert("Game berhasil dihapus.");

                    location.href="index.html";

                });

            }

        };

    });

}

if(!slug){
  renderNotFound();
} else {
  gamesRef.where("slug", "==", slug).limit(1).get().then(snap => {
    if(snap.empty){
      // fallback: mungkin ini link lama yang masih pakai document id, bukan slug
      gamesRef.doc(slug).get().then(doc => {
        if(!doc.exists){ renderNotFound(); return; }
        render(doc.data(), doc.id);
      }).catch(renderNotFound);
      return;
    }
    const doc = snap.docs[0];
    render(doc.data(), doc.id);
  }).catch(renderNotFound);
}
