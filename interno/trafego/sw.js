// Painel de Tráfego — recebe as notificações de push (Web Push) e abre o painel ao tocar.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: 'YAMB · Tráfego', body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'YAMB · Tráfego', {
    body: d.body || 'Há novidades no painel de tráfego.',
    icon: '/interno/icon.png',
    badge: '/interno/icon.png',
    tag: d.tag || 'yamb-trafego',
    renotify: true,
    data: { url: d.url || '/interno/trafego/#aba=sugestoes' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const alvo = new URL(e.notification.data && e.notification.data.url || '/interno/trafego/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
    for (const c of lista) if (c.url.indexOf('/interno/trafego/') >= 0 && 'focus' in c) { c.navigate(alvo); return c.focus(); }
    return self.clients.openWindow(alvo);
  }));
});
