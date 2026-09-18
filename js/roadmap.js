guardAdminPage(() => initRoadmap());

function initRoadmap() {

const roadmapNotepad = document.getElementById("roadmapNotepad");
const roadmapMeta = document.getElementById("roadmapMeta");
const editBtn = document.getElementById("editRoadmapBtn");
const cancelBtn = document.getElementById("cancelRoadmapBtn");
const saveBtn = document.getElementById("saveRoadmapBtn");
const logoutBtn = document.getElementById("logoutBtn");
const toast = document.getElementById("roadmapToast");

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
  { id: "foundation-landing-page", category: "Foundation", title: "Landing page", status: "done" },
  { id: "foundation-responsive-ui", category: "Foundation", title: "Responsive UI", status: "done" },
  { id: "foundation-cloudflare-pages", category: "Foundation", title: "Cloudflare Pages", status: "done" },
  { id: "foundation-firestore", category: "Foundation", title: "Firebase Firestore", status: "done" },
  { id: "foundation-authentication", category: "Foundation", title: "Firebase Authentication", status: "done" },
  { id: "foundation-search", category: "Foundation", title: "Search game", status: "done" },
  { id: "foundation-console-filter", category: "Foundation", title: "Filter console", status: "done" },
  { id: "foundation-dynamic-category", category: "Foundation", title: "Dynamic console categories", status: "done" },

  // Game Catalog
  { id: "catalog-game-cards", category: "Game Catalog", title: "Game cards", status: "done" },
  { id: "catalog-detail-page", category: "Game Catalog", title: "Game detail page", status: "done" },
  { id: "catalog-dynamic-title", category: "Game Catalog", title: "Dynamic title", status: "done" },
  { id: "catalog-dynamic-description", category: "Game Catalog", title: "Dynamic description", status: "done" },
  { id: "catalog-markdown", category: "Game Catalog", title: "Markdown description", status: "done" },
  { id: "catalog-download-sections", category: "Game Catalog", title: "Download sections", status: "done" },
  { id: "catalog-screenshot-gallery", category: "Game Catalog", title: "Screenshot gallery", status: "done" },
  { id: "catalog-fullscreen-screenshot", category: "Game Catalog", title: "Fullscreen screenshot viewer", status: "done" },
  { id: "catalog-related-games", category: "Game Catalog", title: "Related games", status: "done" },
  { id: "catalog-emulator-recommendation", category: "Game Catalog", title: "Emulator recommendation", status: "done" },
  { id: "catalog-cover-card", category: "Game Catalog", title: "Cover thumbnail pada card", status: "planned" },
  { id: "catalog-new-badge", category: "Game Catalog", title: "Badge New Release", status: "planned" },
  { id: "catalog-updated-badge", category: "Game Catalog", title: "Badge Recently Updated", status: "planned" },
  { id: "catalog-recently-added", category: "Game Catalog", title: "Recently Added", status: "planned" },
  { id: "catalog-recently-updated", category: "Game Catalog", title: "Recently Updated", status: "planned" },
  { id: "catalog-popular-games", category: "Game Catalog", title: "Popular Games", status: "planned" },
  { id: "catalog-featured-game", category: "Game Catalog", title: "Featured Game", status: "planned" },
  { id: "catalog-content-warning", category: "Game Catalog", title: "Content warning modal", status: "planned" },
  { id: "catalog-warning-confirmation", category: "Game Catalog", title: "Warning confirmation flow", status: "planned" },
  { id: "catalog-download-counter", category: "Game Catalog", title: "Download Counter", status: "planned" },
  { id: "catalog-game-rating", category: "Game Catalog", title: "Game Rating", status: "planned" },
  { id: "catalog-size-formatter", category: "Game Catalog", title: "Auto Game Size Formatter", status: "planned" },

  // Content
  { id: "content-games", category: "Content", title: "Games Emulator", status: "planned" },
  { id: "content-roms", category: "Content", title: "ROMs", status: "planned" },
  { id: "content-news", category: "Content", title: "News", status: "planned" },
  { id: "content-tutorial", category: "Content", title: "Tutorial", status: "planned" },
  { id: "content-request", category: "Content", title: "Request Form", status: "planned" },
  { id: "content-about", category: "Content", title: "About", status: "planned" },
  { id: "content-restricted-18", category: "Content", title: "Restricted 18+ setting", status: "planned" },
  { id: "content-hide-adult-tags", category: "Content", title: "Hide 18+ tags / genres", status: "planned" },
  { id: "content-changelog", category: "Content", title: "Changelog", status: "planned" },

  // Console
  { id: "console-ps1", category: "Console", title: "PS1", status: "done" },
  { id: "console-ps2", category: "Console", title: "PS2", status: "done" },
  { id: "console-ps3", category: "Console", title: "PS3", status: "done" },
  { id: "console-psp", category: "Console", title: "PSP", status: "done" },
  { id: "console-ps-vita", category: "Console", title: "PS Vita", status: "done" },
  { id: "console-nintendo-ds", category: "Console", title: "Nintendo DS", status: "done" },
  { id: "console-wii", category: "Console", title: "Wii", status: "done" },
  { id: "console-game-boy-color", category: "Console", title: "Game Boy Color", status: "done" },
  { id: "console-nes", category: "Console", title: "NES", status: "planned" },
  { id: "console-snes", category: "Console", title: "SNES", status: "planned" },
  { id: "console-gba", category: "Console", title: "Game Boy Advance", status: "planned" },
  { id: "console-gamecube", category: "Console", title: "GameCube", status: "planned" },
  { id: "console-nintendo-64", category: "Console", title: "Nintendo 64", status: "planned" },
  { id: "console-dreamcast", category: "Console", title: "Dreamcast", status: "planned" },
  { id: "console-genesis", category: "Console", title: "Sega Genesis", status: "planned" },

  // Admin Panel
  { id: "admin-login", category: "Admin Panel", title: "Login page", status: "done" },
  { id: "admin-auth-guard", category: "Admin Panel", title: "Auth guard", status: "done" },
  { id: "admin-hidden-login", category: "Admin Panel", title: "Hidden admin login", status: "done" },
  { id: "admin-logout", category: "Admin Panel", title: "Logout", status: "done" },
  { id: "admin-remember-me", category: "Admin Panel", title: "Remember Me", status: "done" },
  { id: "admin-editor", category: "Admin Panel", title: "Game editor", status: "done" },
  { id: "admin-add-game", category: "Admin Panel", title: "Add game", status: "done" },
  { id: "admin-edit-game", category: "Admin Panel", title: "Edit game", status: "done" },
  { id: "admin-delete-game", category: "Admin Panel", title: "Delete game", status: "done" },
  { id: "admin-duplicate-game", category: "Admin Panel", title: "Duplicate game", status: "done" },
  { id: "admin-slug", category: "Admin Panel", title: "Auto slug generator", status: "done" },
  { id: "admin-toolbar", category: "Admin Panel", title: "Admin toolbar", status: "done" },
  { id: "admin-total-games", category: "Admin Panel", title: "Total games indicator", status: "done" },
  { id: "admin-dashboard", category: "Admin Panel", title: "Dashboard", status: "planned" },
  { id: "admin-statistics", category: "Admin Panel", title: "Dashboard statistics", status: "planned" },
  { id: "admin-recent-uploads", category: "Admin Panel", title: "Recent uploads", status: "planned" },
  { id: "admin-manage-categories", category: "Admin Panel", title: "Manage categories", status: "planned" },
  { id: "admin-upload-cover", category: "Admin Panel", title: "Upload cover image", status: "planned" },
  { id: "admin-upload-screenshots", category: "Admin Panel", title: "Upload screenshots", status: "planned" },
  { id: "admin-drag-drop", category: "Admin Panel", title: "Drag & Drop upload", status: "planned" },
  { id: "admin-publish-draft", category: "Admin Panel", title: "Publish / Draft", status: "planned" },
  { id: "admin-activity-log", category: "Admin Panel", title: "Activity log", status: "planned" },

  // UI / UX
  { id: "ux-dark-theme", category: "UI / UX", title: "Dark theme", status: "done" },
  { id: "ux-expand-card", category: "UI / UX", title: "Expand card animation", status: "done" },
  { id: "ux-share-dialog", category: "UI / UX", title: "Share dialog", status: "done" },
  { id: "ux-copy-link", category: "UI / UX", title: "Copy Link", status: "done" },
  { id: "ux-whatsapp-share", category: "UI / UX", title: "WhatsApp Share", status: "done" },
  { id: "ux-telegram-share", category: "UI / UX", title: "Telegram Share", status: "done" },
  { id: "ux-x-share", category: "UI / UX", title: "X Share", status: "done" },
  { id: "ux-long-press", category: "UI / UX", title: "Long-press quick card", status: "done" },
  { id: "ux-error-modal", category: "UI / UX", title: "Reusable error modal (404/500/403)", status: "done" },
  { id: "ux-auth-loader", category: "UI / UX", title: "Auth verification loader", status: "done" },
  { id: "ux-skeleton-loading", category: "UI / UX", title: "Skeleton loading", status: "planned" },
  { id: "ux-loading-indicator", category: "UI / UX", title: "Loading indicator", status: "planned" },
  { id: "ux-lazy-images", category: "UI / UX", title: "Lazy loading image", status: "planned" },
  { id: "ux-image-optimization", category: "UI / UX", title: "Image optimization", status: "planned" },
  { id: "ux-scroll-top", category: "UI / UX", title: "Scroll to top", status: "planned" },
  { id: "ux-toast", category: "UI / UX", title: "Toast notification", status: "planned" },
  { id: "ux-empty-state", category: "UI / UX", title: "Empty state illustration", status: "planned" },
  { id: "ux-mobile-navigation", category: "UI / UX", title: "Mobile navigation", status: "planned" },
  { id: "ux-light-mode", category: "UI / UX", title: "Dark / Light mode", status: "planned" },

  // SEO
  { id: "seo-meta-description", category: "SEO", title: "Meta description", status: "done" },
  { id: "seo-dynamic-title", category: "SEO", title: "Dynamic title", status: "done" },
  { id: "seo-clean-url", category: "SEO", title: "Clean URL / slug", status: "done" },
  { id: "seo-open-graph", category: "SEO", title: "Open Graph", status: "done" },
  { id: "seo-twitter-card", category: "SEO", title: "Twitter Card", status: "done" },
  { id: "seo-sitemap", category: "SEO", title: "Sitemap.xml", status: "planned" },
  { id: "seo-robots", category: "SEO", title: "Robots.txt", status: "planned" },
  { id: "seo-canonical", category: "SEO", title: "Canonical URL", status: "planned" },
  { id: "seo-json-ld", category: "SEO", title: "Structured Data JSON-LD", status: "planned" },
  { id: "seo-breadcrumb", category: "SEO", title: "Breadcrumb", status: "planned" },
  { id: "seo-search-console", category: "SEO", title: "Google Search Console", status: "planned" },
  { id: "seo-bing", category: "SEO", title: "Bing Webmaster Tools", status: "planned" },

  // Security
  { id: "security-auth", category: "Security", title: "Firebase Authentication", status: "done" },
  { id: "security-firestore-rules", category: "Security", title: "Firestore Security Rules", status: "partial" },
  { id: "security-page-guard", category: "Security", title: "Hidden content auth guard", status: "done" },
  { id: "security-uid-whitelist", category: "Security", title: "Admin UID whitelist", status: "planned" },
  { id: "security-input-validation", category: "Security", title: "Input validation", status: "planned" },
  { id: "security-xss", category: "Security", title: "XSS protection", status: "planned" },
  { id: "security-reauth", category: "Security", title: "Re-authentication", status: "planned" },
  { id: "security-rate-limit", category: "Security", title: "Rate limiting", status: "planned" },
  { id: "security-activity-log", category: "Security", title: "Login activity log", status: "planned" },
  { id: "security-session-timeout", category: "Security", title: "Session timeout", status: "planned" },
  { id: "security-backup", category: "Security", title: "Backup database", status: "planned" },
  { id: "security-recovery", category: "Security", title: "Recovery system", status: "planned" },

  // Deployment
  { id: "deployment-cloudflare", category: "Deployment", title: "Cloudflare Pages", status: "done" },
  { id: "deployment-firebase", category: "Deployment", title: "Firebase project", status: "done" },
  { id: "deployment-domain", category: "Deployment", title: "Custom domain", status: "planned" },
  { id: "deployment-analytics", category: "Deployment", title: "Cloudflare Analytics", status: "planned" },
  { id: "deployment-google-analytics", category: "Deployment", title: "Google Analytics", status: "planned" },
  { id: "deployment-environment", category: "Deployment", title: "Environment/config separation", status: "planned" },
  { id: "deployment-automated-backup", category: "Deployment", title: "Automated backup", status: "planned" },

  // Performance
  { id: "performance-css-modules", category: "Performance", title: "Split CSS modules", status: "planned" },
  { id: "performance-js-modules", category: "Performance", title: "Split JavaScript modules", status: "planned" },
  { id: "performance-image", category: "Performance", title: "Image optimization", status: "planned" },
  { id: "performance-lazy-loading", category: "Performance", title: "Lazy loading", status: "planned" },
  { id: "performance-query", category: "Performance", title: "Firebase query optimization", status: "planned" },
  { id: "performance-pagination", category: "Performance", title: "Pagination", status: "planned" },
  { id: "performance-infinite-scroll", category: "Performance", title: "Infinite scroll", status: "planned" },
  { id: "performance-cache", category: "Performance", title: "Cache optimization", status: "planned" },
  { id: "performance-monitoring", category: "Performance", title: "Error monitoring", status: "planned" },

  // Game Data
  { id: "data-emulator-included", category: "Game Data", title: "Emulator Included", status: "planned" },
  { id: "data-dlc", category: "Game Data", title: "DLC section", status: "planned" },
  { id: "data-ost", category: "Game Data", title: "OST section", status: "planned" },
  { id: "data-mod", category: "Game Data", title: "Mod section", status: "planned" },
  { id: "data-repack", category: "Game Data", title: "Repack section", status: "planned" },
  { id: "data-essential-files", category: "Game Data", title: "Essential Files section", status: "planned" },
  { id: "data-compatibility", category: "Game Data", title: "Compatibility status", status: "planned" },
  { id: "data-mirrors", category: "Game Data", title: "Multiple download mirrors", status: "planned" },
  { id: "data-version", category: "Game Data", title: "Version metadata", status: "planned" },
  { id: "data-region", category: "Game Data", title: "Region metadata", status: "planned" },
  { id: "data-language", category: "Game Data", title: "Language metadata", status: "planned" },

  // Owner Workspace
  { id: "workspace-roadmap", category: "Owner Workspace", title: "Owner-only roadmap", status: "done" },
  { id: "workspace-status", category: "Owner Workspace", title: "Custom status selector", status: "done" },
  { id: "workspace-filter", category: "Owner Workspace", title: "Roadmap filter", status: "planned" },
  { id: "workspace-summary", category: "Owner Workspace", title: "Roadmap summary", status: "done" },
  { id: "workspace-notes", category: "Owner Workspace", title: "Roadmap notes", status: "planned" },
  { id: "workspace-changelog", category: "Owner Workspace", title: "Development changelog", status: "planned" },
  { id: "workspace-export", category: "Owner Workspace", title: "Export roadmap", status: "planned" },

  // Community
  { id: "community-bookmark", category: "Community", title: "Favorite / Bookmark", status: "planned" },
  { id: "community-history", category: "Community", title: "Download history", status: "planned" },
  { id: "community-account", category: "Community", title: "User account", status: "planned" },
  { id: "community-rating", category: "Community", title: "Game rating", status: "planned" },
  { id: "community-voting", category: "Community", title: "Game voting", status: "planned" },
  { id: "community-comments", category: "Community", title: "Comments", status: "planned" },
  { id: "community-request-tracking", category: "Community", title: "Game request tracking", status: "planned" },
  { id: "community-notification", category: "Community", title: "Notification system", status: "planned" },
  { id: "community-multiple-admin", category: "Community", title: "Multiple admin accounts", status: "planned" },
  { id: "community-roles", category: "Community", title: "Role permissions", status: "planned" },

  // Content target
  { id: "target-24-games", category: "Content Target", title: "24 games", status: "partial" },
  { id: "target-30-games", category: "Content Target", title: "30 games", status: "planned" },
  { id: "target-36-games", category: "Content Target", title: "36 games", status: "planned" },
  { id: "target-50-games", category: "Content Target", title: "50 games", status: "planned" },
  { id: "target-one-per-console", category: "Content Target", title: "Minimal 1 game per console", status: "planned" },
  { id: "target-balanced-console", category: "Content Target", title: "Console content lebih seimbang", status: "planned" },
  { id: "target-update-rhythm", category: "Content Target", title: "Update 2–3 game per hari saat aktif", status: "planned" }
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

async function seedRoadmap() {
  const batch = db.batch();
  DEFAULT_ROADMAP.forEach(item => {
    batch.set(roadmapRef.doc(item.id), {
      category: item.category,
      title: item.title,
      status: item.status,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
  return cloneItems(DEFAULT_ROADMAP);
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
      status: item.status,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });

  await batch.commit();
  showToast(`${missingItems.length} roadmap item baru ditambahkan.`);

  return [
    ...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    ...missingItems
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

// Panggil loadRoadmap() langsung (karena udah dijamin admin)
loadRoadmap();

}