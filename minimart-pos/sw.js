/* Mini-Mart POS — Service Worker */
var CACHE_NAME = 'minimart-pos-v1';
var ASSETS = ['./', './salepos.html', './index.html'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(ASSETS); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);

  // Supabase API — always fetch from network, no cache
  if (url.hostname.indexOf('supabase.co') !== -1) return;

  e.respondWith(
    caches.match(e.request).then(function(cached){
      if (cached) return cached;
      return fetch(e.request).then(function(res){
        if (res && res.status === 200 && res.type === 'basic'){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request, copy);
          });
        }
        return res;
      }).catch(function(){
        if (e.request.mode === 'navigate'){
          return caches.match('./salepos.html');
        }
      });
    })
  );
});