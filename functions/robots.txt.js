// functions/robots.txt.js

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const txt = `User-agent: *
Allow: /
Disallow: /editor.html
Disallow: /roadmap.html
Disallow: /Login.html
Disallow: /functions/

Sitemap: ${baseUrl}/sitemap.xml
`;

    return new Response(txt, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600"
        }
    });
}