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
            // Store logged-in reg number for results
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
    document.getElementById("fullPage").style.display = "none";
    // Remove the history state when closing overlay
    if (window.location.hash === "#results") {
        history.back();
    }
};

window.openResults = async function() {
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

            // Push a history state for browser back button
            history.pushState({ page: 'results' }, '', '#results');
        } else {
            alert(data.error);
        }
    } catch (e) {
        console.error(e);
        alert("Error fetching results");
    }
};

// Handle browser back button
window.onpopstate = function(event) {
    const overlay = document.getElementById("fullPage");
    if (overlay.style.display === "block") {
        overlay.style.display = "none";
    }
};

// -------------------------
// Ads carousel
// -------------------------
async function loadAds() {
    try {
        const res = await fetch('/api/ads');
        const data = await res.json();
        
        console.log("Ads data received:", data);
        console.log(`Number of ads received: ${data.ads ? data.ads.length : 0}`);

        if (data.success) {
            const adsImages = data.ads;
            const carousel = document.getElementById("adsCarousel");
            carousel.innerHTML = ''; // Clear previous ads
            
            carousel.style.display = 'flex';
            carousel.style.gap = '10px';
            carousel.style.overflowX = 'auto';
            
            adsImages.forEach(ad => {
                const img = document.createElement('img');
                img.src = ad.image;
                img.alt = ad.title; 
                img.style.width = '250px';
                img.style.height = '150px';
                img.style.objectFit = 'cover';
                img.style.cursor = 'pointer';

                img.addEventListener('click', () => {
                    console.log(`Clicked on ad: ${ad.title}`);
                    showAd(ad.html, ad.title);
                });

                carousel.appendChild(img);
            });
        }
    } catch (e) {
        console.error("Error loading ads:", e);
    }
}

function showAd(html, title) {
    const fullContent = document.getElementById("fullContent");
    fullContent.innerHTML = '';
    fullContent.innerHTML = html;
    const fullPage = document.getElementById("fullPage");
    if (fullPage) {
        fullPage.style.display = "block";
    }
    document.title = title || 'Ad - Student Portal';
    history.pushState({ page: 'ads', title: title }, '', '#ads');
}

window.onclick = function(event) {
    const fullPage = document.getElementById("fullPage");
    if (event.target === fullPage) {
        closeFullPage();
    }
};

function closeFullPage() {
    const fullPage = document.getElementById("fullPage");
    if (fullPage) {
        fullPage.style.display = "none";
    }
    history.back();
}

window.onpopstate = function(event) {
    const overlay = document.getElementById("fullPage");
    if (overlay && overlay.style.display === "block") {
        overlay.style.display = "none";
    }
};
