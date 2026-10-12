export async function onRequestGet(context) {
    const requestUrl = new URL(context.request.url);
    const slug = requestUrl.searchParams.get("slug");

    if (!slug) return context.next();

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
                const f = result.document.fields || {};
                const str = (key) => f[key]?.stringValue || "";
                const num = (key) => f[key]?.integerValue ? parseInt(f[key].integerValue, 10) : null;

                game = {
                    title: str("title"),
                    slug: str("slug"),
                    cover: str("cover"),
                    banner: str("banner"),
                    console: str("console"),
                    emulator: str("emulator"),
                    size: str("size"),
                    region: str("region"),
                    genre: str("genre"),
                    developer: str("developer"),
                    publisher: str("publisher"),
                    releaseDate: str("releaseDate") || str("releaseYear"),
                    description: str("description"),
                    rating: num("rating"),
                    screenshots: (f.screenshots?.arrayValue?.values || [])
                        .map(v => v.stringValue)
                        .filter(Boolean)
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
        return String(str ?? "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function toAbsoluteUrl(url) {
        if (!url) return null;
        if (/^https?:\/\//i.test(url)) return url;
        return "https://emuzone.my.id/" + url.replace(/^\/+/, "");
    }

    // Strip markdown dari description biar bersih
    function stripMarkdown(md) {
        return String(md || "")
            .replace(/```[\s\S]*?```/g, "")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/!\[.*?\]\(.*?\)/g, "")
            .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
            .replace(/#{1,6}\s+/g, "")
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/\*([^*]+)\*/g, "$1")
            .replace(/~~([^~]+)~~/g, "$1")
            .replace(/^[>\-*+]\s+/gm, "")
            .replace(/\n+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    // ============================================================
    // BUILD SEO TITLE
    // ============================================================
    function buildSeoTitle(g) {
        const t = g.title || "Game";
        const c = g.console;
        const e = g.emulator;

        let title = `${t} ROM`;
        if (c) title += ` (${c})`;
        if (e) title += ` - Download on ${e}`;
        title += ` | EmuZone`;

        // Safety: kalau kepanjangan, buang emulator
        if (title.length > 70) {
            title = `${t} ROM${c ? ` (${c})` : ""} | EmuZone`;
        }
        return title;
    }

    // ============================================================
    // BUILD SEO DESCRIPTION
    // ============================================================
    function buildSeoDescription(g) {
        const t = g.title || "Game";
        const c = g.console;
        const e = g.emulator;
        const s = g.size;
        const r = g.region;

        const parts = [];

        // Part 1
        let line1 = `Download ${t} ROM`;
        if (c) line1 += ` untuk ${c}`;
        line1 += ".";
        parts.push(line1);

        // Part 2
        if (e) parts.push(`Playable di Android via ${e}.`);

        // Part 3
        const specs = [];
        if (s) specs.push(`Ukuran ${s}`);
        if (r) specs.push(`region ${r}`);
        if (specs.length > 0) parts.push(specs.join(", ") + ".");

        // Part 4
        parts.push("Gratis & cepat di EmuZone.");

        let desc = parts.join(" ");
        if (desc.length > 158) desc = desc.slice(0, 155).trimEnd() + "...";

        return desc;
    }

    // ============================================================
    // BUILD VALUES
    // ============================================================
    const fallbackImage = "https://emuzone.my.id/assets/image/og-image.png";
    const seoTitle = buildSeoTitle(game);
    const seoDescription = buildSeoDescription(game);
    const image = toAbsoluteUrl(game.cover)
               || toAbsoluteUrl(game.banner)
               || fallbackImage;
    const canonical = "https://emuzone.my.id/game.html?slug=" + encodeURIComponent(game.slug || slug);
    const shortDesc = stripMarkdown(game.description).slice(0, 300);

    // ============================================================
    // REPLACE META
    // ============================================================
    function replaceMeta(id, content, extraAttrs) {
        const escaped = escapeHtml(content);
        const regex = new RegExp(`<meta\\s+[^>]*id=["']${id}["'][^>]*>`, "i");
        const attrs = extraAttrs ? ` ${extraAttrs}` : "";
        html = html.replace(regex, `<meta${attrs} id="${id}" content="${escaped}">`);
    }

    replaceMeta("metaDesc", seoDescription, 'name="description"');

    replaceMeta("ogTitle", seoTitle,    'property="og:title"');
    replaceMeta("ogDesc",  seoDescription, 'property="og:description"');
    replaceMeta("ogImage", image,       'property="og:image"');
    replaceMeta("ogUrl",   canonical,   'property="og:url"');

    replaceMeta("twTitle", seoTitle,    'name="twitter:title"');
    replaceMeta("twDesc",  seoDescription, 'name="twitter:description"');
    replaceMeta("twImage", image,       'name="twitter:image"');

    // Canonical link
    html = html.replace(
        /<link\s+[^>]*id=["']canonicalUrl["'][^>]*>/i,
        `<link id="canonicalUrl" rel="canonical" href="${canonical}">`
    );

    // Title tag
    html = html.replace(
        /<title>[\s\S]*?<\/title>/i,
        `<title>${escapeHtml(seoTitle)}</title>`
    );

    // ============================================================
    // JSON-LD — VideoGame Schema
    // ============================================================
    const videoGameLd = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": game.title || "Game",
        "url": canonical,
        "image": image,
        "description": shortDesc || seoDescription,
        "applicationCategory": "Game",
        "operatingSystem": game.console || "Emulator",
        "publisher": {
            "@type": "Organization",
            "name": "EmuZone",
            "url": "https://emuzone.my.id"
        },
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "IDR",
            "availability": "https://schema.org/InStock"
        }
    };

    if (game.genre) videoGameLd.genre = game.genre;
    if (game.developer) {
        videoGameLd.author = { "@type": "Organization", "name": game.developer };
    }
    if (game.releaseDate) videoGameLd.datePublished = game.releaseDate;
    if (game.rating && game.rating > 0) {
        videoGameLd.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": String(game.rating),
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "1"
        };
    }
    if (game.screenshots && game.screenshots.length > 0) {
        videoGameLd.screenshot = game.screenshots.map(toAbsoluteUrl).filter(Boolean);
    }

    // ============================================================
    // JSON-LD — BreadcrumbList Schema
    // ============================================================
    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://emuzone.my.id/"
            },
            ...(game.console ? [{
                "@type": "ListItem",
                "position": 2,
                "name": game.console,
                "item": `https://emuzone.my.id/?console=${encodeURIComponent(game.console)}`
            }] : []),
            {
                "@type": "ListItem",
                "position": game.console ? 3 : 2,
                "name": game.title || "Game"
            }
        ]
    };

    // ============================================================
    // INJECT JSON-LD KE <head>
    // ============================================================
    const jsonLdScripts = `
<script type="application/ld+json">${JSON.stringify(videoGameLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
`;

    html = html.replace("</head>", `${jsonLdScripts}</head>`);

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