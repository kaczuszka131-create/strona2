const SERVER_URL = 'https://dyspo.onrender.com';
let unitId = null;
let map, unitMarker, reportMarker;

// --- Logowanie ---
document.getElementById('loginBtn').addEventListener('click', () => {
    const input = document.getElementById('unitIdInput').value.trim();
    if (!input) return alert('Podaj ID jednostki!');
    unitId = input;

    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('unitScreen').style.display = 'flex';
    document.getElementById('unitName').innerText = unitId;

    initMap();
    fetchUnitData();
    setInterval(fetchUnitData, 5000);
});

// --- Inicjalizacja mapy ---
function initMap() {
    map = L.map('map').setView([52.0, 19.0], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

// --- Obliczanie dystansu ---
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = x => x * Math.PI/180;
    const dLat = toRad(lat2-lat1);
    const dLon = toRad(lng2-lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
}

// --- Pobieranie danych jednostki ---
async function fetchUnitData() {
    try {
        const [unitsRes, reportsRes] = await Promise.all([
            fetch(`${SERVER_URL}/units`),
            fetch(`${SERVER_URL}/reports`)
        ]);

        const [unitsData, reportsData] = await Promise.all([unitsRes.json(), reportsRes.json()]);
        const unit = unitsData[unitId];

        if (!unit) return resetUnitDisplay();

        // --- Status kolorowy ---
        const statusEl = document.getElementById('unitStatus');
        statusEl.innerText = unit.status || 'Brak danych';
        statusEl.className = '';
        if (unit.status === 'Dostępny') statusEl.classList.add('available');
        else if (unit.status === 'Zajęty') statusEl.classList.add('busy');
        else if (unit.status === 'W drodze') statusEl.classList.add('onroute');

        // --- Marker jednostki ---
        if (unit.lat != null && unit.lng != null) {
            const latlng = [unit.lat, unit.lng];
            if (!unitMarker) {
                unitMarker = L.marker(latlng, { icon: L.icon({ iconUrl:'https://cdn-icons-png.flaticon.com/512/149/149071.png', iconSize:[32,32] })})
                              .addTo(map).bindPopup(`Jednostka: ${unit.name}<br>Status: ${unit.status}`);
            } else unitMarker.setLatLng(latlng).setPopupContent(`Jednostka: ${unit.name}<br>Status: ${unit.status}`);
        }

        // --- Szukamy przypisanego zgłoszenia ---
        let report = unit.assignedReportId ? reportsData.find(r => r.id===unit.assignedReportId) 
                                           : reportsData.find(r => r.assignedUnit===unitId);

        if (report && report.lat!=null && report.lng!=null) {
            document.getElementById('assignedReport').innerText = report.id;
            document.getElementById('reportTier').innerText = report.tier || '-';
            document.getElementById('reportContact').innerText = report.contact || '-';
            document.getElementById('reportDesc').innerText = report.description || '-';

            const reportLatLng = [report.lat, report.lng];
            if (!reportMarker) {
                reportMarker = L.marker(reportLatLng, { icon: L.icon({ iconUrl:'https://cdn-icons-png.flaticon.com/512/684/684908.png', iconSize:[32,32] })})
                                .addTo(map)
                                .bindPopup(`Zgłoszenie #${report.id}<br>Opis: ${report.description}<br>Status: ${report.status}<br>Kontakt: ${report.contact}`);
            } else reportMarker.setLatLng(reportLatLng)
                              .setPopupContent(`Zgłoszenie #${report.id}<br>Opis: ${report.description}<br>Status: ${report.status}<br>Kontakt: ${report.contact}`);

            // --- Dystans ---
            const dist = calculateDistance(unit.lat, unit.lng, report.lat, report.lng);
            document.getElementById('distance').innerText = `${dist} m`;

            map.setView(reportLatLng, 14);
        } else resetReportDisplay();

    } catch(err) { console.error('Błąd pobierania danych jednostki:', err); }
}

function resetUnitDisplay() {
    document.getElementById('unitStatus').innerText='Brak danych';
    document.getElementById('assignedReport').innerText='Brak';
    document.getElementById('distance').innerText='0 m';
    document.getElementById('reportTier').innerText='-';
    document.getElementById('reportContact').innerText='-';
    document.getElementById('reportDesc').innerText='-';
    if (unitMarker) unitMarker.remove();
    if (reportMarker) reportMarker.remove();
}

function resetReportDisplay() {
    document.getElementById('assignedReport').innerText='Brak';
    document.getElementById('distance').innerText='0 m';
    document.getElementById('reportTier').innerText='-';
    document.getElementById('reportContact').innerText='-';
    document.getElementById('reportDesc').innerText='-';
    if (reportMarker) reportMarker.remove();
}
