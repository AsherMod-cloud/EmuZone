// ======================================================
// Requirement Types
// ======================================================

const REQUIREMENT_TYPES = Object.freeze({
  bios: {
    label: "BIOS",
    icon: "🔥",
    placeholder: "Link BIOS",
    description: "BIOS file required by the emulator."
  },

  firmware: {
    label: "Firmware",
    icon: "🔧",
    placeholder: "Link Firmware",
    description: "Official emulator firmware."
  },

  fontPackage: {
    label: "Font Package",
    icon: "🔤",
    placeholder: "Link Font Package",
    description: "Official font package."
  },

  keys: {
    label: "Keys",
    icon: "🔑",
    placeholder: "Link title.keys",
    description: "Required encryption keys."
  },

  prodkeys: {
    label: "Prod.keys",
    icon: "🔑",
    placeholder: "Link prod.keys",
    description: "Nintendo Switch production keys."
  },

  driver: {
    label: "GPU Driver",
    icon: "🚗",
    placeholder: "Link GPU Driver",
    description: "Recommended GPU driver."
  },

  configSetting: {
    label: "Config",
    icon: "⚙️",
    placeholder: "Link Config",
    description: "Recommended emulator configuration."
  },

  neogeoZip: {
    label: "neogeo.zip",
    icon: "🗜️",
    placeholder: "Link neogeo.zip",
    description: "Neo Geo BIOS."
  }
});

// ======================================================
// Guide Levels
// ======================================================

const GUIDE_LEVEL = Object.freeze({
  SIMPLE: "simple",
  MEDIUM: "medium",
  HARD: "hard"
});

// ======================================================
// Installation Guide Templates
// ======================================================

const INSTALLATION_GUIDES = Object.freeze({
  simple: emulator => `1. Install ${emulator}.
2. Download the ROM.
3. Open the ROM using ${emulator}.
4. Enjoy the game!`,

  medium: emulator => `1. Install ${emulator}.
2. Configure the basic settings.
3. Add or scan your game folder.
4. Open the game.
5. If needed, follow the Installation Guide.`,

  hard: emulator => `1. Install ${emulator}.
2. Import the required files.
3. Configure ${emulator}.
4. Open the game.
5. If you need help, follow the Installation Guide.`
});

// ======================================================
// Default Emulator
// ======================================================

const EMPTY_EMULATOR = Object.freeze({
  requiredFields: [],
  optional: [],
  guide: GUIDE_LEVEL.SIMPLE,

  tutorial: {
    url: "",
    credit: "",
    label: ""
  }
});

// ======================================================
// Emulator Database
// ======================================================

