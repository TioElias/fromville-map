// Configuration
const mapWidth = 2483;
const mapHeight = 2203;
const bounds = [[0, 0], [mapHeight, mapWidth]];

// Initialize Map
const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 2,
    zoomControl: false, 
    maxBounds: bounds,
    maxBoundsViscosity: 1.0
});

L.imageOverlay('assets/fromville-map-v0-mffcxyyf1u5e1.png', bounds).addTo(map);
map.fitBounds(bounds);
map.setView([mapHeight - 900, 900], 0); // initial view corresponding roughly to Godot start

// Data state
let locationsData = [];
let markersLayer = L.layerGroup().addTo(map);
let allMarkers = [];

// DOM Elements
const locationListEl = document.getElementById('location-list');
const searchInput = document.getElementById('search-bar');
const toggleSafe = document.getElementById('toggle-safe-houses');
const toggleLandmarks = document.getElementById('toggle-landmarks');
const toggleNightMode = document.getElementById('toggle-night-mode');
const app = document.getElementById('app');

const sidebar = document.getElementById('sidebar');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

const infoOverlay = document.getElementById('info-overlay');
const infoPanel = document.getElementById('info-panel');
const infoTitle = document.getElementById('info-title');
const infoCategory = document.getElementById('info-category');
const infoDesc = document.getElementById('info-desc');
const galleryContainer = document.getElementById('gallery-container');
const btnPrevImage = document.getElementById('btn-prev-image');
const btnNextImage = document.getElementById('btn-next-image');
const btnCloseInfo = document.getElementById('btn-close-info');

const fullscreenOverlay = document.getElementById('fullscreen-overlay');
const fullscreenImage = document.getElementById('fullscreen-image');
const btnCloseFullscreen = document.getElementById('btn-close-fullscreen');

// Initialize Lifecycle
function init(data) {
    locationsData = data;
    renderMap();
    renderSidebar();
    updateCategoryCounts();
}

// Load Data with Local CORS Fallback
fetch('data.json')
    .then(res => {
        if (!res.ok) throw new Error("CORS limit/local load");
        return res.json();
    })
    .then(data => {
        console.log("Loaded data.json dynamically.");
        init(data);
    })
    .catch(err => {
        console.warn("Local double-click or CORS block detected. Loading fallback data...", err);
        if (typeof FALLBACK_DATA !== 'undefined') {
            init(FALLBACK_DATA);
        } else {
            console.error("Critical: Fallback data not loaded.");
        }
    });

// Convert Godot coordinates (Y down) to Leaflet (Y up)
function getLeafletCoords(godotX, godotY) {
    return [mapHeight - godotY, godotX];
}

// Calculate marker size based on zoom level
function getMarkerSize() {
    const zoom = map.getZoom();
    // Base size of 22px at zoom 0, scaling exponentially with zoom
    return 22 * Math.pow(2, zoom);
}

