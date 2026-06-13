import * as Sentry from '@sentry/react-native';

/**
 * Sentry hata izleme. EXPO_PUBLIC_SENTRY_DSN tanımlı değilse no-op çalışır —
 * yani DSN ayarlanana kadar uygulama davranışı hiç değişmez.
 *
 * Aktive etmek için:
 *   1. mobile/.env içine EXPO_PUBLIC_SENTRY_DSN=... ekle
 *   2. npm run prebuild && yeniden derle (native modül linklenmesi için)
 */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
export const sentryEnabled = Boolean(dsn);

export function initSentry() {
  if (!sentryEnabled) return;

  Sentry.init({
    dsn,
    // Performans izleme örneklemesi — production maliyeti için düşük tutuldu.
    tracesSampleRate: 0.1,
    // PII (kullanıcı IP'si vb.) varsayılan olarak kapalı — gizlilik öncelikli.
    sendDefaultPii: false,
  });
}

export { Sentry };
