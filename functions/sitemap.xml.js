// functions/sitemap.xml.js

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const projectId = "emulator-games-id-bf695";
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/games?pageSize=500&mask.fieldPaths=slug&mask.fieldPaths=updatedAt`;

    let games = [];
    try {
        const res = await fetch(firestoreUrl);
        const data = await res.json();

        if (data.documents) {
            games = data.documents.map(doc => {
                const fields = doc.fields || {};
                return {
                    slug: fields.slug?.stringValue || doc.name.split("/").pop(),
                    updatedAt: fields.updatedAt?.timestampValue || new Date().toISOString()
                };
            });
        }
    } catch (err) {
        console.error("Sitemap: fetch gagal:", err);
    }

    const today = new Date().toISOString().split("T")[0];

    const urls = [
        `  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
        `  <url>
    <loc>${baseUrl}/search.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`,
        ...games.map(g => `  <url>
    <loc>${baseUrl}/game.html?slug=${encodeURIComponent(g.slug)}</loc>
    <lastmod>${(g.updatedAt || today).split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600"
        }
    });
}