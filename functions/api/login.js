export async function onRequestPost(context) {
    const { request, env } = context;
    
    // 1. Dapatkan IP Address (Cloudflare menyediakan header ini)
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const kvKey = `login_attempts:${ip}`;

    try {
        // 2. Cek Rate Limit (Maksimal 5 percobaan per 15 menit)
        const rawAttempts = await env.RATE_LIMIT_KV.get(kvKey);
        let attempts = rawAttempts ? JSON.parse(rawAttempts) : { count: 0 };
        
        if (attempts.count >= 5) {
            return new Response(
                JSON.stringify({ success: false, error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." }), 
                { status: 429, headers: { "Content-Type": "application/json" } }
            );
        }

        // 3. Ambil data dari client
        const { turnstileToken } = await request.json();
        if (!turnstileToken) {
            return new Response(
                JSON.stringify({ success: false, error: "Token verifikasi tidak ditemukan." }), 
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // 4. Verifikasi Token ke Cloudflare Siteverify API
        const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                secret: env.TURNSTILE_SECRET_KEY,
                response: turnstileToken,
                remoteip: ip
            })
        });

        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
            // Tambahkan percobaan gagal ke KV jika Turnstile gagal
            await env.RATE_LIMIT_KV.put(kvKey, JSON.stringify({ count: attempts.count + 1 }), { expirationTtl: 900 });
            return new Response(
                JSON.stringify({ success: false, error: "Verifikasi keamanan gagal." }), 
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }

        // 5. Jika Turnstile lolos, tambahkan percobaan (karena ini baru akan lanjut ke Firebase)
        await env.RATE_LIMIT_KV.put(kvKey, JSON.stringify({ count: attempts.count + 1 }), { expirationTtl: 900 });

        // 6. Kembalikan response sukses (Client akan lanjut ke Firebase Auth)
        return new Response(
            JSON.stringify({ success: true }), 
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("CF Function Error:", err);
        return new Response(
            JSON.stringify({ success: false, error: "Terjadi kesalahan server." }), 
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}