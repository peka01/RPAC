// PWA Cache Clearing Utility
// This script helps clear PWA cache to force icon updates

if ('serviceWorker' in navigator) {
  // Clear all caches
  caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cacheName) => {
        console.log('Clearing cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(() => {
    console.log('All caches cleared');
    
    // Unregister current service worker
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('Service worker unregistered');
      });
    });
    
    // Reload the page to re-register service worker
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  });
} else {
  console.log('Service Worker not supported');
}

// Alternative: Force reload with cache bypass
function forceReload() {
  window.location.reload(true);
}

// Export for use in console
window.clearPWACache = function() {
  if ('serviceWorker' in navigator) {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
        window.location.reload();
      });
    });
  }
};
