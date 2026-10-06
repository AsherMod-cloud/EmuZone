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
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                structuredQuery: {
                    from: [
                        {
                            collectionId: "games"
                        }
                    ],
                    where: {
                        fieldFilter: {
                            field: {
                                fieldPath: "slug"
                            },
                            op: "EQUAL",
                            value: {
                                stringValue: slug
                            }
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
                    title: fields.title?.stringValue || "",
                    slug: fields.slug?.stringValue || "",
                    cover: fields.cover?.stringValue || "",
                    banner: fields.banner?.stringValue || "",
                    console: fields.console?.stringValue || "",
                    emulator: fields.emulator?.stringValue || ""
                };
            }
        }
    } catch (error) {
        console.error("Firestore error:", error);
    }

    const response = await context.next();

    if (!response.ok) {
        return response;
    }

    if (!game) {
        return response;
    }

    let html = await response.text();

    const fallbackImage =
        "https://emuzone.pages.dev/assets/image/og-image.png";

    const title = game.title || "EmuZone";

    const image =
        game.cover ||
        game.banner ||
        fallbackImage;

    function generateOgDescription(game) {
        const title = game.title || "";
        const consoleName = game.console || "";
        const emulator = game.emulator || "";

        if (consoleName && emulator) {
            return `Download ${title} untuk ${consoleName}. Playable via ${emulator}. ROM, firmware, dan file pendukung tersedia di EmuZone.`;
        }

        if (consoleName) {
            return `Download ${title} untuk ${consoleName}. Tersedia ROM dan file pendukung di EmuZone.`;
        }

        return `Download ${title}. Tersedia ROM dan file pendukung di EmuZone.`;
    }

    const description = generateOgDescription(game);

    const canonical =
        "https://emuzone.pages.dev/game?slug=" +
        encodeURIComponent(game.slug || slug);

    function replaceMeta(id, content) {
        const escaped = String(content)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        const regex = new RegExp(
            `<meta id="${id}"[^>]*>`,
            "i"
        );

        html = html.replace(
            regex,
            `<meta id="${id}" content="${escaped}">`
        );
    }

    replaceMeta("ogTitle", title);
    replaceMeta("ogDesc", description);
    replaceMeta("ogImage", image);
    replaceMeta("ogUrl", canonical);

    replaceMeta("twTitle", title);
    replaceMeta("twDesc", description);
    replaceMeta("twImage", image);

    html = html.replace(
        /<link id="canonicalUrl"[^>]*>/i,
        `<link id="canonicalUrl" rel="canonical" href="${canonical}">`
    );

    html = html.replace(
        /<title>[\s\S]*?<\/title>/i,
        `<title>${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")} — EmuZone</title>`
    );

    const headers = new Headers(response.headers);

    headers.set(
        "Content-Type",
        "text/html; charset=UTF-8"
    );

    return new Response(html, {
        status: response.status,
        headers
    });
}