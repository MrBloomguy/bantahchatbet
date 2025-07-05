// Service Worker for Push Notifications

// Cache name for offline support
const CACHE_NAME = 'bantahchatbet-cache-v1';

// Skip service worker interception for these domains
const SKIP_DOMAINS = [
  'privy.io',
  'auth.privy.io',
  'api.privy.io',
  'embedded-wallet.privy.io',
  'walletconnect.org',
  'walletconnect.com',
  'i.ibb.co',
  'ibb.co'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/bantahblue.svg'
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim());
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Early exit for /chatroom requests: do not run any service worker logic
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/chatroom')) {
    // Do not intercept, cache, or handle anything for /chatroom
    return;
  }

  // Skip service worker for certain domains
  if (SKIP_DOMAINS.some(domain => event.request.url.includes(domain))) {
    console.log('Skipping service worker interception for:', event.request.url);
    return;
  }

  // For all other requests, try to serve from cache first
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      
      // Clone the request because it can only be used once
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response because it can only be used once
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(error => {
        console.error('Fetch failed:', error);
        // You might want to return a custom offline page or fallback content here
      });
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {};

  try {
    notificationData = event.data.json();
  } catch (e) {
    console.error('Error parsing push notification data:', e);
    notificationData = {
      title: 'New Notification',
      body: 'You have a new notification',
      icon: '/bantahblue.svg',
      badge: '/notification-badge.png',
      data: {
        url: '/notifications'
      }
    };
  }

  const title = notificationData.title || 'New Notification';
  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/bantahblue.svg',
    badge: notificationData.badge || '/notification-badge.png',
    data: notificationData.data || {},
    vibrate: [100, 50, 100],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const notificationData = event.notification.data;

  if (notificationData && notificationData.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === notificationData.url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(notificationData.url);
        }
      })
    );
  }
});
