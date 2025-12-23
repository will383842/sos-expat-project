// Service Worker Mobile First - Version Production Optimisée
const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Configuration mobile-first avec timeouts agressifs
const NETWORK_TIMEOUTS = {
  mobile: 2000,    // 2s pour mobile (connexion lente)
  desktop: 4000,   // 4s pour desktop
  images: 6000,    // 6s pour images (plus de tolérance)
  api: 3000        // 3s pour API
};

// Ressources critiques (path-agnostique pour i18n futur)
// P2 FIX: Added offline.html to pre-cache
const CORE_RESOURCES = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// Configuration des caches avec limites strictes pour mobile
const CACHE_CONFIG = {
  static: { maxAge: 7 * 24 * 60 * 60 * 1000, maxEntries: 30 },    // 7 jours, 30 entrées
  dynamic: { maxAge: 24 * 60 * 60 * 1000, maxEntries: 20 },       // 1 jour, 20 entrées  
  images: { maxAge: 3 * 24 * 60 * 60 * 1000, maxEntries: 50 },    // 3 jours, 50 images
  api: { maxAge: 60 * 60 * 1000, maxEntries: 15 }                 // 1 heure, 15 API calls
};

// Détection intelligente du contexte
const isMobile = () => {
  try {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      self.registration?.scope || ''
    );
  } catch {
    return true; // Par défaut mobile pour optimiser
  }
};

// URLs à ignorer complètement (SEO et performance)
const IGNORE_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/webhooks\//,
  /\/__nextjs_original-stack-frame/,
  /\/\.well-known\//,
  /\/sitemap\.xml$/,
  /\/robots\.txt$/,
  /\/favicon\.ico$/,
  /\/_next\/static\/chunks\/pages\/_error/,
  /\/sw\.js$/,
  /chrome-extension:/,
  /moz-extension:/,
  /\.zip$/, // ← exclusion des fichiers ZIP
];

// Installation optimisée avec gestion d'erreurs robuste
self.addEventListener('install', event => {
  console.log(`[SW] Installation v${CACHE_VERSION}`);
  
  event.waitUntil(
    (async () => {
      try {
        // Nettoyage préventif
        await cleanOldCaches();
        
        // Cache des ressources critiques avec retry
        await cacheEssentialResources();
        
        console.log('[SW] ✅ Installation réussie');
        
        // Activation immédiate pour éviter les doubles installations
        return self.skipWaiting();
        
      } catch (error) {
        console.warn('[SW] ⚠️ Installation partielle:', error);
        // Continue l'installation même en cas d'erreur
        return self.skipWaiting();
      }
    })()
  );
});

// Activation avec prise de contrôle immédiate
self.addEventListener('activate', event => {
  console.log('[SW] Activation en cours...');
  
  event.waitUntil(
    (async () => {
      await cleanOldCaches();
      await self.clients.claim();
      
      // Notification aux clients de la nouvelle version
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          version: CACHE_VERSION
        });
      });
      
      console.log('[SW] ✅ Activé et contrôle pris');
    })()
  );
});

// Routeur principal optimisé
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Filtrage précoce pour performance
  if (!shouldHandleRequest(request, url)) {
    return;
  }
  
  event.respondWith(handleRequest(request, url));
});

// Vérification si la requête doit être gérée
function shouldHandleRequest(request, url) {
  // Seulement les requêtes GET
  if (request.method !== 'GET') return false;
  
  // Seulement le même domaine
  if (url.origin !== self.location.origin) return false;
  
  // Ignorer les patterns définis
  if (IGNORE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return false;
  }
  
  // Ignorer les requêtes avec headers spéciaux
  if (request.headers.get('cache-control') === 'no-cache') return false;
  
  return true;
}

// Gestionnaire principal avec stratégies optimisées
async function handleRequest(request, url) {
  try {
    const requestType = getRequestType(request, url);
    
    switch (requestType) {
      case 'html':
        return await handleHTML(request, url);
      case 'static':
        return await handleStatic(request, url);
      case 'image':
        return await handleImage(request, url);
      case 'api':
        return await handleAPI(request, url);
      default:
        return await handleDynamic(request, url);
    }
  } catch (error) {
    console.warn(`[SW] Erreur ${url.pathname}:`, error);
    return createOfflineResponse(request, url);
  }
}

