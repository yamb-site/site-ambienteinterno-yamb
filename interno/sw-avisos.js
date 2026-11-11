// Avisos de postagens do ambiente interno (Web Push). Service worker separado do sw.js do OneSignal, de propósito.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Hoje para postar', {
    body: d.body || 'Há postagens e stories para hoje.',
    icon: '/interno/icon.png', badge: '/interno/icon.png',
    tag: d.tag || 'yamb-postagens', renotify: true,
    data: { url: d.url || '/interno/' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || '/interno/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
    for (const c of lista) if (c.url.indexOf('/interno/') >= 0 && 'focus' in c) return c.focus();
    return self.clients.openWindow(alvo);
  }));
});
