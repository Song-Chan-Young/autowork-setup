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
    // 2026-11-13 08:25 송찬영 [AI] 받은 알림을 폰 안에만 적어 둠(최근 30건) - 알림을 누른 뒤 앱에서 내용을 다시 볼 수 있게. 주소 바뀜 알림은 뺌
    if (!d.url) {
      try {
        const c = await caches.open("aw"), r = await c.match("aw-notices");
        const list = r ? JSON.parse(await r.text()) : [];
        list.unshift({ t: Date.now(), title: d.title || "", body: d.body || "" });
        await c.put("aw-notices", new Response(JSON.stringify(list.slice(0, 30))));
      } catch (x) {}
    }
    await self.registration.showNotification(d.title || "오늘의할일", { body: d.body || "", icon: "icon.png", badge: "icon.png", tag: d.tag || undefined });
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const ws = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // (원본, 2026-11-13 송찬영 [AI]) if (ws.length) return ws[0].focus();  /  return self.clients.openWindow("./");
    // 2026-11-13 08:25 송찬영 [AI] 알림을 눌러 열면 '받은 알림' 목록을 펼쳐 보이게 알림(열린 창엔 메시지, 새로 열 땐 ?n=1)
    if (ws.length) { ws[0].postMessage({ notices: true }); return ws[0].focus(); }
    return self.clients.openWindow("./?n=1");
  })());
});
