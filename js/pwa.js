/* js/pwa.js */

/* =========================================================
   PWA — MANIFEST (injected as blob URL, single-file PWA)
   Targets the GitHub Pages URL so "Add to Home Screen" works.
   ========================================================= */
function injectManifest() {
  const manifest = {
    name: 'Fretboard Trainer',
    short_name: 'Fretboard',
    description: 'Guitar fretboard note trainer with chromatic tuner',
    start_url: '/fretboard-trainer-and-tuner/',
    scope: '/fretboard-trainer-and-tuner/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0d0d0f',
    theme_color: '#0d0d0f',
    icons: [
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='80' fill='%230d0d0f'/%3E%3Ctext x='256' y='340' font-size='300' text-anchor='middle' font-family='Courier New' fill='%23e8a020'%3EA%3C/text%3E%3C/svg%3E",
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      }
    ]
  };

  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = url;
  document.head.appendChild(link);
}

/* =========================================================
   PWA — SERVICE WORKER REGISTRATION
   Points to sw.js at the repo root on GitHub Pages.
   On first load over network, the SW caches the app shell
   so all subsequent loads work fully offline.
   ========================================================= */
export function initPwa() {
  injectManifest();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(
      '/fretboard-trainer-and-tuner/sw.js',
      { scope: '/fretboard-trainer-and-tuner/' }
    ).then(reg => {
      console.log('SW registered, scope:', reg.scope);
    }).catch(err => {
      /* Registration failure does not break the app */
      console.warn('SW registration failed:', err);
    });
  }
}
