// ---------- DOM Elements ----------
const loginBtn = document.getElementById("loginBtn");
const errorBox = document.getElementById("errorBox");
const loginBtnText = document.getElementById("loginBtnText");
const loginSpinner = document.getElementById("loginSpinner");
const toggleBtn = document.getElementById("togglePass");
const passInput = document.getElementById("password");
const eyeOpen = toggleBtn.querySelector(".eye-open");
const eyeClosed = toggleBtn.querySelector(".eye-closed");

// ---------- State ----------
let turnstileToken = null;

// ---------- Initialization ----------
redirectIfLoggedIn();

// ---------- Password Toggle ----------
toggleBtn.addEventListener("click", () => {
    const show = passInput.type === "password";
    passInput.type = show ? "text" : "password";
    
    // Toggle icon & aria-label
    eyeOpen.style.display = show ? "none" : "block";
    eyeClosed.style.display = show ? "block" : "none";
    toggleBtn.setAttribute("aria-label", show ? "Sembunyikan password" : "Tampilkan password");
});

// ---------- Turnstile Callback ----------
// Dipanggil otomatis oleh Cloudflare Turnstile jika user lolos verifikasi
window.onTurnstileSuccess = function(token) {
    turnstileToken = token;
};

// ---------- UI Helpers ----------
function setLoginBusy(isBusy) {
    loginBtn.disabled = isBusy;
    loginBtnText.textContent = isBusy ? "Signing in..." : "Login";
    loginSpinner.style.display = isBusy ? "inline-block" : "none";
}

// ---------- Main Login Handler ----------
loginBtn.addEventListener("click", async () => {
    const identifier = document.getElementById("email").value.trim();
    const password = passInput.value;
    const account = findAdminByLogin(identifier);

    errorBox.textContent = "";

    // 1. Validasi Client-Side
    if (!account) {
        errorBox.textContent = "Akun tidak terdaftar sebagai admin.";
        return;
    }

    if (!password) {
        errorBox.textContent = "Password wajib diisi.";
        return;
    }

    if (!turnstileToken) {
        errorBox.textContent = "Selesaikan verifikasi keamanan terlebih dahulu.";
        return;
    }

    setLoginBusy(true);

    try {
        // 2. Verifikasi Turnstile & Rate Limit via Cloudflare Function
        const verifyRes = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ turnstileToken })
        });

        const verifyData = await verifyRes.json();
        
        if (!verifyData.success) {
            throw new Error(verifyData.error || "Verifikasi keamanan gagal.");
        }

        // 3. Firebase Authentication
        const remember = document.getElementById("rememberMe").checked;
        const persistence = remember
            ? firebase.auth.Auth.Persistence.LOCAL
            : firebase.auth.Auth.Persistence.SESSION;

        await auth.setPersistence(persistence);
        const credential = await auth.signInWithEmailAndPassword(account.email, password);

        // 4. Verifikasi Akses Admin
        if (!isAdminUser(credential.user)) {
            await auth.signOut();
            throw new Error("AUTH_ACCOUNT_NOT_ALLOWED");
        }

        // 5. Sukses
        window.location.replace("/");
        
    } catch (err) {
        console.error("Login Error:", err);
        
        // Tampilkan pesan error yang sesuai
        errorBox.textContent = err.message === "AUTH_ACCOUNT_NOT_ALLOWED"
            ? "Akun berhasil login, tetapi tidak memiliki akses admin."
            : err.code === "auth/too-many-requests"
                ? "Firebase membatasi percobaan login sementara. Coba lagi nanti."
                : err.message || "Password salah atau akun Firebase tidak dapat digunakan.";

        // 6. Reset Turnstile agar user bisa mencoba lagi
        if (window.turnstile) {
            window.turnstile.reset();
            turnstileToken = null;
        }
        
        setLoginBusy(false);
    }
});