// Classification intelligente des requêtes
function getRequestType(request, url) {
  const { pathname } = url;
  const { destination } = request;
  
  // HTML/Pages
  if (destination === 'document' || 
      pathname === '/' || 
      pathname.endsWith('.html') ||
      (!pathname.includes('.') && !pathname.startsWith('/api/'))) {
    return 'html';
  }
  
  // Ressources statiques
  if (destination === 'style' || 
      destination === 'script' || 
      destination === 'manifest' ||
      /\.(css|js|json|woff2?|ttf|eot|map)$/i.test(pathname) ||
      pathname.includes('/_next/static/') ||
      pathname.includes('/static/') ||
      pathname.includes('/assets/')) {
    return 'static';
  }
  
  // Images
  if (destination === 'image' || 
      /\.(jpg|jpeg|png|gif|webp|svg|ico|avif)$/i.test(pathname)) {
    return 'image';
  }
  
  // API
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/graphql') ||
      pathname.includes('/ajax/')) {
    return 'api';
  }
  
  return 'dynamic';
}

// Gestion HTML avec Stale-While-Revalidate optimisé
async function handleHTML(request, url) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Mise à jour asynchrone pour UX optimale
  const networkPromise = fetchWithTimeout(request, NETWORK_TIMEOUTS.mobile)
    .then(async response => {
      if (response.ok) {
        // Vérifier si c'est vraiment du HTML avant de cacher
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          await cache.put(request, response.clone());
          await limitCacheSize(STATIC_CACHE, CACHE_CONFIG.static.maxEntries);
        }
      }
      return response;
    })
    .catch(() => null);
  
  // Retourner le cache immédiatement si disponible
  if (cachedResponse && isFresh(cachedResponse, CACHE_CONFIG.static.maxAge)) {
    networkPromise.catch(() => {}); // Mise à jour silencieuse
    return cachedResponse;
  }
  
  // Sinon attendre le réseau (avec fallback cache si échec)
  try {
    const networkResponse = await networkPromise;
    return networkResponse || cachedResponse || createOfflineResponse(request, url);
  } catch {
    return cachedResponse || createOfflineResponse(request, url);
  }
}

// Gestion ressources statiques avec Cache-First
async function handleStatic(request, url) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && isFresh(cachedResponse, CACHE_CONFIG.static.maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUTS.desktop);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(STATIC_CACHE, CACHE_CONFIG.static.maxEntries);
    }
    
    return networkResponse;
  } catch {
    return cachedResponse || createOfflineResponse(request, url);
  }
}

// Gestion images avec compression et placeholders
async function handleImage(request, url) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUTS.images);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(IMAGE_CACHE, CACHE_CONFIG.images.maxEntries);
    }
    
    return networkResponse;
  } catch {
    return createImagePlaceholder(url);
  }
}

// Gestion API avec stratégie Network-First
async function handleAPI(request, url) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUTS.api);
    
    if (networkResponse.ok) {
      // Cacher seulement les GET API success
      if (request.method === 'GET') {
        await cache.put(request, networkResponse.clone());
        await limitCacheSize(API_CACHE, CACHE_CONFIG.api.maxEntries);
      }
    }
    
    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && request.method === 'GET') {
      // Ajouter headers pour indiquer que c'est du cache
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: {
          ...Object.fromEntries(cachedResponse.headers.entries()),
          'X-From-Cache': 'true',
          'X-Cache-Date': cachedResponse.headers.get('date') || 'unknown'
        }
      });
    }
    
    // Réponse d'erreur structurée pour API
    return new Response(JSON.stringify({
      error: 'SERVICE_UNAVAILABLE',
      message: 'Network unavailable',
      offline: true,
      timestamp: new Date().toISOString(),
      requestUrl: url.pathname
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 
        'Content-Type': 'application/json',
        'X-Offline-Response': 'true'
      }
    });
  }
}

// Gestion ressources dynamiques
async function handleDynamic(request, url) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUTS.mobile);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(DYNAMIC_CACHE, CACHE_CONFIG.dynamic.maxEntries);
    }
    
    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    return cachedResponse || createOfflineResponse(request, url);
  }
}

// Cache des ressources essentielles avec retry
async function cacheEssentialResources() {
  const cache = await caches.open(STATIC_CACHE);
  const cachePromises = [];
  
  for (const url of CORE_RESOURCES) {
    cachePromises.push(
      (async () => {
        try {
          const response = await fetchWithTimeout(url, NETWORK_TIMEOUTS.mobile);
          if (response.ok) {
            await cache.put(url, response);
            console.log(`[SW] ✅ Cached: ${url}`);
          }
        } catch (error) {
          console.log(`[SW] ⚠️ Failed to cache: ${url} (${error.message})`);
        }
      })()
    );
  }
  
  await Promise.allSettled(cachePromises);
}

// Vérification de fraîcheur du cache
function isFresh(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseDate = new Date(dateHeader);
  const now = new Date();
  
  return (now - responseDate) < maxAge;
}

