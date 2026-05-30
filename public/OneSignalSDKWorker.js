/* CSP custom OneSignal worker: riusa la finestra/app già aperta e passa il deeplink senza ricaricare CSP. */

self.addEventListener('install', (event) => {
  try { self.skipWaiting(); } catch (_) {}
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try { await self.clients.claim(); } catch (_) {}
  })());
});

function cspExtractNotificationUrl(event) {
  const data = event?.notification?.data || {};
  const custom = data?.custom || {};
  const additionalData = data?.additionalData || data?.additional_data || custom?.a || {};

  return (
    data?.url ||
    data?.launchUrl ||
    data?.launch_url ||
    data?.web_url ||
    data?.deeplink ||
    data?.u ||
    custom?.u ||
    additionalData?.url ||
    additionalData?.launchUrl ||
    additionalData?.launch_url ||
    additionalData?.deeplink ||
    '/'
  );
}

async function cspFocusOrOpen(targetUrl) {
  const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  const sameOriginClients = allClients.filter((client) => {
    try { return new URL(client.url).origin === self.location.origin; } catch (_) { return false; }
  });

  if (sameOriginClients.length > 0) {
    const client = sameOriginClients[0];
    const payload = { type: 'CSP_PUSH_DEEPLINK', url: targetUrl, deeplink: targetUrl, launchUrl: targetUrl };
    try { client.postMessage(payload); } catch (_) {}
    try {
      const channel = new BroadcastChannel('csp-push-deeplink');
      channel.postMessage(payload);
      channel.close();
    } catch (_) {}
    if ('focus' in client) return client.focus();
    return client;
  }

  if (clients.openWindow) return clients.openWindow(targetUrl);
  return null;
}

self.addEventListener('notificationclick', (event) => {
  const rawUrl = cspExtractNotificationUrl(event);
  let targetUrl = self.location.origin + '/';

  try {
    targetUrl = new URL(rawUrl || '/', self.location.origin).href;
  } catch (_) {}

  try { event.notification?.close?.(); } catch (_) {}
  try { event.stopImmediatePropagation?.(); } catch (_) {}

  event.waitUntil(cspFocusOrOpen(targetUrl));
});

importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
