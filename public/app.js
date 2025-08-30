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
let ads = [];
let currentIndex = 0;
let carouselInterval;

async function loadAds() {
    try {
        const res = await fetch('/api/ads');
        const data = await res.json();

        if (data.success && data.ads.length > 0) {
            ads = data.ads;
            const carousel = document.getElementById("adsCarousel");
            carousel.innerHTML = '';
            
            // Create a new inner container for the sliding effect
            const carouselInner = document.createElement('div');
            carouselInner.style.display = 'flex';
            carouselInner.style.transition = 'transform 0.5s ease-in-out';

            ads.forEach((ad, i) => {
                const img = document.createElement('img');
                img.src = ad.image;
                img.alt = ad.title;
                img.style.minWidth = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.cursor = 'pointer';

                img.addEventListener('click', () => {
                    showAd(ad.html, ad.title);
                });
                
                carouselInner.appendChild(img);
            });
            
            carousel.appendChild(carouselInner);

            // Add navigation buttons
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '<';
            prevBtn.onclick = () => moveCarousel(-1);

            const nextBtn = document.createElement('button');
            nextBtn.textContent = '>';
            nextBtn.onclick = () => moveCarousel(1);
            
            // Style the buttons
            const btnStyle = `
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background-color: rgba(0,0,0,0.5);
                color: white;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 10px;
                z-index: 10;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            prevBtn.style.cssText = btnStyle + 'left: 10px;';
            nextBtn.style.cssText = btnStyle + 'right: 10px;';

            carousel.style.position = 'relative';
            carousel.style.overflow = 'hidden';
            carousel.style.height = '200px'; // Set a fixed height
            carousel.appendChild(prevBtn);
            carousel.appendChild(nextBtn);

            // Start auto-play if more than one ad
            if (ads.length > 1) {
                carouselInterval = setInterval(() => moveCarousel(1), 5000);
            }

        }
    } catch (e) {
        console.error("Error loading ads:", e);
    }
}

function moveCarousel(direction) {
    const carouselInner = document.querySelector("#adsCarousel > div");
    if (!carouselInner) return;

    currentIndex = (currentIndex + direction + ads.length) % ads.length;
    carouselInner.style.transform = `translateX(-${currentIndex * 100}%)`;
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
