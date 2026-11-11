// admin/admin-sw.js
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Biarkan kosong dulu, yang penting file ini ada
self.addEventListener('fetch', (event) => {
    // Saat ini kita biarkan fetch berjalan normal (network only)
});