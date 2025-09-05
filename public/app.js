// -------------------------
// app.js
// -------------------------

// Toggle between login and register pages
window.showPage = function (pageId) {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("registerPage").classList.add("hidden");
    document.getElementById(pageId).classList.remove("hidden");
};

// Toggle password visibility
window.togglePassword = function (fieldId, icon) {
    const field = document.getElementById(fieldId);
    if (field.type === "password") {
        field.type = "text";
        icon.textContent = "🚫";
    } else {
        field.type = "password";
        icon.textContent = "👁️";
    }
};

// -------------------------
// Registration
// -------------------------
window.register = async function () {
    const name = document.getElementById("fullName").value.trim();
    const reg = document.getElementById("regNumber").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const gender = document.getElementById("gender").value;
    const dob = document.getElementById("dob").value;
    const pass = document.getElementById("password").value;
    const repeatPass = document.getElementById("repeatPassword").value;

    if (!name || !reg || !email || !phone || !gender || !dob || !pass || !repeatPass) {
        alert("Please fill all fields!");
        return;
    }
    if (pass !== repeatPass) {
        alert("Passwords do not match!");
        return;
    }

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, reg, email, phone, gender, dob, password: pass })
        });
        const data = await res.json();
        if (data.success) {
            alert(`✅ Registered Successfully!\nName: ${name}\nReg: ${reg}`);
            showPage('loginPage');
        } else {
            alert(data.error || "Error registering student");
        }
    } catch (e) {
        console.error(e);
        alert("Error connecting to server");
    }
};

// -------------------------
// Login
// -------------------------
window.login = async function () {
    const reg = document.getElementById("loginReg").value.trim();
    const pass = document.getElementById("loginPass").value;

    if (!reg || !pass) {
        alert("Enter registration number and password");
        return;
    }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reg, password: pass })
        });
        const data = await res.json();
        if (data.success) {
            window.loggedReg = reg;
            document.querySelector("#loginPage").parentElement.classList.add("hidden");
            document.getElementById("dashboardPage").classList.remove("hidden");
            loadAds(); // load ads after login
        } else {
            alert(data.error);
        }
    } catch (e) {
        console.error(e);
        alert("Error connecting to server");
    }
};

// -------------------------
// Results
// -------------------------
window.openResults = async function () {
    const reg = window.loggedReg;
    if (!reg) {
        alert("Registration number missing");
        return;
    }

    try {
        const res = await fetch(`/api/results?reg=${encodeURIComponent(reg)}`);
        const data = await res.json();
        if (data.success) {
            document.getElementById("fullContent").innerHTML = data.html;
            document.getElementById("fullPage").style.display = "block";
            history.pushState({ page: 'results' }, '', '#results');
        } else {
            alert(data.error);
        }
    } catch (e) {
        console.error(e);
        alert("Error fetching results");
    }
};

// -------------------------
// Overlay
// -------------------------
window.closeFullPage = function () {
    const fullPage = document.getElementById("fullPage");
    if (fullPage) fullPage.style.display = "none";
    if (window.location.hash === "#results" || window.location.hash === "#ads") {
        history.back();
    }
};

window.onpopstate = function () {
    const overlay = document.getElementById("fullPage");
    if (overlay && overlay.style.display === "block") {
        overlay.style.display = "none";
    }
};

window.onclick = function (event) {
    const fullPage = document.getElementById("fullPage");
    if (event.target === fullPage) {
        closeFullPage();
    }
};

// -------------------------
// Ads carousel
// -------------------------
let adsImages = [], currentAd = 0;
let adInterval;

async function loadAds() {
    try {
        const res = await fetch('/api/ads');
        const data = await res.json();
        console.log("📢 Ads data received:", data);

        if (data.success) {
            adsImages = data.ads;
            const carousel = document.getElementById("adsCarousel");
            carousel.innerHTML = '';

            adsImages.forEach((ad, i) => {
                const img = document.createElement('img');
                img.src = ad.image;
                img.alt = ad.title || `Ad ${ad.id}`;
                img.style.opacity = i === 0 ? 1 : 0;

                // ✅ Correct closure: capture ad.id for this listener
                img.addEventListener('click', ((adId) => {
                    return () => {
                        console.log(`🖱️ Clicked ad: ${adId}`);
                        fetchAdHtml(adId);
                    };
                })(ad.id));

                carousel.appendChild(img);
            });

            // Clear previous interval if exists
            if (adInterval) clearInterval(adInterval);
            if (adsImages.length > 1) {
                adInterval = setInterval(nextAd, 10000);
            }
        }
    } catch (e) {
        console.error("Error loading ads:", e);
    }
}

// Fetch ad HTML string from Firebase
async function fetchAdHtml(adId) {
    try {
        const firebaseUrl = `https://student-portal-8e8d3-default-rtdb.firebaseio.com/ads/${adId}/html.json`;
        console.log("📡 Fetching:", firebaseUrl);

        const response = await fetch(firebaseUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const htmlContent = await response.json();
        console.log("🔥 Firebase returned:", htmlContent);

        if (htmlContent && typeof htmlContent === "string" && htmlContent.trim() !== "") {
            showAd(htmlContent);
        } else {
            alert("Ad content not available");
        }
    } catch (error) {
        console.error("Error fetching ad HTML:", error);
        alert("Error loading ad content");
    }
}

// Rotate ads
function nextAd() {
    if (adsImages.length < 2) return;
    const imgs = document.querySelectorAll("#adsCarousel img");
    imgs[currentAd].style.opacity = 0;
    currentAd = (currentAd + 1) % adsImages.length;
    imgs[currentAd].style.opacity = 1;
}

// Display ad overlay
function showAd(html) {
    const fullContent = document.getElementById("fullContent");
    fullContent.innerHTML = html;

    const fullPage = document.getElementById("fullPage");
    if (fullPage) fullPage.style.display = "block";
}
