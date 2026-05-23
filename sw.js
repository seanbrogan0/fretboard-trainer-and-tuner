// fretboard-trainer/sw.js

/* =========================================================
   SERVICE WORKER — cache-first strategy for offline use.
   Version the cache name when you deploy a new build so
   old caches are cleaned up on activate.
   ========================================================= */
const CACHE = 'fretboard-v5';

/* Files to pre-cache on install */
const SHELL = [
  '/fretboard-trainer-and-tuner/',
  '/fretboard-trainer-and-tuner/index.html',
  '/fretboard-trainer-and-tuner/css/styles.css',
  '/fretboard-trainer-and-tuner/js/constants.js',
  '/fretboard-trainer-and-tuner/js/state.js',
  '/fretboard-trainer-and-tuner/js/audio.js',
  '/fretboard-trainer-and-tuner/js/pitch.js',
  '/fretboard-trainer-and-tuner/js/metronome.js',
  '/fretboard-trainer-and-tuner/js/notes.js',
  '/fretboard-trainer-and-tuner/js/detection.js',
  '/fretboard-trainer-and-tuner/js/ui.js',
  '/fretboard-trainer-and-tuner/js/stave.js',
  '/fretboard-trainer-and-tuner/js/session.js',
  '/fretboard-trainer-and-tuner/js/tuner.js',
  '/fretboard-trainer-and-tuner/js/stats.js',
  '/fretboard-trainer-and-tuner/js/settings.js',
  '/fretboard-trainer-and-tuner/js/pwa.js',
  '/fretboard-trainer-and-tuner/js/main.js',
  '/fretboard-trainer-and-tuner/js/scale-trainer.js',
  '/fretboard-trainer-and-tuner/js/scale-stats.js',
  '/fretboard-trainer-and-tuner/js/scale-data.js',
  '/fretboard-trainer-and-tuner/js/fretboard-diagram.js'
];

/* Install: cache app shell immediately, skip waiting */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

/* Activate: delete stale caches from previous versions */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* Fetch: serve from cache, update cache from network on miss */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        /* Cache successful responses for future offline use */
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        /* Network failed and nothing in cache — return nothing gracefully */
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
