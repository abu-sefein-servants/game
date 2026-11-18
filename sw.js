/* جوّه الحكاية — Service Worker
   الصفحة نفسها: الشبكة الأول (عشان التحديث يوصل فورًا)، والكاش احتياطي لو مفيش نت.
   الباقي: الكاش الأول.
   غيّر رقم CACHE لما تنشر نسخة جديدة. */
var CACHE = "gowwa-v1";
var CORE  = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(CORE.map(function(u){
      return c.add(new Request(u, {cache:"reload"})).catch(function(){});
    }));
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ return k===CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  var r = e.request;
  if(r.method !== "GET") return;
  var url = new URL(r.url);
  if(url.origin !== location.origin) return;        /* Firebase وغيره: عدّي عادي */

  if(r.mode === "navigate"){                        /* الصفحة: الشبكة الأول */
    e.respondWith(
      fetch(r).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put("./index.html", copy); });
        return res;
      }).catch(function(){
        return caches.match("./index.html").then(function(m){ return m || caches.match("./"); });
      })
    );
    return;
  }
  e.respondWith(caches.match(r).then(function(m){    /* الباقي: الكاش الأول */
    return m || fetch(r).then(function(res){
      if(res && res.status===200){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(r, copy); });
      }
      return res;
    });
  }));
});