const EMULATORS = Object.freeze([
  {
    console: "PS1",
    name: "DuckStation",
    
    requiredFields: ["bios"],
    optional: [],
    
    guide: GUIDE_LEVEL.HARD,
    
    tutorial: {
        url: "https://youtu.be/rfPeV5Y8WJ4?si=PLyVJHoulCfIRwXx",
        credit: "Den MBolang",
        label: "Youtube ID"
    }
  },
  {
    console: "PS2",
    name: "AetherSX2",
    
    requiredFields: ["bios"],
    optional: ["configSetting"],

    guide: GUIDE_LEVEL.HARD,
    
    tutorial: {
        url: "https://www.facebook.com/watch/?v=1895714424155927&vanity=61553779298411",
        credit: "Unknown",
        label: "Facebook ID"
    }
  },
  {
    console: "PS3",
    name: "RPCS3",
    
    requiredFields: ["firmware"],
    optional: ["configSetting"],
    
    guide: GUIDE_LEVEL.HARD,
    
    tutorial: {
        url: "https://youtu.be/0W5O23xm0j8?si=VPrRUtFEnq7T81MW",
        credit: "Ary Ducky2",
        label: "Youtube ID"
    }
  },
  {
    console: "PSP",
    name: "PPSSPP",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "https://youtu.be/dg8HFc6b5sk?si=YqwdhSdEJA5tswld",
        credit: "PWG",
        label: "Youtube EN"
    }
  },
  {
    console: "PS Vita",
    name: "Vita3K",
    
    requiredFields: ["firmware", "fontPackage"],
    optional: [],
    
    guide: GUIDE_LEVEL.HARD,
    
    tutorial: {
        url: "https://youtu.be/LjDdaZl7i-w?si=8a4vkQbkekyENQwk",
        credit: "AndiCandraRewiew",
        label: "Youtube ID"
    }
  },

  // Nintendo
  {
    console: "NES",
    name: "RetroArch",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.MEDIUM,
    
    tutorial: {
        url: "https://youtu.be/Gd1OiaqsIwo?si=Yx5F31uiCwVcdE01",
        credit: "KeyvanDN",
        label: "Youtube EN"
    }
  },
  {
    console: "SNES",
    name: "Snes9x",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Game Boy",
    name: "My OldBoy!",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Game Boy Color",
    name: "My OldBoy!",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Game Boy Advance",
    name: "My Boy!",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Nintendo DS",
    name: "melonDS",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Nintendo 3DS",
    name: "Lime3DS",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Nintendo 64",
    name: "M64Plus FZ",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "GameCube",
    name: "Dolphin",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.MEDIUM,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Wii",
    name: "Dolphin",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.MEDIUM,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Wii U",
    name: "Cemu",
    
    requiredFields: ["keys"],
    optional: [],
    
    guide: GUIDE_LEVEL.MEDIUM,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Nintendo Switch",
    name: "Sudachi",
    
    requiredFields: ["firmware", "prodkeys", "driver"],
    optional: [],
    
    guide: GUIDE_LEVEL.HARD,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },

  // SEGA
  {
    console: "Master System",
    name: "RetroArch",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.MEDIUM,
    
    tutorial: {
        url: "https://youtu.be/Gd1OiaqsIwo?si=Yx5F31uiCwVcdE01",
        credit: "KeyvanDN",
        label: "Youtube EN"
    }
  },
  {
    console: "Game Gear",
    name: "RetroArch",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.MEDIUM,
    
    tutorial: {
        url: "https://youtu.be/Gd1OiaqsIwo?si=Yx5F31uiCwVcdE01",
        credit: "KeyvanDN",
        label: "Youtube EN"
    }
  },
  {
    console: "Mega Drive / Genesis",
    name: "MD.emu",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Sega Saturn",
    name: "Yaba Sanshiro 2",
    
    requiredFields: ["bios"],
    optional: [],
    
    guide: GUIDE_LEVEL.MEDIUM,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Dreamcast",
    name: "Flycast",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },

  // Arcade
  {
    console: "Arcade",
    name: "MAME4droid",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.MEDIUM,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Neo Geo",
    name: "FinalBurn Neo",
    
    requiredFields: ["neogeoZip"],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },

  // Other
  {
    console: "Gamehub",
    name: "GameHub",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Joiplay",
    name: "JoiPlay",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "PC",
    name: "Winlator",
    
    requiredFields: [],
    optional: [],
    
    guide: GUIDE_LEVEL.MEDIUM,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Android",
    name: "Android",
    
    requiredFields: [],
    optional: [],

    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  },
  {
    console: "Other",
    name: "",
    
    requiredFields: [],
    optional: [],

    guide: GUIDE_LEVEL.SIMPLE,
    
    tutorial: {
        url: "",
        credit: "",
        label: ""
    }
  }
]);

// ======================================================
// Emulator Lookup
// Find emulator configuration by name.
// Returns EMPTY_EMULATOR if no match is found.
// ======================================================

function getEmulatorInfo(emulatorName) {
    if (!emulatorName) return EMPTY_EMULATOR;

    const key = emulatorName.trim().toLowerCase();

    return EMULATORS.find(e =>
        e.name &&
        e.name.toLowerCase() === key
    ) || EMPTY_EMULATOR;
}

// ======================================================
// Helper Tutorial
// Return true jika emulator memiliki tutorial yang lengkap.
// Nanti saat semua data selesai, fungsi ini bisa disederhanakan
// menjadi: return !!emulator?.tutorial;
// ======================================================

function hasTutorial(emulator) {
    const tutorial = emulator?.tutorial;

    return Boolean(
        tutorial?.url &&
        tutorial?.label &&
        tutorial?.credit
    );
}

// ======================================================
// Search Helpers
// Dipake di editor, index, dan search page.
// ======================================================

function normalizeSearchText(value) {
    return String(value || "")
        .normalize("NFKC")
        .toLocaleLowerCase("id-ID")
        .trim();
}

function generateTitleWords(title) {
    return [
        ...new Set(
            normalizeSearchText(title)
                .split(/[^\p{L}\p{N}]+/u)
                .filter(Boolean)
        )
    ];
}

function generateTitleSubstrings(title, minLength = 2) {
    const words = generateTitleWords(title);
    const substrings = new Set();

    for (const word of words) {
        const chars = Array.from(word);
        for (let start = 0; start < chars.length; start++) {
            for (let end = start + minLength; end <= chars.length; end++) {
                substrings.add(chars.slice(start, end).join(""));
            }
        }
    }

    return [...substrings];
}

function buildGameSearchFields(title) {
    return {
        title_words: generateTitleWords(title),
        title_substrings: generateTitleSubstrings(title)
    };
}