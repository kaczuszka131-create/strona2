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

// --- Pobieranie danych jednostki ---
async function fetchUnitData() {
    try {
        const [unitsRes, reportsRes] = await Promise.all([
            fetch(`${SERVER_URL}/units`),
            fetch(`${SERVER_URL}/reports`)
        ]);

        const [unitsData, reportsData] = await Promise.all([
            unitsRes.json(),
            reportsRes.json()
        ]);

        const unit = unitsData[unitId];
        if (!unit) {
            console.warn('Nie znaleziono jednostki o podanym ID');
            document.getElementById('unitStatus').innerText = 'Brak danych';
            document.getElementById('assignedReport').innerText = 'Brak';
            if (unitMarker) map.removeLayer(unitMarker);
            if (reportMarker) map.removeLayer(reportMarker);
            return;
        }

        document.getElementById('unitStatus').innerText = unit.status || 'Brak danych';

        // --- Marker jednostki ---
        if (unit.lat && unit.lng) {
            if (unitMarker) map.removeLayer(unitMarker);
            unitMarker = L.marker([unit.lat, unit.lng], { 
                icon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                    iconSize: [32,32]
                })
            }).addTo(map)
              .bindPopup(`Jednostka: ${unit.name}<br>Status: ${unit.status}`)
              .openPopup();
        }

        // --- Szukamy przypisanego zgłoszenia ---
        let report = null;
        if (unit.assignedReportId) {
            report = reportsData.find(r => r.id === unit.assignedReportId);
        }
        if (!report) {
            report = reportsData.find(r => r.assignedUnit === unitId);
        }

        if (report) {
            document.getElementById('assignedReport').innerText = report.id;

            if (reportMarker) map.removeLayer(reportMarker);
            reportMarker = L.marker([report.lat, report.lng], {
                icon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                    iconSize: [32,32]
                })
            }).addTo(map)
              .bindPopup(`
                Zgłoszenie #${report.id}<br>
                Opis: ${report.description}<br>
                Status: ${report.status}<br>
                Kontakt: ${report.contact}
              `)
              .openPopup();

            map.setView([report.lat, report.lng], 14);
        } else {
            document.getElementById('assignedReport').innerText = 'Brak';
            if (reportMarker) map.removeLayer(reportMarker);
        }

    } catch (err) {
        console.error('Błąd pobierania danych jednostki:', err);
    }
}
