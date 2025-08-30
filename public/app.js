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
