export async function onRequestGet(context) {
    const requestUrl = new URL(context.request.url);
    const slug = requestUrl.searchParams.get("slug");

    if (!slug) {
        return context.next();
    }

    const firestoreUrl =
        "https://firestore.googleapis.com/v1/projects/" +
        "emulator-games-id-bf695/databases/(default)/documents:runQuery";

    let game = null;

    try {
        const firestoreResponse = await fetch(firestoreUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                structuredQuery: {
                    from: [{ collectionId: "games" }],
                    where: {
                        fieldFilter: {
                            field: { fieldPath: "slug" },
                            op: "EQUAL",
                            value: { stringValue: slug }
                        }
                    },
                    limit: 1
                }
            })
        });

        if (firestoreResponse.ok) {
            const results = await firestoreResponse.json();
            const result = results.find(item => item.document);

            if (result?.document) {
                const fields = result.document.fields || {};
                game = {
                    title:    fields.title?.stringValue || "",
                    slug:     fields.slug?.stringValue || "",
                    cover:    fields.cover?.stringValue || "",
                    banner:   fields.banner?.stringValue || "",
                    console:  fields.console?.stringValue || "",
                    emulator: fields.emulator?.stringValue || ""
                };
            }
        }
    } catch (error) {
        console.error("Firestore error:", error);
    }

    const response = await context.next();
    if (!response.ok) return response;
    if (!game) return response;

    let html = await response.text();

    // ============================================================
    // HELPERS
    // ============================================================
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function toAbsoluteUrl(url) {
        if (!url) return null;
        if (/^https?:\/\//i.test(url)) return url;
        return "https://emuzone.pages.dev/" + url.replace(/^\/+/, "");
    }

    function generateOgDescription(g) {
        const t = g.title || "";
        const c = g.console || "";
        const e = g.emulator || "";

        if (c && e) return `Download ${t} untuk ${c}. Playable via ${e}. ROM, firmware, dan file pendukung tersedia di EmuZone.`;
        if (c) return `Download ${t} untuk ${c}. Tersedia ROM dan file pendukung di EmuZone.`;
        return `Download ${t}. Tersedia ROM dan file pendukung di EmuZone.`;
    }

    function replaceMeta(id, content, extraAttrs) {
        const escaped = escapeHtml(content);
        const regex = new RegExp(`<meta\\s+[^>]*id=["']${id}["'][^>]*>`, "i");
        const attrs = extraAttrs ? ` ${extraAttrs}` : "";
        html = html.replace(regex, `<meta${attrs} id="${id}" content="${escaped}">`);
    }

    // ============================================================
    // BUILD VALUES
    // ============================================================
    const fallbackImage = "https://emuzone.pages.dev/assets/image/og-image.png";
    const title = game.title || "EmuZone";
    const image = toAbsoluteUrl(game.cover) 
               || toAbsoluteUrl(game.banner) 
               || fallbackImage;
    const description = generateOgDescription(game);
    const canonical = "https://emuzone.pages.dev/game?slug=" + encodeURIComponent(game.slug || slug);

    // ============================================================
    // REPLACE META
    // ============================================================
    replaceMeta("metaDesc", description, 'name="description"');

    replaceMeta("ogTitle", title,       'property="og:title"');
    replaceMeta("ogDesc",  description, 'property="og:description"');
    replaceMeta("ogImage", image,       'property="og:image"');
    replaceMeta("ogUrl",   canonical,   'property="og:url"');

    replaceMeta("twTitle", title,       'name="twitter:title"');
    replaceMeta("twDesc",  description, 'name="twitter:description"');
    replaceMeta("twImage", image,       'name="twitter:image"');

    // Canonical link
    html = html.replace(
        /<link\s+[^>]*id=["']canonicalUrl["'][^>]*>/i,
        `<link id="canonicalUrl" rel="canonical" href="${canonical}">`
    );

    // Title
    html = html.replace(
        /<title>[\s\S]*?<\/title>/i,
        `<title>${escapeHtml(title)} — EmuZone</title>`
    );

    // ============================================================
    // RETURN
    // ============================================================
    const headers = new Headers(response.headers);
    headers.set("Content-Type", "text/html; charset=UTF-8");

    return new Response(html, {
        status: response.status,
        headers
    });
}