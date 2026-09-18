guardAdminPage(() => initRoadmap());

function initRoadmap() {

const roadmapNotepad = document.getElementById("roadmapNotepad");
const roadmapMeta = document.getElementById("roadmapMeta");
const editBtn = document.getElementById("editRoadmapBtn");
const cancelBtn = document.getElementById("cancelRoadmapBtn");
const saveBtn = document.getElementById("saveRoadmapBtn");
const logoutBtn = document.getElementById("logoutBtn");
const toast = document.getElementById("roadmapToast");
const exportBtn = document.getElementById("exportRoadmapBtn");
const exportOverlay = document.getElementById("exportOverlay");
const exportClose = document.getElementById("exportClose");
  // Preview modal close
const previewOverlay = document.getElementById("previewOverlay");
const previewClose = document.getElementById("previewClose");

previewClose.addEventListener("click", () => previewOverlay.classList.remove("open"));
previewOverlay.addEventListener("click", (e) => {
  if (e.target === previewOverlay) previewOverlay.classList.remove("open");
});

const STATUS = {
  planned: { symbol: "○", label: "Planned", className: "status-planned" },
  done: { symbol: "✓", label: "Done", className: "status-done" },
  partial: { symbol: "~", label: "Partial", className: "status-partial" },
  rejected: { symbol: "X", label: "Rejected", className: "status-rejected" },
  blocked: { symbol: "!", label: "Blocked", className: "status-blocked" }
};

// Roadmap awal. Data ini otomatis masuk ke collection roadmap saat collection masih kosong.
const DEFAULT_ROADMAP = [
  // Foundation
  { id: "foundation-landing-page",       category: "Foundation",     title: "Landing page" },
  { id: "foundation-responsive-ui",      category: "Foundation",     title: "Responsive UI" },
  { id: "foundation-cloudflare-pages",   category: "Foundation",     title: "Cloudflare Pages" },
  { id: "foundation-firestore",          category: "Foundation",     title: "Firebase Firestore" },
  { id: "foundation-authentication",     category: "Foundation",     title: "Firebase Authentication" },
  { id: "foundation-search",             category: "Foundation",     title: "Search game" },
  { id: "foundation-console-filter",     category: "Foundation",     title: "Filter console" },
  { id: "foundation-dynamic-category",   category: "Foundation",     title: "Dynamic console categories" },

  // Game Catalog
  { id: "catalog-game-cards",            category: "Game Catalog",   title: "Game cards" },
  { id: "catalog-detail-page",           category: "Game Catalog",   title: "Game detail page" },
  { id: "catalog-dynamic-title",         category: "Game Catalog",   title: "Dynamic title" },
  { id: "catalog-dynamic-description",   category: "Game Catalog",   title: "Dynamic description" },
  { id: "catalog-markdown",              category: "Game Catalog",   title: "Markdown description" },
  { id: "catalog-download-sections",     category: "Game Catalog",   title: "Download sections" },
  { id: "catalog-screenshot-gallery",    category: "Game Catalog",   title: "Screenshot gallery" },
  { id: "catalog-fullscreen-screenshot", category: "Game Catalog",   title: "Fullscreen screenshot viewer" },
  { id: "catalog-related-games",         category: "Game Catalog",   title: "Related games" },
  { id: "catalog-emulator-recommendation", category: "Game Catalog", title: "Emulator recommendation" },
  { id: "catalog-cover-card",            category: "Game Catalog",   title: "Cover thumbnail pada card" },
  { id: "catalog-new-badge",             category: "Game Catalog",   title: "Badge New Release" },
  { id: "catalog-updated-badge",         category: "Game Catalog",   title: "Badge Recently Updated" },
  { id: "catalog-recently-added",        category: "Game Catalog",   title: "Recently Added" },
  { id: "catalog-recently-updated",      category: "Game Catalog",   title: "Recently Updated" },
  { id: "catalog-popular-games",         category: "Game Catalog",   title: "Popular Games" },
  { id: "catalog-featured-game",         category: "Game Catalog",   title: "Featured Game" },
  { id: "catalog-content-warning",       category: "Game Catalog",   title: "Content warning modal" },
  { id: "catalog-warning-confirmation",  category: "Game Catalog",   title: "Warning confirmation flow" },
  { id: "catalog-download-counter",      category: "Game Catalog",   title: "Download Counter" },
  { id: "catalog-game-rating",           category: "Game Catalog",   title: "Game Rating" },
  { id: "catalog-size-formatter",        category: "Game Catalog",   title: "Auto Game Size Formatter" },

  // Content
  { id: "content-games",                 category: "Content",        title: "Games Emulator" },
  { id: "content-roms",                  category: "Content",        title: "ROMs" },
  { id: "content-news",                  category: "Content",        title: "News" },
  { id: "content-tutorial",              category: "Content",        title: "Tutorial" },
  { id: "content-request",               category: "Content",        title: "Request Form" },
  { id: "content-about",                 category: "Content",        title: "About" },
  { id: "content-restricted-18",         category: "Content",        title: "Restricted 18+ setting" },
  { id: "content-hide-adult-tags",       category: "Content",        title: "Hide 18+ tags / genres" },
  { id: "content-changelog",             category: "Content",        title: "Changelog" },

  // Console
  { id: "console-ps1",                   category: "Console",        title: "PS1" },
  { id: "console-ps2",                   category: "Console",        title: "PS2" },
  { id: "console-ps3",                   category: "Console",        title: "PS3" },
  { id: "console-psp",                   category: "Console",        title: "PSP" },
  { id: "console-ps-vita",               category: "Console",        title: "PS Vita" },
  { id: "console-nintendo-ds",           category: "Console",        title: "Nintendo DS" },
  { id: "console-wii",                   category: "Console",        title: "Wii" },
  { id: "console-game-boy-color",        category: "Console",        title: "Game Boy Color" },
  { id: "console-nes",                   category: "Console",        title: "NES" },
  { id: "console-snes",                  category: "Console",        title: "SNES" },
  { id: "console-gba",                   category: "Console",        title: "Game Boy Advance" },
  { id: "console-gamecube",              category: "Console",        title: "GameCube" },
  { id: "console-nintendo-64",           category: "Console",        title: "Nintendo 64" },
  { id: "console-dreamcast",             category: "Console",        title: "Dreamcast" },
  { id: "console-genesis",               category: "Console",        title: "Sega Genesis" },

  // Admin Panel
  { id: "admin-login",                   category: "Admin Panel",    title: "Login page" },
  { id: "admin-auth-guard",              category: "Admin Panel",    title: "Auth guard" },
  { id: "admin-hidden-login",            category: "Admin Panel",    title: "Hidden admin login" },
  { id: "admin-logout",                  category: "Admin Panel",    title: "Logout" },
  { id: "admin-remember-me",             category: "Admin Panel",    title: "Remember Me" },
  { id: "admin-editor",                  category: "Admin Panel",    title: "Game editor" },
  { id: "admin-add-game",                category: "Admin Panel",    title: "Add game" },
  { id: "admin-edit-game",               category: "Admin Panel",    title: "Edit game" },
  { id: "admin-delete-game",             category: "Admin Panel",    title: "Delete game" },
  { id: "admin-duplicate-game",          category: "Admin Panel",    title: "Duplicate game" },
  { id: "admin-slug",                    category: "Admin Panel",    title: "Auto slug generator" },
  { id: "admin-toolbar",                 category: "Admin Panel",    title: "Admin toolbar" },
  { id: "admin-total-games",             category: "Admin Panel",    title: "Total games indicator" },
  { id: "admin-dashboard",               category: "Admin Panel",    title: "Dashboard" },
  { id: "admin-statistics",              category: "Admin Panel",    title: "Dashboard statistics" },
  { id: "admin-recent-uploads",          category: "Admin Panel",    title: "Recent uploads" },
  { id: "admin-manage-categories",       category: "Admin Panel",    title: "Manage categories" },
  { id: "admin-upload-cover",            category: "Admin Panel",    title: "Upload cover image" },
  { id: "admin-upload-screenshots",      category: "Admin Panel",    title: "Upload screenshots" },
  { id: "admin-drag-drop",               category: "Admin Panel",    title: "Drag & Drop upload" },
  { id: "admin-publish-draft",           category: "Admin Panel",    title: "Publish / Draft" },
  { id: "admin-activity-log",            category: "Admin Panel",    title: "Activity log" },

  // UI / UX
  { id: "ux-dark-theme",                 category: "UI / UX",        title: "Dark theme" },
  { id: "ux-expand-card",                category: "UI / UX",        title: "Expand card animation" },
  { id: "ux-share-dialog",               category: "UI / UX",        title: "Share dialog" },
  { id: "ux-copy-link",                  category: "UI / UX",        title: "Copy Link" },
  { id: "ux-whatsapp-share",             category: "UI / UX",        title: "WhatsApp Share" },
  { id: "ux-telegram-share",             category: "UI / UX",        title: "Telegram Share" },
  { id: "ux-x-share",                    category: "UI / UX",        title: "X Share" },
  { id: "ux-long-press",                 category: "UI / UX",        title: "Long-press quick card" },
  { id: "ux-error-modal",                category: "UI / UX",        title: "Reusable error modal (404/500/403)" },
  { id: "ux-auth-loader",                category: "UI / UX",        title: "Auth verification loader" },
  { id: "ux-skeleton-loading",           category: "UI / UX",        title: "Skeleton loading" },
  { id: "ux-loading-indicator",          category: "UI / UX",        title: "Loading indicator" },
  { id: "ux-lazy-images",                category: "UI / UX",        title: "Lazy loading image" },
  { id: "ux-image-optimization",         category: "UI / UX",        title: "Image optimization" },
  { id: "ux-scroll-top",                 category: "UI / UX",        title: "Scroll to top" },
  { id: "ux-toast",                      category: "UI / UX",        title: "Toast notification" },
  { id: "ux-empty-state",                category: "UI / UX",        title: "Empty state illustration" },
  { id: "ux-mobile-navigation",          category: "UI / UX",        title: "Mobile navigation" },
  { id: "ux-light-mode",                 category: "UI / UX",        title: "Dark / Light mode" },

  // SEO
  { id: "seo-meta-description",          category: "SEO",            title: "Meta description" },
  { id: "seo-dynamic-title",             category: "SEO",            title: "Dynamic title" },
  { id: "seo-clean-url",                 category: "SEO",            title: "Clean URL / slug" },
  { id: "seo-open-graph",                category: "SEO",            title: "Open Graph" },
  { id: "seo-twitter-card",              category: "SEO",            title: "Twitter Card" },
  { id: "seo-sitemap",                   category: "SEO",            title: "Sitemap.xml" },
  { id: "seo-robots",                    category: "SEO",            title: "Robots.txt" },
  { id: "seo-canonical",                 category: "SEO",            title: "Canonical URL" },
  { id: "seo-json-ld",                   category: "SEO",            title: "Structured Data JSON-LD" },
  { id: "seo-breadcrumb",                category: "SEO",            title: "Breadcrumb" },
  { id: "seo-search-console",            category: "SEO",            title: "Google Search Console" },
  { id: "seo-bing",                      category: "SEO",            title: "Bing Webmaster Tools" },

  // Security
  { id: "security-auth",                 category: "Security",       title: "Firebase Authentication" },
  { id: "security-firestore-rules",      category: "Security",       title: "Firestore Security Rules" },
  { id: "security-page-guard",           category: "Security",       title: "Hidden content auth guard" },
  { id: "security-uid-whitelist",        category: "Security",       title: "Admin UID whitelist" },
  { id: "security-input-validation",     category: "Security",       title: "Input validation" },
  { id: "security-xss",                  category: "Security",       title: "XSS protection" },
  { id: "security-reauth",               category: "Security",       title: "Re-authentication" },
  { id: "security-rate-limit",           category: "Security",       title: "Rate limiting" },
  { id: "security-activity-log",         category: "Security",       title: "Login activity log" },
  { id: "security-session-timeout",      category: "Security",       title: "Session timeout" },
  { id: "security-backup",               category: "Security",       title: "Backup database" },
  { id: "security-recovery",             category: "Security",       title: "Recovery system" },

  // Deployment
  { id: "deployment-cloudflare",         category: "Deployment",     title: "Cloudflare Pages" },
  { id: "deployment-firebase",           category: "Deployment",     title: "Firebase project" },
  { id: "deployment-domain",             category: "Deployment",     title: "Custom domain" },
  { id: "deployment-analytics",          category: "Deployment",     title: "Cloudflare Analytics" },
  { id: "deployment-google-analytics",   category: "Deployment",     title: "Google Analytics" },
  { id: "deployment-environment",        category: "Deployment",     title: "Environment/config separation" },
  { id: "deployment-automated-backup",   category: "Deployment",     title: "Automated backup" },

  // Performance
  { id: "performance-css-modules",       category: "Performance",    title: "Split CSS modules" },
  { id: "performance-js-modules",        category: "Performance",    title: "Split JavaScript modules" },
  { id: "performance-image",             category: "Performance",    title: "Image optimization" },
  { id: "performance-lazy-loading",      category: "Performance",    title: "Lazy loading" },
  { id: "performance-query",             category: "Performance",    title: "Firebase query optimization" },
  { id: "performance-pagination",        category: "Performance",    title: "Pagination" },
  { id: "performance-infinite-scroll",   category: "Performance",    title: "Infinite scroll" },
  { id: "performance-cache",             category: "Performance",    title: "Cache optimization" },
  { id: "performance-monitoring",        category: "Performance",    title: "Error monitoring" },

  // Game Data
  { id: "data-emulator-included",        category: "Game Data",      title: "Emulator Included" },
  { id: "data-dlc",                      category: "Game Data",      title: "DLC section" },
  { id: "data-ost",                      category: "Game Data",      title: "OST section" },
  { id: "data-mod",                      category: "Game Data",      title: "Mod section" },
  { id: "data-repack",                   category: "Game Data",      title: "Repack section" },
  { id: "data-essential-files",          category: "Game Data",      title: "Essential Files section" },
  { id: "data-compatibility",            category: "Game Data",      title: "Compatibility status" },
  { id: "data-mirrors",                  category: "Game Data",      title: "Multiple download mirrors" },
  { id: "data-version",                  category: "Game Data",      title: "Version metadata" },
  { id: "data-region",                   category: "Game Data",      title: "Region metadata" },
  { id: "data-language",                 category: "Game Data",      title: "Language metadata" },

  // Owner Workspace
  { id: "workspace-roadmap",             category: "Owner Workspace", title: "Owner-only roadmap" },
  { id: "workspace-status",              category: "Owner Workspace", title: "Custom status selector" },
  { id: "workspace-filter",              category: "Owner Workspace", title: "Roadmap filter" },
  { id: "workspace-summary",             category: "Owner Workspace", title: "Roadmap summary" },
  { id: "workspace-notes",               category: "Owner Workspace", title: "Roadmap notes" },
  { id: "workspace-changelog",           category: "Owner Workspace", title: "Development changelog" },
  { id: "workspace-export",              category: "Owner Workspace", title: "Export roadmap" },

  // Community
  { id: "community-bookmark",            category: "Community",      title: "Favorite / Bookmark" },
  { id: "community-history",             category: "Community",      title: "Download history" },
  { id: "community-account",             category: "Community",      title: "User account" },
  { id: "community-rating",              category: "Community",      title: "Game rating" },
  { id: "community-voting",              category: "Community",      title: "Game voting" },
  { id: "community-comments",            category: "Community",      title: "Comments" },
  { id: "community-request-tracking",    category: "Community",      title: "Game request tracking" },
  { id: "community-notification",        category: "Community",      title: "Notification system" },
  { id: "community-multiple-admin",      category: "Community",      title: "Multiple admin accounts" },
  { id: "community-roles",               category: "Community",      title: "Role permissions" },

  // Content Target
  { id: "target-24-games",               category: "Content Target", title: "24 games" },
  { id: "target-30-games",               category: "Content Target", title: "30 games" },
  { id: "target-36-games",               category: "Content Target", title: "36 games" },
  { id: "target-50-games",               category: "Content Target", title: "50 games" },
  { id: "target-one-per-console",        category: "Content Target", title: "Minimal 1 game per console" },
  { id: "target-balanced-console",       category: "Content Target", title: "Console content lebih seimbang" },
  { id: "target-update-rhythm",          category: "Content Target", title: "Update 2–3 game per hari saat aktif" }
];

let roadmapItems = [];
let originalItems = [];
let isEditing = false;
let isDirty = false;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cloneItems(items) {
  return items.map(item => ({
    id: item.id,
    category: item.category,
    title: item.title,
    status: STATUS[item.status] ? item.status : "planned"
  }));
}

function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `roadmap-toast show ${type}`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function setDirty(value) {
  isDirty = value;
  saveBtn.disabled = !value;
  saveBtn.classList.toggle("ready", value);
}

function comparableItems(items) {
  return items
    .map(item => ({
      id: String(item.id || ""),
      category: String(item.category || ""),
      title: String(item.title || "").trim(),
      status: STATUS[item.status] ? item.status : "planned"
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function hasUnsavedChanges() {
  return JSON.stringify(comparableItems(roadmapItems)) !== JSON.stringify(comparableItems(originalItems));
}

function updateDirtyState() {
  setDirty(hasUnsavedChanges());
}

function updateSummary() {
  const counts = roadmapItems.reduce((result, item) => {
    result[item.status] = (result[item.status] || 0) + 1;
    return result;
  }, {});

  document.getElementById("summaryTotal").textContent = roadmapItems.length;
  document.getElementById("summaryDone").textContent = counts.done || 0;
  document.getElementById("summaryPartial").textContent = counts.partial || 0;
  document.getElementById("summaryPlanned").textContent = counts.planned || 0;
  document.getElementById("summaryRejected").textContent = counts.rejected || 0;
}

function statusButton(item) {
  const status = STATUS[item.status];
  return `<button class="roadmap-status ${status.className}" type="button" data-action="status" data-id="${escapeHtml(item.id)}" aria-label="Status ${status.label}: ${escapeHtml(item.title)}" title="${status.label}">${status.symbol}</button>`;
}

function renderRoadmap() {
  const categoryOrder = [
    "Foundation",
    "Game Catalog",
    "Content",
    "Console",
    "Admin Panel",
    "UI / UX",
    "SEO",
    "Security",
    "Deployment",
    "Performance",
    "Game Data",
    "Owner Workspace",
    "Community",
    "Content Target"
  ];
  const grouped = {};

  roadmapItems.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const categories = [
    ...categoryOrder.filter(category => grouped[category]),
    ...Object.keys(grouped).filter(category => !categoryOrder.includes(category))
  ];

  roadmapNotepad.innerHTML = categories.map(category => `
    <section class="roadmap-category">
      <div class="category-heading">
        <h2>${escapeHtml(category)}</h2>
        <span>${grouped[category].length} item</span>
      </div>
      <div class="roadmap-list">
        ${grouped[category].map(item => `
          <div class="roadmap-item" data-item-id="${escapeHtml(item.id)}">
            ${isEditing
              ? `<input class="roadmap-title-input" data-action="title" data-id="${escapeHtml(item.id)}" value="${escapeHtml(item.title)}" aria-label="Nama fitur">`
              : `<span class="roadmap-item-title">${escapeHtml(item.title)}</span>`}
            <div class="roadmap-item-status">
              ${isEditing ? statusButton(item) : `<span class="roadmap-status ${STATUS[item.status].className}" title="${STATUS[item.status].label}">${STATUS[item.status].symbol}</span>`}
              <span class="roadmap-status-label">${STATUS[item.status].label}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `).join("");

  roadmapNotepad.classList.toggle("is-editing", isEditing);
  updateSummary();
}

function setEditMode(value) {
  isEditing = value;
  editBtn.hidden = value;
  cancelBtn.hidden = !value;
  saveBtn.hidden = !value;
  roadmapNotepad.classList.toggle("is-editing", value);
  roadmapMeta.textContent = value ? "Mode edit aktif — ubah status atau nama fitur, lalu simpan." : "Roadmap internal · hanya admin yang login";
  renderRoadmap();
}

function cycleStatus(item) {
  const order = ["planned", "done", "partial", "rejected"];
  const currentIndex = order.indexOf(item.status);
  item.status = order[(currentIndex + 1) % order.length];
}

roadmapNotepad.addEventListener("click", event => {
  const target = event.target.closest("[data-action]");
  if (!target || !isEditing) return;

  const item = roadmapItems.find(entry => entry.id === target.dataset.id);
  if (!item) return;

  if (target.dataset.action === "status") {
    cycleStatus(item);
    updateDirtyState();
    renderRoadmap();
  }
});

roadmapNotepad.addEventListener("input", event => {
  const target = event.target.closest('[data-action="title"]');
  if (!target) return;
  const item = roadmapItems.find(entry => entry.id === target.dataset.id);
  if (!item) return;
  item.title = target.value;
  updateDirtyState();
});

editBtn.addEventListener("click", () => {
  originalItems = cloneItems(roadmapItems);
  setDirty(false);
  setEditMode(true);
});

cancelBtn.addEventListener("click", () => {
  roadmapItems = cloneItems(originalItems);
  setDirty(false);
  setEditMode(false);
});

saveBtn.addEventListener("click", async () => {
  if (!isDirty || saveBtn.disabled) return;

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const batch = db.batch();
    roadmapItems.forEach(item => {
      batch.set(roadmapRef.doc(item.id), {
        category: item.category,
        title: item.title.trim() || "Untitled feature",
        status: item.status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    originalItems = cloneItems(roadmapItems);
    setDirty(false);
    setEditMode(false);
    showToast("Roadmap berhasil disimpan.");
  } catch (error) {
    console.error(error);
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
    setDirty(true);
    showToast("Gagal menyimpan roadmap. Cek Firestore Rules.", "error");
  } finally {
    saveBtn.textContent = "Save";
  }
});

logoutBtn.addEventListener("click", () => logout());

// ---- Export listeners ----
exportBtn.addEventListener("click", () => {
  if (roadmapItems.length === 0) {
    showToast("Roadmap belum ke-load.", "error");
    return;
  }
  exportOverlay.classList.add("open");
});

exportClose.addEventListener("click", () => {
  exportOverlay.classList.remove("open");
});

exportOverlay.addEventListener("click", (e) => {
  if (e.target === exportOverlay) exportOverlay.classList.remove("open");
});

document.getElementById("exportJsBtn").addEventListener("click", () => {
  const content = generateRoadmapCode();
  const filename = `roadmap-${new Date().toISOString().slice(0, 10)}.js`;
  showPreviewModal(content, filename, "text/javascript");
  exportOverlay.classList.remove("open");
});

document.getElementById("exportJsonBtn").addEventListener("click", () => {
  const content = generateRoadmapJSON();
  const filename = `roadmap-backup-${new Date().toISOString().slice(0, 10)}.json`;
  downloadAsFile(content, filename, "application/json");
  exportOverlay.classList.remove("open");
});

document.getElementById("exportMdBtn").addEventListener("click", () => {
  const content = generateRoadmapMarkdown();
  const filename = `roadmap-${new Date().toISOString().slice(0, 10)}.md`;
  showPreviewModal(content, filename, "text/markdown");
  exportOverlay.classList.remove("open");
});

// ============================================================
// EXPORT — Download as file (more reliable on Android)
// ============================================================

function downloadAsFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.style.display = "none";
  a.href = url;
  a.download = filename;
  a.rel = "noopener";

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);

  showToast(`File ${filename} berhasil didownload!`);
}

function showPreviewModal(content, filename, mimeType) {
  const overlay = document.getElementById("previewOverlay");
  const textarea = document.getElementById("previewText");
  const title = document.getElementById("previewTitle");
  const downloadBtn = document.getElementById("previewDownloadBtn");

  title.textContent = filename;
  textarea.value = content;

  // Ganti handler download (biar dinamis)
  downloadBtn.onclick = () => {
    downloadAsFile(content, filename, mimeType);
    overlay.classList.remove("open");
  };

  overlay.classList.add("open");

  // Auto-select all text di textarea biar user tinggal Ctrl+C / long-press copy
  setTimeout(() => {
  textarea.focus();
  textarea.setSelectionRange(0, 0);  // ⬅️ Kursor di awal, gak scroll
  textarea.scrollTop = 0;            // ⬅️ Force scroll ke atas
 }, 100);
}

async function seedRoadmap() {
  const batch = db.batch();
  DEFAULT_ROADMAP.forEach(item => {
    batch.set(roadmapRef.doc(item.id), {
      category: item.category,
      title: item.title,
      status: "planned",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
  return DEFAULT_ROADMAP.map(item => ({ ...item, status: "planned" }));
}

async function addMissingDefaultItems(snapshot) {
  const existingIds = new Set(snapshot.docs.map(doc => doc.id));
  const missingItems = DEFAULT_ROADMAP.filter(item => !existingIds.has(item.id));

  if (missingItems.length === 0) {
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  const batch = db.batch();
  missingItems.forEach(item => {
    batch.set(roadmapRef.doc(item.id), {
      category: item.category,
      title: item.title,
      status: "planned",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });

  await batch.commit();
  showToast(`${missingItems.length} roadmap item baru ditambahkan.`);

  return [
    ...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    ...missingItems.map(item => ({ ...item, status: "planned" }))
  ];
}
  
async function loadRoadmap() {
  try {
    const snapshot = await roadmapRef.get();
    if (snapshot.empty) {
      roadmapItems = await seedRoadmap();
      showToast("Roadmap awal berhasil dibuat.");
    } else {
      roadmapItems = await addMissingDefaultItems(snapshot);
      roadmapItems.sort((a, b) => a.id.localeCompare(b.id));
    }

    originalItems = cloneItems(roadmapItems);
    roadmapMeta.textContent = "Roadmap internal · hanya admin yang login";
    renderRoadmap();
  } catch (error) {
    console.error(error);
    roadmapItems = cloneItems(DEFAULT_ROADMAP);
    originalItems = cloneItems(roadmapItems);
    roadmapMeta.textContent = "Roadmap lokal · Firestore belum dapat diakses";
    renderRoadmap();
    showToast("Roadmap tampil dari data awal. Cek Firestore Rules.", "error");
  }
}

// ============================================================
// EXPORT ROADMAP
// ============================================================

function generateRoadmapCode() {
  const sorted = [...roadmapItems].sort((a, b) => a.id.localeCompare(b.id));

  const lines = sorted.map(item => {
    const id = `"${item.id}"`.padEnd(38);
    const cat = `"${item.category}"`.padEnd(24);
    const title = `"${item.title}"`.padEnd(48);
    return `  { id: ${id}, category: ${cat}, title: ${title}, status: "${item.status}" },`;
  });

  return `const DEFAULT_ROADMAP = [\n${lines.join("\n")}\n];`;
}

function generateRoadmapJSON() {
  const snapshot = [...roadmapItems]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(({ id, category, title, status }) => ({ id, category, title, status }));

  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    totalItems: snapshot.length,
    items: snapshot
  }, null, 2);
}

function generateRoadmapMarkdown() {
  const grouped = {};
  roadmapItems.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const symbol = { done: "✅", partial: "🟡", planned: "⬜", rejected: "❌", blocked: "⛔" };

  let md = `# Roadmap Snapshot\n\n> Exported: ${new Date().toLocaleString("id-ID")}\n\n`;
  Object.keys(grouped).sort().forEach(cat => {
    md += `## ${cat}\n\n`;
    grouped[cat]
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach(item => {
        md += `- ${symbol[item.status] || "⬜"} ${item.title}\n`;
      });
    md += "\n";
  });

  return md;
}

async function copyToClipboard(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${label} berhasil dicopy!`);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast(`${label} berhasil dicopy!`);
    } catch {
      showToast("Gagal copy. Cek izin clipboard.", "error");
    }
    document.body.removeChild(ta);
  }
}

function downloadJSON() {
  const json = generateRoadmapJSON();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `roadmap-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("File JSON berhasil didownload!");
}

// Panggil loadRoadmap() langsung (karena udah dijamin admin)
loadRoadmap();

}