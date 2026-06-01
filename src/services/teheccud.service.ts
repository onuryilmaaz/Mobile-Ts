// Teheccüd vakti hesabı:
// Yatsı vakti ile (ertesi gün) imsak vakti arasındaki sürenin SON ÜÇTE BİRİ.
// Örnek: Yatsı 20:30, ertesi imsak 04:30 → toplam 8 saat gece.
// Son üçte bir = 8 * 2/3 = 5h 20m sonra → teheccüd başlangıcı 01:50, bitiş 04:30.

function timeToMinutes(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(min: number): string {
  const normalized = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = Math.floor(normalized % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Returns the teheccüd window for tonight.
 * `start` is the beginning of the last third of the night (best time).
 * `end` is the next day's imsak time.
 */
export function calculateTeheccudWindow(yatsi: string, nextImsak: string): {
  start: string;
  end: string;
  midnight: string;
} {
  const yatsiMin = timeToMinutes(yatsi);
  // imsak is on the next day, so add 24h
  const imsakMin = timeToMinutes(nextImsak) + 1440;

  const nightLength = imsakMin - yatsiMin; // total minutes of night
  const lastThirdStart = yatsiMin + Math.floor((nightLength * 2) / 3);
  const midnight = yatsiMin + Math.floor(nightLength / 2);

  return {
    start: minutesToTime(lastThirdStart),
    end: minutesToTime(imsakMin),
    midnight: minutesToTime(midnight),
  };
}

/**
 * Returns the current status of the teheccüd window.
 * - 'before_yatsi': yatsı vakti henüz girmedi
 * - 'before_window': yatsı geçti ama son üçte bir başlamadı
 * - 'active': teheccüd vakti aktif
 * - 'after_imsak': imsak geçti
 */
export function getTeheccudStatus(
  yatsi: string,
  nextImsak: string,
  now: Date = new Date(),
): { state: 'before_yatsi' | 'before_window' | 'active' | 'after_imsak'; window: ReturnType<typeof calculateTeheccudWindow> } {
  const window = calculateTeheccudWindow(yatsi, nextImsak);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const yatsiMin = timeToMinutes(yatsi);
  const imsakMin = timeToMinutes(nextImsak);
  const lastThirdMin = timeToMinutes(window.start);

  // Compare relative to current "day boundary" — handle both cases:
  // Case A: now is between yatsı (yesterday's yatsı) and midnight → nowMin is high (~22-23:59)
  // Case B: now is past midnight → nowMin is low (~00:00-imsak)

  // Normalize: if now < imsak, treat as "morning" — we're in last third or after
  if (nowMin < imsakMin) {
    // morning portion of night
    // teheccüd start could be late evening (e.g. 23:30) OR early morning (e.g. 02:00)
    // If lastThirdMin > 12*60 (evening), we've already passed midnight, so we're in last third
    if (lastThirdMin >= 12 * 60) {
      // last-third starts before midnight, we're past it
      return { state: 'active', window };
    }
    // last-third starts after midnight
    if (nowMin < lastThirdMin) return { state: 'before_window', window };
    return { state: 'active', window };
  }

  // Evening: now is >= imsakMin AND < midnight (technically)
  if (nowMin < yatsiMin) return { state: 'before_yatsi', window };

  // Past yatsı, before midnight
  if (lastThirdMin >= 12 * 60 && nowMin >= lastThirdMin) {
    return { state: 'active', window };
  }
  return { state: 'before_window', window };
}
