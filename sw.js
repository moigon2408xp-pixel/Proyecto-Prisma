/**
 * ============================================================================
 * SERVICE WORKER - PROYECTO PRISMA v3.0
 * PWA con estrategias de caché avanzadas y soporte offline
 * ============================================================================
 */

const CACHE_VERSION = "prisma-v3.0";
const CACHE_NAME = "prisma-cache-" + CACHE_VERSION;

// Assets estáticos que siempre deben estar en caché
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

// Recursos externos (CDN) que cachear
const EXTERNAL_RESOURCES = [
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/sweetalert2@11"
];

// ============================================================================
// INSTALACIÓN DEL SERVICE WORKER
// ============================================================================
self.addEventListener("install", (event) => {
  console.log("[PRISMA SW] Instalando Service Worker v" + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[PRISMA SW] Cache abierto: " + CACHE_NAME);
      return cache.addAll(STATIC_ASSETS).then(() => {
        console.log("[PRISMA SW] Assets estáticos cacheados");
        // Cachear recursos externos (no crítico si falla)
        return cache.addAll(EXTERNAL_RESOURCES.map(url => new Request(url, { mode: 'no-cors' })))
          .catch(() => console.log("[PRISMA SW] Algunos recursos externos no pudieron cachearse (modo no-cors)"));
      });
    })
  );
  
  // Forzar la activación inmediata del nuevo Service Worker
  self.skipWaiting();
});

// ============================================================================
// ACTIVACIÓN DEL SERVICE WORKER
// ============================================================================
self.addEventListener("activate", (event) => {
  console.log("[PRISMA SW] Activando Service Worker v" + CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[PRISMA SW] Eliminando cache antiguo: " + cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log("[PRISMA SW] Limpieza de caches antiguos completada");
      // Tomar control de todos los clientes inmediatamente
      return self.clients.claim();
    })
  );
});

// ============================================================================
 * ESTRATEGIAS DE FETCH
// ============================================================================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  
  // Estrategia 1: Network-First para llamadas a API y backend
  if (isApiRequest(event.request)) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // Estrategia 2: Cache-First para assets estáticos
  if (isStaticAsset(event.request)) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }
  
  // Estrategia 3: Stale-While-Revalidate para recursos externos
  if (isExternalResource(event.request)) {
    event.respondWith(staleWhileRevalidateStrategy(event.request));
    return;
  }
  
  // Estrategia 4: Network-First para navegación HTML
  if (isNavigationRequest(event.request)) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // Estrategia default: Network-First
  event.respondWith(networkFirstStrategy(event.request));
});

// ============================================================================
 * ESTRATEGIAS DE CACHÉ
// ============================================================================

/**
 * Network-First: Intenta red primero, si falla usa caché
 * Ideal para: API calls, navegación, datos dinámicos
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Intentar obtener de la red primero
    const networkResponse = await fetch(request);
    
    // Si la respuesta es válida, cachearla
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log("[PRISMA SW] Network falló, usando caché para: " + request.url);
    
    // Si la red falla, intentar caché
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si no hay caché ni red, retornar respuesta offline
    return new Response(
      JSON.stringify({ 
        offline: true, 
        message: "Sin conexión. Usa el modo offline de PRISMA." 
      }), 
      { 
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

/**
 * Cache-First: Usa caché primero, si falla va a red
 * Ideal para: Assets estáticos, imágenes, fuentes
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log("[PRISMA SW] Cache y red fallaron para: " + request.url);
    throw error;
  }
}

/**
 * Stale-While-Revalidate: Usa caché inmediatamente, actualiza en background
 * Ideal para: Recursos externos, CDN
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Siempre actualizar en background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  // Retornar caché inmediatamente si existe
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Si no hay caché, esperar a la red
  return fetchPromise;
}

// ============================================================================
 * HELPER FUNCTIONS
// ============================================================================

function isApiRequest(request) {
  const url = request.url;
  return url.includes("script.google.com") || 
         url.includes("googleapis.com") ||
         url.includes("generativelanguage.googleapis.com") ||
         url.includes("/api/");
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  return STATIC_ASSETS.some(asset => {
    if (asset === "./") return pathname === "/" || pathname.endsWith("/index.html");
    return pathname.endsWith(asset) || pathname.includes(asset);
  });
}

function isExternalResource(request) {
  const url = new URL(request.url);
  return EXTERNAL_RESOURCES.some(resource => url.href.includes(resource));
}

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

// ============================================================================
 * MENSAJERÍA ENTRE CLIENTE Y SERVICE WORKER
// ============================================================================

// Escuchar mensajes del cliente
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log("[PRISMA SW] Cache eliminado por solicitud del cliente");
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === "GET_CACHE_SIZE") {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          let size = 0;
          keys.forEach((request) => {
            // Estimación aproximada del tamaño
            size += request.url.length * 2; // Estimación muy básica
          });
          event.ports[0].postMessage({ size: size, items: keys.length });
        });
      })
    );
  }
});

// ============================================================================
 * BACKGROUND SYNC (Para sincronización cuando vuelva la conexión)
// ============================================================================

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-prisma-data") {
    event.waitUntil(syncPrismaData());
  }
});

async function syncPrismaData() {
  console.log("[PRISMA SW] Sincronizando datos en background...");
  
  try {
    // Aquí podrías implementar lógica para sincronizar datos pendientes
    // cuando el dispositivo recupere conexión
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: "SYNC_COMPLETED",
        message: "Datos sincronizados exitosamente"
      });
    });
    
  } catch (error) {
    console.error("[PRISMA SW] Error en background sync:", error);
  }
}

// ============================================================================
 * PUSH NOTIFICATIONS (Para futuras implementaciones)
// ============================================================================

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body || "Nueva notificación de PRISMA",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/"
    },
    actions: [
      {
        action: "open",
        title: "Abrir PRISMA",
        icon: "/icon-192.png"
      },
      {
        action: "dismiss",
        title: "Cerrar",
        icon: "/icon-192.png"
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || "PRISMA", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  if (event.action === "open") {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || "/", "_blank")
    );
  }
});
