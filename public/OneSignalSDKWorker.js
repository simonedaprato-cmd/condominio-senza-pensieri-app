/*
  Condominio Senza Pensieri - OneSignal Service Worker rinforzato
  Versione: CSP_SW_PUSH_FALLBACK_V1_2026-05-12

  Obiettivo:
  - lasciare OneSignal come gestore principale;
  - evitare la notifica generica Chrome/Android "Il sito è stato aggiornato in background";
  - mostrare una notifica fallback solo se OneSignal non ne mostra già una.
*/

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CSP_APP_NAME = "Condominio Senza Pensieri";
const CSP_DEFAULT_BODY = "Hai un nuovo aggiornamento. Apri l’app per i dettagli.";
const CSP_DEFAULT_URL = "/";
const CSP_DEFAULT_ICON = "/icon-192.png";
const CSP_DEFAULT_BADGE = "/icon-192.png";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeJsonFromPushEvent(event) {
  try {
    if (!event || !event.data) return null;

    try {
      return event.data.json();
    } catch (_) {
      const text = event.data.text();
      if (!text) return null;

      try {
        return JSON.parse(text);
      } catch (_) {
        return { body: text };
      }
    }
  } catch (_) {
    return null;
  }
}

function pickString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function extractNotificationPayload(raw) {
  const data = raw || {};

  const custom = typeof data.custom === "string"
    ? (() => {
        try { return JSON.parse(data.custom); } catch (_) { return {}; }
      })()
    : (data.custom || {});

  const additionalData = custom.a || data.data || data.additionalData || {};

  const title = pickString(
    data.title,
    data.heading,
    data.headings?.it,
    data.headings?.en,
    data.notification?.title,
    additionalData.title,
    CSP_APP_NAME
  );

  const body = pickString(
    data.body,
    data.alert,
    data.message,
    data.contents?.it,
    data.contents?.en,
    data.notification?.body,
    additionalData.message,
    CSP_DEFAULT_BODY
  );

  const url = pickString(
    data.url,
    data.launchURL,
    data.web_url,
    data.app_url,
    data.notification?.click_action,
    additionalData.url,
    CSP_DEFAULT_URL
  );

  const icon = pickString(
    data.icon,
    data.chrome_web_icon,
    data.notification?.icon,
    CSP_DEFAULT_ICON
  );

  const badge = pickString(
    data.badge,
    data.chrome_web_badge,
    CSP_DEFAULT_BADGE
  );

  const tag = pickString(
    data.tag,
    data.web_push_topic,
    additionalData.tipo,
    additionalData.evento,
    "csp-push"
  );

  return {
    title,
    options: {
      body,
      icon,
      badge,
      tag,
      renotify: true,
      requireInteraction: false,
      data: {
        url,
        raw,
        source: "csp-service-worker-fallback",
      },
    },
  };
}

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    /*
      Diamo prima tempo al worker OneSignal importato sopra di mostrare la sua notifica.
      Se dopo un breve intervallo non compare nulla, mostriamo noi un fallback.
    */
    const before = await self.registration.getNotifications();

    await wait(900);

    const after = await self.registration.getNotifications();

    if (after.length > before.length) {
      return;
    }

    const rawPayload = safeJsonFromPushEvent(event);
    const notification = extractNotificationPayload(rawPayload);

    await self.registration.showNotification(notification.title, notification.options);
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url ||
    CSP_DEFAULT_URL;

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    const absoluteUrl = new URL(targetUrl, self.location.origin).href;

    for (const client of allClients) {
      if ("focus" in client) {
        try {
          if (client.url && new URL(client.url).origin === self.location.origin) {
            await client.focus();
            return;
          }
        } catch (_) {}
      }
    }

    if (clients.openWindow) {
      await clients.openWindow(absoluteUrl);
    }
  })());
});

