import { SITE_URL } from "./_seo-data.js";

export async function onRequestGet() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /Login.html",
    "Disallow: /editor.html",
    "Disallow: /roadmap.html",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    ""
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=UTF-8",
      "Cache-Control": "public, max-age=300, s-maxage=1800",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
