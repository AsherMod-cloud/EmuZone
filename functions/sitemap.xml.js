import {
  SITE_URL,
  documentLastModified,
  documentSlug,
  fetchGameDocuments
} from "./_seo-data.js";

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlNode(loc, lastmod) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
    "    <changefreq>weekly</changefreq>",
    "    <priority>0.7</priority>",
    "  </url>"
  ].filter(Boolean).join("\n");
}

export async function onRequestGet(context) {
  const headers = {
    "Content-Type": "application/xml; charset=UTF-8",
    "Cache-Control": "public, max-age=300, s-maxage=1800",
    "X-Content-Type-Options": "nosniff"
  };

  try {
    const documents = await fetchGameDocuments();
    const seen = new Set();
    const gameUrls = [];

    for (const document of documents) {
      const slug = documentSlug(document);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);

      const modified = documentLastModified(document);
      gameUrls.push(urlNode(
        `${SITE_URL}/game.html?slug=${encodeURIComponent(slug)}`,
        modified ? modified.toISOString() : null
      ));
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      urlNode(`${SITE_URL}/`, null),
      urlNode(`${SITE_URL}/search.html`, null),
      ...gameUrls,
      "</urlset>",
      ""
    ].join("\n");

    return new Response(xml, { status: 200, headers });
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    const fallbackXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      urlNode(`${SITE_URL}/`, null),
      urlNode(`${SITE_URL}/search.html`, null),
      "</urlset>",
      ""
    ].join("\n");

    return new Response(fallbackXml, {
      status: 200,
      headers: {
        ...headers,
        "X-Sitemap-Fallback": "true"
      }
    });
  }
}
