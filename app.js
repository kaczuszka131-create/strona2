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
            if (unitMarker) unitMarker.remove();
            if (reportMarker) reportMarker.remove();
            return;
        }

        document.getElementById('unitStatus').innerText = unit.status || 'Brak danych';

        // --- Marker jednostki ---
        if (unit.lat != null && unit.lng != null) {
            const unitLatLng = [unit.lat, unit.lng];
            if (!unitMarker) {
                unitMarker = L.marker(unitLatLng, { 
                    icon: L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                        iconSize: [32,32]
                    })
                }).addTo(map).bindPopup(`Jednostka: ${unit.name}<br>Status: ${unit.status}`);
            } else {
                unitMarker.setLatLng(unitLatLng).setPopupContent(`Jednostka: ${unit.name}<br>Status: ${unit.status}`);
            }
        }

        // --- Szukamy przypisanego zgłoszenia ---
        let report = null;
        if (unit.assignedReportId) report = reportsData.find(r => r.id === unit.assignedReportId);
        if (!report) report = reportsData.find(r => r.assignedUnit === unitId);

        if (report && report.lat != null && report.lng != null) {
            document.getElementById('assignedReport').innerText = report.id;

            const reportLatLng = [report.lat, report.lng];
            if (!reportMarker) {
                reportMarker = L.marker(reportLatLng, {
                    icon: L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                        iconSize: [32,32]
                    })
                }).addTo(map).bindPopup(`
                    Zgłoszenie #${report.id}<br>
                    Opis: ${report.description}<br>
                    Status: ${report.status}<br>
                    Kontakt: ${report.contact}
                `);
            } else {
                reportMarker.setLatLng(reportLatLng).setPopupContent(`
                    Zgłoszenie #${report.id}<br>
                    Opis: ${report.description}<br>
                    Status: ${report.status}<br>
                    Kontakt: ${report.contact}
                `);
            }

            // Dopasowanie widoku mapy do jednostki i zgłoszenia
            if (unit.lat != null && unit.lng != null) {
                const bounds = L.latLngBounds([ [unit.lat, unit.lng], [report.lat, report.lng] ]);
                map.fitBounds(bounds, { padding: [50, 50] });
            } else {
                map.setView(reportLatLng, 14);
            }

        } else {
            document.getElementById('assignedReport').innerText = 'Brak';
            if (reportMarker) reportMarker.remove();
        }

    } catch (err) {
        console.error('Błąd pobierania danych jednostki:', err);
    }
}
