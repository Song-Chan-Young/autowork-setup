// 2026-11-06 16:20 송찬영 [AI] 알림 받기 - PC 가 보낸 암호화된 알림을 띄움. 주소가 바뀌었다는 알림이면 새 주소를 기억
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data.json(); } catch (x) { d = { title: "오늘의할일", body: e.data ? e.data.text() : "" }; }
  e.waitUntil((async () => {
    if (d.url) {
      const c = await caches.open("aw");
      await c.put("aw-url", new Response(JSON.stringify({ u: d.url, t: Date.now() })));
      for (const w of await self.clients.matchAll({ type: "window", includeUncontrolled: true })) w.postMessage({ url: d.url });
    }
    await self.registration.showNotification(d.title || "오늘의할일", { body: d.body || "", icon: "icon.png", badge: "icon.png", tag: d.tag || undefined });
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const ws = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (ws.length) return ws[0].focus();
    return self.clients.openWindow("./");
  })());
});
