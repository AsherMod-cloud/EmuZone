export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
        return context.next();
    }

    const response = await context.next();

    if (!response.ok) {
        return response;
    }

    let html = await response.text();

    html = html.replace(
        /<meta\s+property=["']og:title["'][^>]*>/i,
        '<meta property="og:title" content="TEST OG — EmuZone">'
    );

    html = html.replace(
        /<meta\s+property=["']og:image["'][^>]*>/i,
        '<meta property="og:image" content="https://emuzone.pages.dev/assets/image/og-image.png">'
    );

    return new Response(html, {
        status: response.status,
        headers: {
            "Content-Type": "text/html; charset=UTF-8"
        }
    });
}