// Lindungi halaman ini — cuma admin yang login yang boleh akses
guardAdminPage(() => initEditor());

function initEditor() {

const params = new URLSearchParams(window.location.search);
const editId = params.get("id");

const editorTitle = document.getElementById("editorTitle");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const backBtn = document.getElementById("backBtn");
const screenshotList = document.getElementById("screenshotList");

let existingSlug = null; // slug lama (kalau mode edit), biar link yang udah kesebar gak berubah
let requirementValues = {}; // { bios: "url...", firmware: "url...", ... } — bertahan walau field di-render ulang

if (editId) {
  editorTitle.textContent = "Edit Game";
}

// ---------- Dynamic requirements (nyesuaiin emulator yang diketik) ----------
const fEmulator = document.getElementById("fEmulator");
const dynWrap = document.getElementById("dynRequirementsWrap");
const dynContainer = document.getElementById("dynamicRequirements");

function renderDynamicRequirements(){
  // Simpen dulu nilai yang udah diketik sebelum di-render ulang, biar gak ilang
  dynContainer.querySelectorAll("[data-req-id]").forEach(input => {
    requirementValues[input.dataset.reqId] = input.value;
  });

  const { requiredFields, optional } = getEmulatorInfo(fEmulator.value);
  const allIds = [...requiredFields, ...optional];

  if(allIds.length === 0){
    dynWrap.style.display = "none";
    dynContainer.innerHTML = "";
    return;
  }

  dynWrap.style.display = "block";
  dynContainer.innerHTML = allIds.map(id => {
    const type = REQUIREMENT_TYPES[id];
    const isRequired = requiredFields.includes(id);
    const value = (requirementValues[id] || "").replace(/"/g, "&quot;");
    return `
      <div class="input-group">
        <label class="dyn-field-label">${type.icon} ${type.label} ${isRequired ? '<span class="dyn-required-mark">*</span>' : '<span class="optional">(Optional)</span>'}</label>
        <input type="url" class="dyn-field-input" data-req-id="${id}" placeholder="${type.placeholder}" value="${value}">
      </div>
    `;
  }).join("");
}

fEmulator.addEventListener("input", renderDynamicRequirements);
dynContainer.addEventListener("input", (e) => {
  if (e.target.dataset.reqId && e.target.value.trim()) {
    e.target.classList.remove("missing");
  }
});

// ---------- Load Format (template deskripsi) ----------
const loadFormatBtn = document.getElementById("loadFormatBtn");
const fDesc = document.getElementById("fDesc");

function buildDescriptionTemplate(){
  const titleGame = document.getElementById("fTitle").value.trim() || "(nama game)";
  const emulatorName = document.getElementById("fEmulator").value.trim() || "(Emulator)";
  const developerName = document.getElementById("fDeveloper").value.trim() || "...";
  const publisherName = document.getElementById("fPublisher").value.trim() || "...";

  const emulatorInfo = getEmulatorInfo(emulatorName);

	if (!emulatorInfo.name) {
	    console.warn(`Unknown emulator: ${emulatorName}`);
	}

  const guide =
  INSTALLATION_GUIDES[emulatorInfo.guide]?.(emulatorName) ??
  INSTALLATION_GUIDES.simple(emulatorName);

  const tutorial = emulatorInfo.tutorial;
  const hasGuide = hasTutorial(emulatorInfo);

  const tutorialSection = hasGuide
    ? `* Full Installation : [${tutorial.label}](${tutorial.url})`
    : "";

  const tutorialCreditSection = hasGuide
    ? `**Tutorial**
  ${tutorial.credit}`
    : "";
	  
	  return `# ${titleGame}

The game

## FEATURES

- 60 FPS
- Compatible with \`${emulatorName}\`

## INSTALLATION

${guide}

${tutorialSection}
* Rekomended File Manager [Zarchiver](https://play.google.com/store/apps/details?id=ru.zdevs.zarchiver)

## CREDITS

**Developer**
${developerName}

**Publisher**
${publisherName}

**HD Textures Pack**
...

**Save Data**
...

**Cheat Database**
...

**Patch / Translation**
...

${tutorialCreditSection}

**Additional Testing**
AsherMod`;
}

loadFormatBtn.addEventListener("click", () => {
  if (fDesc.value.trim() && !confirm("Description udah ada isinya. Timpa dengan format baru?")) {
    return;
  }
  fDesc.value = buildDescriptionTemplate();
  fDesc.focus();
});

// ---------- Popup Info Markdown ----------
const mdInfoBtn = document.getElementById("mdInfoBtn");
const mdInfoOverlay = document.getElementById("mdInfoOverlay");
const mdInfoCard = document.getElementById("mdInfoCard");
const mdInfoClose = document.getElementById("mdInfoClose");

mdInfoBtn.addEventListener("click", () => mdInfoOverlay.classList.add("open"));
mdInfoClose.addEventListener("click", () => mdInfoOverlay.classList.remove("open"));
mdInfoOverlay.addEventListener("click", (e) => {
});
mdInfoCard.addEventListener("click", (e) => e.stopPropagation());

// ---------- Screenshot rows (dinamis) ----------
// Baris pertama SELALU dapet tombol "+" (nambah baris baru) dan gak bisa dihapus,
// karena minimal harus ada 1 input screenshot. Baris ke-2 dst otomatis dapet tombol "-" (hapus baris).
// Ini dicek otomatis lewat isFirst = screenshotList.children.length === 0 saat baris dibuat.
function addScreenshotRow(value = "") {
  const isFirst = screenshotList.children.length === 0;

  const row = document.createElement("div");
  row.className = "screenshot-row";
  row.innerHTML = `
    <input type="url" class="shot-input" placeholder="URL screenshot" value="${value.replace(/"/g, "&quot;")}">
    <button class="icon-btn ${isFirst ? "add-btn" : "remove-btn"}" type="button" aria-label="${isFirst ? "Tambah screenshot" : "Hapus screenshot"}">
      <span class="material-symbols-outlined">${isFirst ? "add" : "remove"}</span>
    </button>
  `;

  const btn = row.querySelector("button");
  if (isFirst) {
    btn.addEventListener("click", () => addScreenshotRow());
  } else {
    btn.addEventListener("click", () => row.remove());
  }

  screenshotList.appendChild(row);
}
function getScreenshots() {
  return [...screenshotList.querySelectorAll(".shot-input")]
    .map(i => i.value.trim())
    .filter(Boolean);
}

function setScreenshots(list) {
  screenshotList.innerHTML = "";
  if (!list || list.length === 0) {
    addScreenshotRow();
  } else {
    list.forEach(url => addScreenshotRow(url));
  }
}

// ---------- Slug otomatis ----------
// "God Of War - Ghost Of Sparta" -> "god-of-war-ghost-of-sparta"
// "Pokémon Platinum" -> "pokemon-platinum"
function slugify(text) {
  return text
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // buang aksen (é -> e)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Mastiin slug unik — kalau udah kepake, tambahin -2, -3, dst.
async function getUniqueSlug(baseSlug, ignoreId) {
  let candidate = baseSlug;
  let counter = 2;
  while (true) {
    const snap = await gamesRef.where("slug", "==", candidate).get();
    const clash = snap.docs.some(d => d.id !== ignoreId);
    if (!clash) return candidate;
    candidate = `${baseSlug}-${counter}`;
    counter++;
  }
}

// ---------- Field map ----------
const FIELD_IDS = [
  "fTitle","fConsole","fGenre","fPublisher","fDeveloper","fReleaseDate","fRegion",
  "fCover","fBanner",
  "fLink","fTexturePack","fSaveData","fCheatDb","fPatch","fEmulator","fEmulatorDownload",
  "fSeries","fStatus","fRating","fDesc"
];

function fillForm(g) {
  document.getElementById("fTitle").value = g.title || "";
  document.getElementById("fConsole").value = g.console || "";
  document.getElementById("fGenre").value = g.genre || "";
  document.getElementById("fPublisher").value = g.publisher || "";
  document.getElementById("fDeveloper").value = g.developer || "";
  document.getElementById("fReleaseDate").value =     g.releaseDate || g.releaseYear || "";
  document.getElementById("fRegion").value = g.region || "";
  document.getElementById("fCover").value = g.cover || "";
  document.getElementById("fBanner").value = g.banner || "";
  document.getElementById("fLink").value = g.link || "";
  document.getElementById("fTexturePack").value = g.texturePack || "";
  document.getElementById("fSaveData").value = g.saveData || "";
  document.getElementById("fCheatDb").value = g.cheatDb || "";
  document.getElementById("fPatch").value = g.patch || "";
  document.getElementById("fEmulator").value = g.emulator || "";
  document.getElementById("fEmulatorDownload").value = g.emulatorDownload || "";
  document.getElementById("fSeries").value =
    g.series || g.version || "";
  document.getElementById("fSize").value = g.size || "";
  document.getElementById("fStatus").value = g.status || "Playable";
  document.getElementById("fRating").value = g.rating || "5";
  document.getElementById("fDesc").value = g.description || "";
  setScreenshots(g.screenshots || []);

  // Isi ulang requirementValues dari data lama, terus render field yang relevan
  Object.keys(REQUIREMENT_TYPES).forEach(id => {
    requirementValues[id] = g[id] || "";
  });
  renderDynamicRequirements();
}

// ---------- Load existing game kalau mode edit ----------
if (editId) {
  gamesRef.doc(editId).get().then(doc => {
    if (!doc.exists) {
      alert("Game tidak ditemukan.");
      window.location.href = "index.html";
      return;
    }
    fillForm(doc.data());
    existingSlug = doc.data().slug || null;
  }).catch(err => {
    alert("Gagal memuat data: " + err.message);
  });
} else {
  setScreenshots([]); // mulai dengan 1 baris kosong
}

// ---------- Save ----------
saveBtn.addEventListener("click", async () => {
  const title = document.getElementById("fTitle").value.trim();
  const consoleName = document.getElementById("fConsole").value.trim();
  const link = document.getElementById("fLink").value.trim();

  if (!title || !consoleName || !link) {
    alert("Game Title, Console, dan ROM Link wajib diisi.");
    return;
  }

  // Validasi field dinamis yang wajib buat emulator ini
  const emulatorName = document.getElementById("fEmulator").value.trim();
  const emulatorInfo = getEmulatorInfo(emulatorName);

  if (emulatorName && !emulatorInfo.name) {
    alert(`Unknown emulator: "${emulatorName}"`);
   return;
  }

const { requiredFields } = emulatorInfo;

const missing = [];

requiredFields.forEach(id => {
    const input = dynContainer.querySelector(
        `[data-req-id="${id}"]`
    );

    const val = input ? input.value.trim() : "";

    if (!val) missing.push(REQUIREMENT_TYPES[id].label);

    if (input) {
        input.classList.toggle("missing", !val);
    }
});

  // Kumpulin semua nilai requirement (baik yang lagi kepake maupun yang tersimpan tapi disembunyikan)
  dynContainer.querySelectorAll("[data-req-id]").forEach(input => {
    requirementValues[input.dataset.reqId] = input.value.trim();
  });

  const releaseYearRaw = document.getElementById("fReleaseDate").value.trim();
  const ratingRaw = document.getElementById("fRating").value;

  const data = {
  title,
  console: consoleName,
  genre: document.getElementById("fGenre").value.trim(),
  publisher: document.getElementById("fPublisher").value.trim(),
  developer: document.getElementById("fDeveloper").value.trim(),

  releaseDate: document.getElementById("fReleaseDate").value.trim(),

  region: document.getElementById("fRegion").value.trim(),
  cover: document.getElementById("fCover").value.trim(),
  banner: document.getElementById("fBanner").value.trim(),
  screenshots: getScreenshots(),

  link,

  texturePack: document.getElementById("fTexturePack").value.trim(),
  saveData: document.getElementById("fSaveData").value.trim(),
  cheatDb: document.getElementById("fCheatDb").value.trim(),
  patch: document.getElementById("fPatch").value.trim(),

  emulator: document.getElementById("fEmulator").value.trim(),
  emulatorDownload: document.getElementById("fEmulatorDownload").value.trim(),

  series: document.getElementById("fSeries").value.trim(),

  size: document.getElementById("fSize").value.trim(),
  status: document.getElementById("fStatus").value,
  rating: ratingRaw ? Number(ratingRaw) : null,
  description: document.getElementById("fDesc").value.trim(),
};

  // Semua tipe requirement (bios, firmware, keys, dst) ikut kesimpen —
  // biar data gak ilang walau field-nya lagi disembunyiin karena emulator beda.
  Object.keys(REQUIREMENT_TYPES).forEach(id => {
    data[id] = requirementValues[id] || "";
  });

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    // Slug cuma dibuat sekali. Kalau edit game yang udah punya slug, dipertahankan
    // (biar link yang udah kesebar ke orang gak jadi rusak).
    if (existingSlug) {
      data.slug = existingSlug;
    } else {
      const base = slugify(title) || "game";
      data.slug = await getUniqueSlug(base, editId);
    }

    if (editId) {
      await gamesRef.doc(editId).update(data);
    } else {
      await gamesRef.add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
    window.location.href = "index.html";
  } catch (err) {
    alert("Gagal simpan: " + err.message);
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Game";
  }
});

// ---------- Cancel / Back ----------
cancelBtn.addEventListener("click", () => window.location.href = "index.html");
backBtn.addEventListener("click", () => window.location.href = "index.html");
// Force remove loader & auth-pending
document.querySelector(".auth-loader")?.remove();
document.body.classList.remove("auth-pending");

}