(() => {
  const currentPath = (window.location.pathname.replace(/\/+$/, "").replace(/\.html$/, "")) || "/";
  const isActive = path => currentPath === path || currentPath.startsWith(`${path}/`);

  const menu = [
    {
      label: "OVERVIEW",
      items: [
        { href: "/admin/dashboard", icon: "dashboard", text: "Dashboard", path: "/admin/dashboard" }
      ]
    },
    {
      label: "CONTENT",
      items: [
        { href: "/admin/editor", icon: "sports_esports", text: "Games", path: "/admin/editor" },
        { href: "/admin/roadmap", icon: "map", text: "Roadmap", path: "/admin/roadmap" }
      ]
    },
    {
      label: "COMMUNITY",
      items: [
        { href: "/admin/request", icon: "flag", text: "Requests", path: "/admin/request" },
        { href: "/admin/reports", icon: "report", text: "Reports", path: "/admin/reports" }
      ]
    }
  ];

  const groups = menu.map(group => `
    <div class="admin-sidebar-group">
      <div class="admin-sidebar-label">${group.label}</div>
      ${group.items.map(item => `
        <a class="admin-sidebar-link${isActive(item.path) ? " is-active" : ""}" href="${item.href}"${isActive(item.path) ? ' aria-current="page"' : ""}>
          <span class="material-symbols-outlined" aria-hidden="true">${item.icon}</span>
          <span>${item.text}</span>
        </a>`).join("")}
    </div>`).join("");

  const sidebar = document.createElement("aside");
  sidebar.className = "admin-sidebar";
  sidebar.id = "adminSidebar";
  sidebar.setAttribute("aria-label", "Admin navigation");
  sidebar.innerHTML = `
    <div class="admin-sidebar-brand">
      <span class="admin-sidebar-mark" aria-hidden="true">▣</span>
      <strong>EMUZONE ADMIN</strong>
      <button class="admin-sidebar-close" type="button" data-sidebar-close aria-label="Tutup menu">
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>
    <nav class="admin-sidebar-nav">${groups}</nav>
    <div class="admin-sidebar-footer">
      <a class="admin-sidebar-link" href="/">
        <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
        <span>Website</span>
      </a>
      <button class="admin-sidebar-link admin-sidebar-logout" id="logoutBtn" type="button" data-sidebar-logout>
        <span class="material-symbols-outlined" aria-hidden="true">logout</span>
        <span>Logout</span>
      </button>
    </div>`;

  const overlay = document.createElement("div");
  overlay.className = "admin-sidebar-overlay";
  overlay.setAttribute("data-sidebar-close", "");
  overlay.setAttribute("aria-hidden", "true");

  document.body.classList.add("admin-shell");
  document.body.prepend(overlay);
  document.body.prepend(sidebar);

  const header = document.querySelector("header.topbar, header.roadmap-header");
  if (header) {
    const toggle = document.createElement("button");
    toggle.className = "admin-menu-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Buka menu admin");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">menu</span><span class="admin-menu-toggle-text">Menu</span>';
    header.prepend(toggle);
  }

  const setOpen = open => {
    document.body.classList.toggle("admin-sidebar-open", open);
    const toggle = document.querySelector(".admin-menu-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", String(open));
  };

  document.addEventListener("click", event => {
    const toggle = event.target.closest(".admin-menu-toggle");
    if (toggle) setOpen(!document.body.classList.contains("admin-sidebar-open"));
    if (event.target.closest("[data-sidebar-close]")) setOpen(false);
    if (event.target.closest("[data-sidebar-logout]")) {
      if (typeof window.logout === "function") window.logout();
      else window.location.href = "/admin/login";
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setOpen(false);
  });
})();
