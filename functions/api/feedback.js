export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const body = await request.json();
        const { type, name, message, title, platform, category, gameTitle, gameSlug, gameConsole } = body;

        if (type !== "request" && type !== "report") {
            throw new Error("Tipe feedback tidak valid.");
        }

                // ==========================================
        // HELPER & CONFIG UNTUK FORMAT TELEGRAM
        // ==========================================
        function escapeTgHtml(text) {
            if (!text) return "-";
            return String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }

        const categoryMap = {
            "broken_link": "Link Rusak",
            "not_playable": "Tidak Bisa Dimainkan",
            "wrong_info": "Informasi Salah",
            "other": "Lainnya"
        };

        const safeName = escapeTgHtml(name || "Anonim");
        const safeMessage = escapeTgHtml(message);

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

        // ==========================================
        // SUSUN FORMAT PESAN TELEGRAM
        // ==========================================
        if (type === "request") {
            fields.title = { stringValue: title || "Tanpa Judul" };
            fields.platform = { stringValue: platform || "-" };
            
            tgMessage = `📩 <b>REQUEST GAME BARU</b>
━━━━━━━━━━━━━━━━━━━━
🎮 <b>Game:</b> ${escapeTgHtml(title)}
🕹️ <b>Platform:</b> ${escapeTgHtml(platform)}
👤 <b>Oleh:</b> ${safeName}
━━━━━━━━━━━━━━━━━━━━
📝 <b>Pesan:</b>
<i>${safeMessage}</i>`;

        } else {
            fields.gameTitle = { stringValue: gameTitle || "Game" };
            fields.gameSlug = { stringValue: gameSlug || "-" };
            fields.gameConsole = { stringValue: gameConsole || "-" };
            fields.category = { stringValue: category || "other" };
            
            const humanCategory = categoryMap[category] || category;
            
            tgMessage = `⚠️ <b>LAPORAN MASALAH</b>
━━━━━━━━━━━━━━━━━━━━
🎮 <b>Game:</b> ${escapeTgHtml(gameTitle)} (${escapeTgHtml(gameConsole)})
🔗 <b>Slug:</b> <code>${escapeTgHtml(gameSlug)}</code>
📌 <b>Kategori:</b> ${escapeTgHtml(humanCategory)}
👤 <b>Oleh:</b> ${safeName}
━━━━━━━━━━━━━━━━━━━━
📝 <b>Pesan:</b>
<i>${safeMessage}</i>`;
        }

        // 1. Simpan ke Firestore
        const fsRes = await fetch(firestoreUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fields })
        });

        if (!fsRes.ok) throw new Error("Gagal menyimpan ke database.");

				// 2. Kirim Notifikasi ke Telegram
				try {
				    const tgRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
				        method: "POST",
				        headers: { "Content-Type": "application/json" },
 				        body: JSON.stringify({
 		            chat_id: env.TELEGRAM_ADMIN_ID,
  	            text: tgMessage,
		            parse_mode: "HTML" // <--- GANTI JADI HTML BIAR GAK ERROR
			        })
		    });

		    // Cek kalau Telegram nolak pesannya
		    if (!tgRes.ok) {
		        const errData = await tgRes.json();
		        console.error("Telegram Error:", errData);
		    }
		} catch (tgError) {
		    console.error("Gagal nembak API Telegram:", tgError);
				}

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