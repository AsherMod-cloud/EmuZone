export async function onRequestGet(context) {
    const response = await context.next();

    if (!response.ok) {
        return response;
    }

    let html = await response.text();

    html = html.replace(
        /<meta id="ogTitle" property="og:title"[^>]*>/i,
        '<meta id="ogTitle" property="og:title" content="TEST OG — EmuZone">'
    );

    html = html.replace(
        /<meta id="ogImage" property="og:image"[^>]*>/i,
        '<meta id="ogImage" property="og:image" content="https://emuzone.pages.dev/assets/image/og-image.png">'
    );

    return new Response(html, {
        status: response.status,
        headers: {
            "Content-Type": "text/html; charset=UTF-8"
        }
    });
}