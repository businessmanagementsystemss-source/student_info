// -------------------------
// app.js
// -------------------------

// Toggle between login and register pages
window.showPage = function(pageId) {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("registerPage").classList.add("hidden");
    document.getElementById(pageId).classList.remove("hidden");
};

// Toggle password visibility
window.togglePassword = function(fieldId, icon) {
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
window.register = async function() {
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
window.login = async function() {
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
            loadAds(); // Load ads after login
        } else {
            alert(data.error);
        }
    } catch (e) {
        console.error(e);
        alert("Error connecting to server");
    }
};

// -------------------------
// Full-page overlay
// -------------------------
window.closeFullPage = function() {
    const fullPage = document.getElementById("fullPage");
    if (fullPage) fullPage.style.display = "none";
    if (window.location.hash === "#results") history.back();
};

window.openResults = async function() {
    const reg = window.loggedReg;
    if (!reg) return alert("Registration number missing");

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
// Ads carousel (original working logic)
// -------------------------
let adsImages = [];
let currentAd = 0;

async function loadAds() {
    try {
        const snapshot = await firebase.database().ref("Ads").get();
        if (!snapshot.exists()) return console.error("No ads found");

        const adsData = snapshot.val();
        adsImages = Object.keys(adsData).map(key => ({
            key,               // ad1, ad2, ...
            title: adsData[key].title || key,
            image: adsData[key].image
        }));

        const carousel = document.getElementById("adsCarousel");
        carousel.innerHTML = '';

        adsImages.forEach((ad, i) => {
            const img = document.createElement('img');
            img.src = ad.image;
            img.alt = ad.title;
            img.style.opacity = i === 0 ? 1 : 0;
            img.style.transition = "opacity 0.5s";
            img.style.cursor = "pointer";

            // Click handler fetches HTML dynamically
            img.addEventListener('click', async () => {
                const htmlSnap = await firebase.database().ref(`Ads/${ad.key}/html`).get();
                if (!htmlSnap.exists()) return alert("Ad HTML not found");
                showAd(htmlSnap.val(), ad.title);
            });

            carousel.appendChild(img);
        });

        // Start rotating ads every 10 seconds
        if (adsImages.length > 1) setInterval(nextAd, 10000);

    } catch (e) {
        console.error("Error loading ads:", e);
    }
}

function nextAd() {
    if (adsImages.length < 2) return;
    const imgs = document.querySelectorAll("#adsCarousel img");
    imgs[currentAd].style.opacity = 0;
    currentAd = (currentAd + 1) % imgs.length;
    imgs[currentAd].style.opacity = 1;
}

// -------------------------
// Show ad HTML in full-page overlay
// -------------------------
function showAd(html, title) {
    const fullContent = document.getElementById("fullContent");
    fullContent.innerHTML = html;

    const fullPage = document.getElementById("fullPage");
    if (fullPage) fullPage.style.display = "block";

    document.title = title || "Ad - Student Portal";
    history.pushState({ page: 'ads', title: title }, '', '#ads');
}

// -------------------------
// Close overlay by clicking outside
// -------------------------
window.onclick = function(event) {
    const fullPage = document.getElementById("fullPage");
    if (event.target === fullPage) closeFullPage();
};
