self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('Service Worker aktywowany');
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'NEW_ASSIGNMENT') {
        const reportId = event.data.reportId;
        const options = {
            body: reportId ? `Masz nowe przypisanie zgłoszenia #${reportId}` : 'Przypisanie zgłoszenia zostało usunięte',
            icon: '/icon.png',
            badge: '/badge.png',
            vibrate: [200, 100, 200],
            data: { reportId }
        };
        self.registration.showNotification('Dyspozytor', options);
    }
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});
