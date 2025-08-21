let previousAssignedReport = null;

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
                unitMarker = L.circleMarker(latlng, { radius: 10, color: 'blue', fillColor: 'blue', fillOpacity: 0.8 })
                              .addTo(map).bindPopup(`Jednostka: ${unit.name}<br>Status: ${unit.status}`);
            } else unitMarker.setLatLng(latlng).setPopupContent(`Jednostka: ${unit.name}<br>Status: ${unit.status}`);
        }

        // --- Szukamy przypisanego zgłoszenia ---
        let report = unit.assignedReportId ? reportsData.find(r => r.id===unit.assignedReportId) 
                                           : reportsData.find(r => r.assignedUnit===unitId);

        // --- Wibracja przy zmianie przypisania ---
        if (report?.id !== previousAssignedReport) {
            if (navigator.vibrate) {
                navigator.vibrate(200); // wibracja 200ms
            }
            previousAssignedReport = report?.id || null;
        }

        if (report && report.lat != null && report.lng != null) {
            document.getElementById('assignedReport').innerText = report.id;
            document.getElementById('reportTier').innerText = report.tier || '-';
            document.getElementById('reportContact').innerText = report.contact || '-';
            document.getElementById('reportDesc').innerText = report.description || '-';

            const reportLatLng = [report.lat, report.lng];

            // Kolor wg tieru
            let reportColor = 'green';
            if (report.tier === 2) reportColor = 'orange';
            else if (report.tier === 3) reportColor = 'red';

            if (!reportMarker) {
                reportMarker = L.circleMarker(reportLatLng, { radius: 8, color: reportColor, fillColor: reportColor, fillOpacity: 0.8 })
                                 .addTo(map)
                                 .bindPopup(`Zgłoszenie #${report.id}<br>Opis: ${report.description}<br>Status: ${report.status}<br>Kontakt: ${report.contact}`);
            } else {
                reportMarker.setLatLng(reportLatLng)
                            .setStyle({ color: reportColor, fillColor: reportColor })
                            .setPopupContent(`Zgłoszenie #${report.id}<br>Opis: ${report.description}<br>Status: ${report.status}<br>Kontakt: ${report.contact}`);
            }

            // Dystans
            const dist = calculateDistance(unit.lat, unit.lng, report.lat, report.lng);
            document.getElementById('distance').innerText = `${dist} m`;

            map.setView(reportLatLng, 14);
        } else resetReportDisplay();

    } catch(err) { console.error('Błąd pobierania danych jednostki:', err); }
}