// Spawn visual custom marker icon
function createCustomMarkerIcon(loc, size) {
    // Generate distinct marker label matching the locations index
    let label = loc.location_name.match(/^\d+/)?.[0] || '';
    if (!label) {
        if (loc.id === 'AbbysGrave') label = '✝';
        else if (loc.id === 'TalismanTome') label = '🛡️';
        else if (loc.id === 'BottleTree' || loc.id === 'FarwayBottleTree') label = '🍾';
        else if (loc.id === 'CaveEntry') label = '🕳️';
        else if (loc.id === 'Dungeon') label = '🏰';
        else if (loc.id === 'LogCabins') label = '🛖';
        else if (loc.id === 'StoneCircle') label = '🔴';
        else label = '📍';
    }

    return L.divIcon({
        className: 'custom-marker-container',
        html: `<div class="custom-marker ${loc.is_safe_house ? 'safe-house-marker' : 'landmark-marker'}" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                 <span>${label}</span>
               </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
}

// Render markers on the map
function renderMap() {
    markersLayer.clearLayers();
    allMarkers = [];

    const showSafe = toggleSafe.checked;
    const showLand = toggleLandmarks.checked;
    const searchTerm = searchInput.value.toLowerCase();
    const size = getMarkerSize();

    locationsData.forEach(loc => {
        if (loc.is_safe_house && !showSafe) return;
        if (!loc.is_safe_house && !showLand) return;
        
        // Search matches name OR description content
        const matchesSearch = !searchTerm || 
            loc.location_name.toLowerCase().includes(searchTerm) || 
            (loc.description && loc.description.toLowerCase().includes(searchTerm));
        if (!matchesSearch) return;

        const coords = getLeafletCoords(loc.position[0], loc.position[1]);

        // Custom div-based icon with premium styling
        const icon = createCustomMarkerIcon(loc, size);
        const marker = L.marker(coords, { icon: icon }).addTo(markersLayer);

        // Immersive Tooltip hover binding
        const tooltipContent = `
            <div class="custom-tooltip-title">${loc.location_name}</div>
            <div class="custom-tooltip-category">${loc.is_safe_house ? '🏡 SAFE HOUSE' : '🌲 LANDMARK'}</div>
        `;
        marker.bindTooltip(tooltipContent, {
            className: 'leaflet-tooltip-dark',
            direction: 'top',
            offset: [0, -size / 2],
            opacity: 0.95
        });

        marker.on('click', () => {
            openInfoPanel(loc);
            map.flyTo(coords, 1, { duration: 0.6 });
        });

        allMarkers.push({ data: loc, marker: marker });
    });
}

// Update marker sizes dynamically on zoom
map.on('zoomend', () => {
    const size = getMarkerSize();
    allMarkers.forEach(item => {
        const icon = createCustomMarkerIcon(item.data, size);
        item.marker.setIcon(icon);
    });
});

// Render Sidebar List
function renderSidebar() {
    locationListEl.innerHTML = '';

    const showSafe = toggleSafe.checked;
    const showLand = toggleLandmarks.checked;
    const searchTerm = searchInput.value.toLowerCase();

    locationsData.forEach(loc => {
        if (loc.is_safe_house && !showSafe) return;
        if (!loc.is_safe_house && !showLand) return;
        
        const matchesSearch = !searchTerm || 
            loc.location_name.toLowerCase().includes(searchTerm) || 
            (loc.description && loc.description.toLowerCase().includes(searchTerm));
        if (!matchesSearch) return;

        const btn = document.createElement('button');
        btn.className = 'location-item';
        
        // Highlight active item
        if (infoPanel && !infoPanel.classList.contains('hidden') && infoTitle.innerText === loc.location_name) {
            btn.classList.add('active');
        }

        // Inner HTML with beautiful lore categories
        btn.innerHTML = `
            <span>${loc.location_name}</span>
            <span class="sidebar-item-meta ${loc.is_safe_house ? 'safe' : 'landmark'}">
                ${loc.is_safe_house ? 'Safe' : 'Lndmrk'}
            </span>
        `;

        btn.onclick = () => {
            const coords = getLeafletCoords(loc.position[0], loc.position[1]);
            map.flyTo(coords, 1, { duration: 0.6 });
            openInfoPanel(loc);
            
            // Set active state on sidebar item
            document.querySelectorAll('.location-item').forEach(item => item.classList.remove('active'));
            btn.classList.add('active');

            // Close sidebar on mobile
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.remove('open');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('active');
                }
            }
        };

        locationListEl.appendChild(btn);
    });
}

// Update badges count in sidebar
function updateCategoryCounts() {
    const safeCount = locationsData.filter(loc => loc.is_safe_house).length;
    const landmarkCount = locationsData.filter(loc => !loc.is_safe_house).length;
    
    const countSafeEl = document.getElementById('count-safe-houses');
    const countLandEl = document.getElementById('count-landmarks');
    
    if (countSafeEl) countSafeEl.innerText = safeCount;
    if (countLandEl) countLandEl.innerText = landmarkCount;
}

// Event Listeners for Filters
searchInput.addEventListener('input', () => {
    renderMap();
    renderSidebar();
});

toggleSafe.addEventListener('change', () => {
    renderMap();
    renderSidebar();
});

toggleLandmarks.addEventListener('change', () => {
    renderMap();
    renderSidebar();
});

document.getElementById('btn-show-all').addEventListener('click', () => {
    toggleSafe.checked = true;
    toggleLandmarks.checked = true;
    renderMap();
    renderSidebar();
});

document.getElementById('btn-hide-all').addEventListener('click', () => {
    toggleSafe.checked = false;
    toggleLandmarks.checked = false;
    renderMap();
    renderSidebar();
});

// --- Talisman Night Shield Mode ---
toggleNightMode.addEventListener('change', () => {
    if (toggleNightMode.checked) {
        app.classList.add('night-mode');
        spawnMonsterEyes();
    } else {
        app.classList.remove('night-mode');
        removeMonsterEyes();
    }
    renderMap();
    
    // Update active modal status badge if open
    if (!infoPanel.classList.contains('hidden')) {
        const activeName = infoTitle.innerText;
        const activeLoc = locationsData.find(loc => loc.location_name === activeName);
        if (activeLoc) {
            updateModalStatusBadge(activeLoc);
        }
    }
});

function spawnMonsterEyes() {
    removeMonsterEyes();
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;
    
    for (let i = 1; i <= 5; i++) {
        const eyes = document.createElement('div');
        eyes.className = `monster-eyes eyes-${i}`;
        mapContainer.appendChild(eyes);
    }
}

function removeMonsterEyes() {
    document.querySelectorAll('.monster-eyes').forEach(el => el.remove());
}

// Update protective talisman badges inside details modal
function updateModalStatusBadge(loc) {
    const badgeEl = document.getElementById('info-status-badge');
    if (!badgeEl) return;
    
    const isNight = toggleNightMode.checked;
    if (loc.is_safe_house) {
        badgeEl.className = 'talisman-shield-badge';
        badgeEl.innerHTML = '🛡️ TALISMAN SHIELD ACTIVE';
    } else {
        badgeEl.className = `talisman-shield-badge ${isNight ? 'danger' : 'danger'}`;
        badgeEl.innerHTML = isNight ? '⚠️ LOOMING DANGER (UNSAFE)' : '🌲 UNPROTECTED REGION';
    }
}

// --- Info Panel Modal Logic ---
let panelImages = [];
let currentImageIndex = 0;

function openInfoPanel(loc) {
    infoTitle.innerText = loc.location_name;
    infoCategory.innerText = loc.category || 'Landmark';
    
    // Runic style description parsing
    let descHtml = '';
    const rawDesc = loc.description || 'No description available.';
    rawDesc.split('\n\n').forEach(paragraph => {
        const line = paragraph.trim();
        if (line.startsWith('Overview') || line.startsWith('Key Features') || line.startsWith('Notable Lore') || line.startsWith('Recent Events') || line.startsWith('Background')) {
            descHtml += `<h3 class="description-heading">${line}</h3>`;
        } else {
            descHtml += `<p>${line.replace(/\n/g, '<br>')}</p>`;
        }
    });
    infoDesc.innerHTML = descHtml;

    updateModalStatusBadge(loc);

    galleryContainer.innerHTML = '';
    panelImages = loc.images || [];
    currentImageIndex = 0;

    if (panelImages.length > 0) {
        panelImages.forEach(imgSrc => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.className = 'gallery-image';
            img.onclick = () => openFullscreen(imgSrc);
            galleryContainer.appendChild(img);
        });

        btnPrevImage.style.display = panelImages.length > 1 ? 'flex' : 'none';
        btnNextImage.style.display = panelImages.length > 1 ? 'flex' : 'none';
        updateGalleryCounter();
    } else {
        // Fallback placeholder map image
        btnPrevImage.style.display = 'none';
        btnNextImage.style.display = 'none';
        
        const img = document.createElement('img');
        img.src = 'assets/fromville-map-v0-mffcxyyf1u5e1.png';
        img.className = 'gallery-image';
        img.onclick = () => openFullscreen(img.src);
        galleryContainer.appendChild(img);
        
        const counterEl = document.getElementById('gallery-counter');
        if (counterEl) counterEl.innerText = 'Map View';
    }

    infoOverlay.classList.remove('hidden');
    infoPanel.classList.remove('hidden');
    
    // Sync active sidebar item state
    renderSidebar();
}

function updateGalleryCounter() {
    const counterEl = document.getElementById('gallery-counter');
    if (counterEl) {
        counterEl.innerText = `${currentImageIndex + 1} / ${panelImages.length}`;
    }
}

function slideGallery(direction) {
    if (panelImages.length <= 1) return;
    
    if (direction === 'next') {
        currentImageIndex = (currentImageIndex + 1) % panelImages.length;
    } else {
        currentImageIndex = (currentImageIndex - 1 + panelImages.length) % panelImages.length;
    }
    
    const width = galleryContainer.clientWidth;
    galleryContainer.scrollTo({
        left: currentImageIndex * width,
        behavior: 'smooth'
    });
    
    updateGalleryCounter();
}

btnPrevImage.addEventListener('click', () => slideGallery('prev'));
btnNextImage.addEventListener('click', () => slideGallery('next'));

function closeInfoPanel() {
    infoOverlay.classList.add('hidden');
    infoPanel.classList.add('hidden');
    document.querySelectorAll('.location-item').forEach(item => item.classList.remove('active'));
}

btnCloseInfo.addEventListener('click', closeInfoPanel);
infoOverlay.addEventListener('click', closeInfoPanel);

// --- Fullscreen Logic ---
function openFullscreen(src) {
    fullscreenImage.src = src;
    fullscreenOverlay.classList.remove('hidden');
}

function closeFullscreen() {
    fullscreenOverlay.classList.add('hidden');
}

btnCloseFullscreen.addEventListener('click', closeFullscreen);
fullscreenOverlay.addEventListener('click', (e) => {
    if (e.target === fullscreenOverlay) {
        closeFullscreen();
    }
});

// --- Atmospheric Audio Controls Logic ---
const bgAudio = document.getElementById('bg-audio');
const btnMute = document.getElementById('btn-mute');
const volumeSlider = document.getElementById('volume-slider');
const btnPrevSong = document.getElementById('btn-prev-song');
const btnNextSong = document.getElementById('btn-next-song');
const nowPlayingEl = document.getElementById('now-playing');

// Immersive tracks list
const playlist = [
    { src: 'assets/Song/FROM SONG.mp3', title: "Que Sera, Sera (FROM Theme)" },
    { src: 'assets/Song/FROM SONG 2.mp3', title: "The Woods Are Waiting (FROM OST)" }
];
let currentSongIndex = 0;

// Set initial volume
bgAudio.volume = volumeSlider.value;
if (nowPlayingEl) {
    nowPlayingEl.innerText = `NOW PLAYING: ${playlist[0].title}`;
}

// Load and play a specific song by index
function loadAndPlaySong(index) {
    currentSongIndex = index;
    const track = playlist[currentSongIndex];
    bgAudio.src = track.src;
    bgAudio.load();
    
    if (nowPlayingEl) {
        nowPlayingEl.innerText = `NOW PLAYING: ${track.title}`;
    }
    
    bgAudio.play().then(() => {
        if (bgAudio.muted) {
            bgAudio.muted = false;
            btnMute.innerText = '🔊';
        }
    }).catch(err => {
        console.log("Autoplay blocked, waiting for interaction:", err);
    });
}

function nextSong() {
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= playlist.length) {
        nextIndex = 0;
    }
    loadAndPlaySong(nextIndex);
}

function prevSong() {
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) {
        prevIndex = playlist.length - 1;
    }
    loadAndPlaySong(prevIndex);
}

// Event Listeners for Playlist controls
btnNextSong.addEventListener('click', (e) => {
    e.stopPropagation();
    nextSong();
});

btnPrevSong.addEventListener('click', (e) => {
    e.stopPropagation();
    prevSong();
});

bgAudio.addEventListener('ended', nextSong);

// Fallback: Attempt to play audio on first user interaction
const playOnInteraction = () => {
    if (bgAudio.paused) {
        bgAudio.play().then(() => {
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('keydown', playOnInteraction);
        }).catch((err) => {
            console.log("Play failed on interaction:", err);
        });
    } else {
        document.removeEventListener('click', playOnInteraction);
        document.removeEventListener('keydown', playOnInteraction);
    }
};

document.addEventListener('click', playOnInteraction);
document.addEventListener('keydown', playOnInteraction);

// Mute button logic
btnMute.addEventListener('click', (e) => {
    e.stopPropagation();
    bgAudio.muted = !bgAudio.muted;
    btnMute.innerText = bgAudio.muted ? '🔇' : '🔊';
});

// Volume slider logic
volumeSlider.addEventListener('input', (e) => {
    bgAudio.volume = e.target.value;
    if (bgAudio.muted && e.target.value > 0) {
        bgAudio.muted = false;
        btnMute.innerText = '🔊';
    }
});

// Toggle Sidebar on mobile
if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle('active');
        }
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });
}
