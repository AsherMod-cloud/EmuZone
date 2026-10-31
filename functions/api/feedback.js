export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const body = await request.json();
        const { type, name, message, title, platform, category, gameTitle, gameSlug, gameConsole } = body;

        if (type !== "request" && type !== "report") {
            throw new Error("Tipe feedback tidak valid.");
        }

        const collectionName = type === "report" ? "reports" : "requests";
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/emulator-games-id-bf695/databases/(default)/documents/${collectionName}`;

        // Susun payload untuk Firestore (sesuai rules yang udah kita bikin)
        const fields = {
            status: { stringValue: "pending" },
            name: { stringValue: name || "Anonim" },
            message: { stringValue: message || "-" },
            createdAt: { timestampValue: new Date().toISOString() }
        };

        let tgMessage = "";

        if (type === "request") {
            fields.title = { stringValue: title || "Tanpa Judul" };
            fields.platform = { stringValue: platform || "-" };
            
            tgMessage = `📩 *REQUEST GAME BARU*\n\n🎮 *Game:* ${title}\n🕹️ *Platform:* ${platform || "-"}\n👤 *Oleh:* ${name || "Anonim"}\n📝 *Pesan:* ${message}`;
        } else {
            fields.gameTitle = { stringValue: gameTitle || "Game" };
            fields.gameSlug = { stringValue: gameSlug || "-" };
            fields.gameConsole = { stringValue: gameConsole || "-" };
            fields.category = { stringValue: category || "other" };
            
            tgMessage = `⚠️ *LAPORAN LINK RUSAK*\n\n🎮 *Game:* ${gameTitle} (${gameConsole})\n🆔 *Slug:* ${gameSlug}\n📌 *Kategori:* ${category}\n👤 *Oleh:* ${name || "Anonim"}\n📝 *Pesan:* ${message}`;
        }

        // 1. Simpan ke Firestore
        const fsRes = await fetch(firestoreUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fields })
        });

        if (!fsRes.ok) throw new Error("Gagal menyimpan ke database.");

        // 2. Kirim Notifikasi ke Telegram
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: env.TELEGRAM_ADMIN_ID,
                text: tgMessage,
                parse_mode: "Markdown"
            })
        });

        return new Response(JSON.stringify({ 
            success: true, 
            message: type === "request" ? "Request berhasil dikirim!" : "Laporan berhasil dikirim!"
        }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
        });
    }
}