importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase Configuration (same as your script.js)
const firebaseConfig = {
    apiKey: "AIzaSyAgzlL-gFdky4ZfXdkJlvT8vuTQbuE0iuE",
    authDomain: "snowzen-ef591.firebaseapp.com",
    projectId: "snowzen-ef591",
    storageBucket: "snowzen-ef591.firebasestorage.app",
    messagingSenderId: "17525600938",
    appId: "1:17525600938:web:4e61cffcc998c16f6d56d3",
    measurementId: "G-M5QPPRHDM1"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

/* ═══════════════════════════════════════════════════════════════════
   OFFLINE CACHING (PWA)
═══════════════════════════════════════════════════════════════════ */
const CACHE_NAME = 'snowzen-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './logo.png',
    'https://cdn-icons-png.flaticon.com/512/2991/2991148.png',
    'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    'https://cdn-icons-png.flaticon.com/512/8943/8943377.png'
];

// Install event: Cache all essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate event: Clean up old caches if the version name changes
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event: Serve from cache first, fall back to network
self.addEventListener('fetch', (event) => {
    // Let Firebase handle its own API database/auth requests over the network
    if (event.request.url.includes('googleapis.com') || event.request.url.includes('firebaseio.com')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});