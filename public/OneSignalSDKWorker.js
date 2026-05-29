/* CSP custom OneSignal worker: prova a riusare la finestra PWA/app già aperta invece di aprire una nuova istanza. */

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

self.addEventListener('notificationclick', (event) => {
  const rawUrl = cspExtractNotificationUrl(event);
  let targetUrl = '/';

  try {
    targetUrl = new URL(rawUrl || '/', self.location.origin).href;
  } catch (_) {
    targetUrl = self.location.origin + '/';
  }

  try {
    event.notification?.close?.();
    event.stopImmediatePropagation?.();
  } catch (_) {}

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const sameOriginClients = allClients.filter((client) => {
      try {
        return new URL(client.url).origin === self.location.origin;
      } catch (_) {
        return false;
      }
    });

    if (sameOriginClients.length > 0) {
      const client = sameOriginClients[0];
      try {
        client.postMessage({ type: 'CSP_PUSH_DEEPLINK', url: targetUrl });
      } catch (_) {}
      if ('focus' in client) return client.focus();
      return client;
    }

    if (clients.openWindow) return clients.openWindow(targetUrl);
    return null;
  })());
});

importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
