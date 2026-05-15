// Configuration
const mapWidth = 2483;
const mapHeight = 2203;

const bounds = [[0, 0], [mapHeight, mapWidth]];

// Initialize Map
const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 2,
    zoomControl: false, // We can add it elsewhere if needed, but Godot didn't have it visible
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

// Load Data
fetch('data.json')
    .then(res => res.json())
    .then(data => {
        locationsData = data;
        renderMap();
        renderSidebar();
    });

// Convert Godot coordinates (Y down) to Leaflet (Y up)
function getLeafletCoords(godotX, godotY) {
    return [mapHeight - godotY, godotX];
}

// Render markers on the map
function renderMap() {
    markersLayer.clearLayers();
    allMarkers = [];

    const showSafe = toggleSafe.checked;
    const showLand = toggleLandmarks.checked;
    const searchTerm = searchInput.value.toLowerCase();

    locationsData.forEach(loc => {
        if (loc.is_safe_house && !showSafe) return;
        if (!loc.is_safe_house && !showLand) return;
        if (searchTerm && !loc.location_name.toLowerCase().includes(searchTerm)) return;

        const coords = getLeafletCoords(loc.position[0], loc.position[1]);

        // Custom icon
        const icon = L.divIcon({
            className: 'custom-marker',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        const marker = L.marker(coords, { icon: icon }).addTo(markersLayer);

        marker.on('click', () => {
            openInfoPanel(loc);
            map.flyTo(coords, 1, { duration: 0.5 });
        });

        allMarkers.push({ data: loc, marker: marker });
    });
}

// Render Sidebar List
function renderSidebar() {
    locationListEl.innerHTML = '';

    const showSafe = toggleSafe.checked;
    const showLand = toggleLandmarks.checked;
    const searchTerm = searchInput.value.toLowerCase();

    locationsData.forEach(loc => {
        if (loc.is_safe_house && !showSafe) return;
        if (!loc.is_safe_house && !showLand) return;
        if (searchTerm && !loc.location_name.toLowerCase().includes(searchTerm)) return;

        const btn = document.createElement('button');
        btn.className = 'location-item';
        btn.innerText = `   ${loc.location_name}`;

        btn.onclick = () => {
            const coords = getLeafletCoords(loc.position[0], loc.position[1]);
            map.flyTo(coords, 1, { duration: 0.5 });
            openInfoPanel(loc);
        };

        locationListEl.appendChild(btn);
    });
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

// Info Panel Logic
function openInfoPanel(loc) {
    infoTitle.innerText = loc.location_name;
    infoCategory.innerText = loc.category || 'Landmark';
    infoDesc.innerText = loc.description || 'No description available.';

    galleryContainer.innerHTML = '';

    if (loc.images && loc.images.length > 0) {
        loc.images.forEach(imgSrc => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.className = 'gallery-image';
            img.onclick = () => openFullscreen(imgSrc);
            galleryContainer.appendChild(img);
        });

        btnPrevImage.style.display = loc.images.length > 1 ? 'block' : 'none';
        btnNextImage.style.display = loc.images.length > 1 ? 'block' : 'none';
    } else {
        btnPrevImage.style.display = 'none';
        btnNextImage.style.display = 'none';
    }

    infoOverlay.classList.remove('hidden');
    infoPanel.classList.remove('hidden');
}

function closeInfoPanel() {
    infoOverlay.classList.add('hidden');
    infoPanel.classList.add('hidden');
}

btnCloseInfo.addEventListener('click', closeInfoPanel);
infoOverlay.addEventListener('click', closeInfoPanel);

// Gallery Navigation
btnPrevImage.addEventListener('click', () => {
    galleryContainer.scrollBy({ left: -700, behavior: 'smooth' });
});

btnNextImage.addEventListener('click', () => {
    galleryContainer.scrollBy({ left: 700, behavior: 'smooth' });
});

// Fullscreen Logic
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
