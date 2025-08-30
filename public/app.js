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
// -------------------------
// Ads carousel - Fixed version
// -------------------------
let adsImages = [],
    currentAd = 0;

async function loadAds() {
    try {
        const res = await fetch('/api/ads');
        const data = await res.json();
        
        console.log("Ads data received:", data);

        if (data.success) {
            adsImages = data.ads;
            const carousel = document.getElementById("adsCarousel");
            carousel.innerHTML = ''; // Clear previous ads

            adsImages.forEach((ad, i) => {
                const img = document.createElement('img');
                img.src = ad.image;
                img.alt = ad.title;
                img.style.opacity = i === 0 ? 1 : 0;
                
                // Store the ad data as a data attribute
                img.dataset.adIndex = i;
                
                carousel.appendChild(img);
            });

            // Add a single event listener to the carousel (event delegation)
            carousel.addEventListener('click', (e) => {
                if (e.target.tagName === 'IMG') {
                    const adIndex = parseInt(e.target.dataset.adIndex);
                    const ad = adsImages[adIndex];
                    console.log(`Clicked on ad: ${ad.title}`);
                    showAd(ad.html, ad.title);
                }
            });

            // Optional: Cycle through ads every 10 seconds
            if (adsImages.length > 1) {
                setInterval(nextAd, 10000);
            }
        }
    } catch (e) {
        console.error("Error loading ads:", e);
    }
}

// Function to cycle ads in the carousel
function nextAd() {
    if (adsImages.length < 2) return;
    const imgs = document.querySelectorAll("#adsCarousel img");
    imgs[currentAd].style.opacity = 0;
    currentAd = (currentAd + 1) % adsImages.length;
    imgs[currentAd].style.opacity = 1;
}

// Function to display the content for the clicked ad
function showAd(html, title) {
    const fullContent = document.getElementById("fullContent");
    
    // Clear previous content before inserting new HTML
    fullContent.innerHTML = '';
    
    // Inject the raw HTML directly into the container
    fullContent.innerHTML = html;
    
    // Show the full-page overlay
    const fullPage = document.getElementById("fullPage");
    if (fullPage) {
        fullPage.style.display = "block";
    }
    
    // Set the page title to the ad's title
    document.title = title || 'Ad - Student Portal';
    
    // Push a history state for browser back
    history.pushState({ page: 'ads', title: title }, '', '#ads');
}


// Close the full-page overlay when the user clicks outside the content
window.onclick = function(event) {
    const fullPage = document.getElementById("fullPage");
    if (event.target === fullPage) {
        closeFullPage();
    }
};

// Close the full-page overlay
function closeFullPage() {
    const fullPage = document.getElementById("fullPage");
    if (fullPage) {
        fullPage.style.display = "none";
    }
    history.back();
}

// Handle browser back button
window.onpopstate = function(event) {
    const overlay = document.getElementById("fullPage");
    if (overlay && overlay.style.display === "block") {
        overlay.style.display = "none";
    }
}; i have problem with ads that shown when click always show html of single ads even i click another ads