// Fetch avec timeout adaptatif
function fetchWithTimeout(request, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(request, { signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

// Limitation taille cache avec LRU
async function limitCacheSize(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  
  if (requests.length <= maxEntries) return;
  
  // Trier par date d'accès (LRU approximatif via URL)
  const requestsToDelete = requests
    .slice(0, requests.length - maxEntries);
  
  await Promise.all(
    requestsToDelete.map(request => cache.delete(request))
  );
}

// Nettoyage des anciens caches
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = new Set([STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE]);
  
  const deletePromises = cacheNames
    .filter(cacheName => !currentCaches.has(cacheName))
    .map(cacheName => {
      console.log(`[SW] 🗑️ Deleting old cache: ${cacheName}`);
      return caches.delete(cacheName);
    });
  
  await Promise.all(deletePromises);
}

// Réponse offline universelle et accessible
function createOfflineResponse(request, url) {
  const { pathname } = url;
  
  // Page HTML offline
  if (getRequestType(request, url) === 'html') {
    return new Response(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Hors ligne</title>
  <meta name="robots" content="noindex">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;color:#333}
    .container{background:#fff;padding:2rem;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.1);text-align:center;max-width:400px;width:100%}
    .icon{font-size:3rem;margin-bottom:1rem;opacity:.8}
    h1{margin-bottom:1rem;font-size:1.5rem;font-weight:600}
    p{color:#666;line-height:1.6;margin-bottom:2rem}
    .btn{background:#667eea;color:#fff;border:none;padding:12px 24px;border-radius:6px;cursor:pointer;font-size:16px;margin:.5rem;transition:background .2s}
    .btn:hover{background:#5a6fd8}
    .btn:focus{outline:2px solid #667eea;outline-offset:2px}
    .btn--secondary{background:#6c757d}
    .btn--secondary:hover{background:#545b62}
    .status{background:#f8f9fa;padding:1rem;border-radius:6px;margin-top:1rem;font-size:.85rem;color:#6c757d}
    @media(max-width:480px){.container{padding:1.5rem}.icon{font-size:2.5rem}h1{font-size:1.3rem}}
  </style>
</head>
<body>
  <div class="container">
    <div class="icon" role="img" aria-label="Mode hors ligne">📱</div>
    <h1>Mode hors ligne</h1>
    <p>Cette page n'est pas disponible sans connexion Internet. Veuillez vérifier votre connexion.</p>
    
    <button class="btn" onclick="location.reload()" aria-label="Recharger la page">
      🔄 Réessayer
    </button>
    
    <button class="btn btn--secondary" onclick="goHome()" aria-label="Retour accueil">
      🏠 Accueil
    </button>
    
    <div class="status">
      <strong>Status:</strong> Service Worker v${CACHE_VERSION} actif
    </div>
  </div>
  
  <script>
    function goHome(){location.href='/'}
    
    // Auto-retry quand connexion revient
    let retryInterval;
    function checkConnection(){
      if(navigator.onLine){
        clearInterval(retryInterval);
        location.reload()
      }
    }
    
    window.addEventListener('online',checkConnection);
    retryInterval=setInterval(checkConnection,5000);
    
    // Preload accueil
    if('requestIdleCallback' in window){
      requestIdleCallback(()=>{
        const link=document.createElement('link');
        link.rel='prefetch';
        link.href='/';
        document.head.appendChild(link)
      })
    }
  </script>
</body>
</html>`, {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // CSS minimal
  if (pathname.endsWith('.css')) {
    return new Response(`
/* Offline CSS */
body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;margin:0;padding:1rem;background:#f8f9fa}
.offline-notice{background:#fff3cd;border-left:4px solid #ffc107;color:#856404;padding:1rem;margin:1rem 0;border-radius:4px}
.container{max-width:1200px;margin:0 auto}
.btn{display:inline-block;padding:.5rem 1rem;background:#007bff;color:#fff;text-decoration:none;border-radius:4px;border:none;cursor:pointer}
.btn:hover{background:#0056b3}
    `.trim(), { 
      headers: { 'Content-Type': 'text/css' }
    });
  }
  
  // JavaScript minimal
  if (pathname.endsWith('.js')) {
    return new Response(`
console.log('SW: Offline JS loaded');
document.addEventListener('DOMContentLoaded',function(){
  if(document.querySelector('.offline-notice'))return;
  const notice=document.createElement('div');
  notice.className='offline-notice';
  notice.innerHTML='📱 <strong>Mode hors ligne</strong> - Fonctionnalités limitées';
  document.body.insertBefore(notice,document.body.firstChild)
});
window.addEventListener('online',()=>location.reload());
    `.trim(), { 
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
  
  return new Response('Ressource non disponible hors ligne', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

// Placeholder image optimisé et accessible
function createImagePlaceholder(url) {
  const filename = url.pathname.split('/').pop() || 'image';
  const dimensions = extractImageDimensions(url.pathname);
  
  return new Response(`
<svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Image non disponible: ${filename}">
  <rect width="100%" height="100%" fill="#f8f9fa"/>
  <rect x="10%" y="10%" width="80%" height="60%" fill="#e9ecef" rx="4"/>
  <circle cx="30%" cy="35%" r="8%" fill="#dee2e6"/>
  <polygon points="25%,50% 35%,40% 45%,50% 40%,55% 30%,55%" fill="#dee2e6"/>
  <text x="50%" y="80%" text-anchor="middle" fill="#6c757d" font-family="system-ui,sans-serif" font-size="12">
    📷 ${filename}
  </text>
  <text x="50%" y="95%" text-anchor="middle" fill="#adb5bd" font-family="system-ui,sans-serif" font-size="10">
    Indisponible hors ligne
  </text>
</svg>
  `.trim(), {
    headers: { 
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300'
    }
  });
}

// Extraction dimensions depuis URL (pour images responsive)
function extractImageDimensions(pathname) {
  const match = pathname.match(/(\d+)x(\d+)/);
  if (match) {
    return { width: Math.min(parseInt(match[1]), 800), height: Math.min(parseInt(match[2]), 600) };
  }
  return { width: 300, height: 200 };
}

// Communication avec l'application
self.addEventListener('message', event => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ 
        version: CACHE_VERSION,
        mobile: isMobile()
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0]?.postMessage({ success: true });
      }).catch(error => {
        event.ports[0]?.postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0]?.postMessage(status);
      });
      break;
      
    case 'PREFETCH_URLS':
      if (Array.isArray(payload?.urls)) {
        prefetchUrls(payload.urls).then(results => {
          event.ports[0]?.postMessage({ prefetched: results });
        });
      }
      break;
  }
});

// Préchargement intelligent d'URLs
async function prefetchUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const results = [];
  
  for (const url of urls.slice(0, 5)) { // Limite pour éviter surcharge
    try {
      const response = await fetchWithTimeout(url, NETWORK_TIMEOUTS.mobile);
      if (response.ok) {
        await cache.put(url, response);
        results.push({ url, success: true });
      }
    } catch (error) {
      results.push({ url, success: false, error: error.message });
    }
  }
  
  return results;
}

// Nettoyage complet des caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] 🧹 Tous les caches supprimés');
}

// Status détaillé des caches
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const caches_detail = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    caches_detail[name] = {
      entries: keys.length,
      urls: keys.slice(0, 5).map(req => req.url) // Sample des URLs
    };
  }
  
  return {
    version: CACHE_VERSION,
    mobile: isMobile(),
    caches: caches_detail,
    totalEntries: Object.values(caches_detail).reduce((sum, cache) => sum + cache.entries, 0),
    timestamp: new Date().toISOString()
  };
}

// ============================================
// P1 FIX: Push Notification Event Handler
// ============================================
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');

  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: 'SOS Expat', body: event.data?.text() || 'Nouvelle notification' };
  }

  const title = data.title || data.notification?.title || 'SOS Expat';
  const options = {
    body: data.body || data.notification?.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'sos-push',
    data: data.data || data,
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'dismiss', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle push notification click
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Focus existing window if available
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Otherwise open new window
        return clients.openWindow(urlToOpen);
      })
  );
});

// ============================================
// P1 FIX: Background Sync Event Handler
// ============================================
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  } else if (event.tag === 'sync-notifications') {
    event.waitUntil(syncPendingNotifications());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages());
  }
});

// Sync pending API requests from IndexedDB queue
async function syncPendingRequests() {
  console.log('[SW] Syncing pending requests...');

  try {
    // Open IndexedDB to get pending requests
    const db = await openSyncDB();
    const tx = db.transaction('pending-requests', 'readwrite');
    const store = tx.objectStore('pending-requests');
    const requests = await store.getAll();

    for (const req of requests) {
      try {
        const response = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body
        });

        if (response.ok) {
          await store.delete(req.id);
          console.log('[SW] Synced request:', req.url);
        }
      } catch (error) {
        console.warn('[SW] Failed to sync request:', req.url, error);
      }
    }

    await tx.done;
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Placeholder for notification sync
async function syncPendingNotifications() {
  console.log('[SW] Syncing pending notifications...');
  // Implementation depends on your notification queue system
}

// Placeholder for message sync
async function syncPendingMessages() {
  console.log('[SW] Syncing pending messages...');
  // Implementation depends on your messaging system
}

// Helper to open IndexedDB for sync
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sos-sync-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-requests')) {
        db.createObjectStore('pending-requests', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}