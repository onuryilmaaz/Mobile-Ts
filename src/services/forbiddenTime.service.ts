// İslam'da namaz kılınması yasak olan üç kerahat vakti:
// 1. Güneş doğuşu — güneşin doğmaya başladığı andan, yaklaşık 45 dk sonrasına kadar
// 2. Zeval vakti (istiva) — güneşin tepede olduğu an, öğle vaktinden ~10 dk önce
// 3. Güneş batımı — kızarmaya başladığı andan akşam vakti girinceye kadar (~30 dk)

export type ForbiddenWindow = {
  type: 'sunrise' | 'zawal' | 'sunset';
  label: string;
  description: string;
  start: Date;
  end: Date;
};

function parseToToday(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

/**
 * Bugünün üç yasak vakit penceresini hesaplar.
 * @param gunes Güneş vakti (HH:mm)
 * @param ogle Öğle vakti (HH:mm)
 * @param aksam Akşam vakti (HH:mm)
 */
export function getForbiddenWindows(
  gunes: string,
  ogle: string,
  aksam: string,
): ForbiddenWindow[] {
  const windows: ForbiddenWindow[] = [];

  // 1. Güneş doğuş kerahat vakti: güneş vaktinden 45 dk sonrasına kadar
  if (gunes) {
    const start = parseToToday(gunes);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    windows.push({
      type: 'sunrise',
      label: 'Güneş Doğuş Vakti',
      description: 'Güneşin doğmaya başladığı andan yükselişine kadar nafile namaz kılınmaz.',
      start, end,
    });
  }

  // 2. İstiva (zeval) vakti: öğle vaktinden 10 dk önce başlar, öğle vakti girince biter
  if (ogle) {
    const oglEnd = parseToToday(ogle);
    const start = new Date(oglEnd.getTime() - 10 * 60 * 1000);
    windows.push({
      type: 'zawal',
      label: 'İstiva (Zeval) Vakti',
      description: 'Güneşin tam tepede olduğu kısa vakit; öğle vakti girene kadar nafile namaz kılınmaz.',
      start, end: oglEnd,
    });
  }

  // 3. Akşam kerahat vakti: akşam vaktinden 30 dk önce başlar, akşam vakti girince biter
  if (aksam) {
    const aksamEnd = parseToToday(aksam);
    const start = new Date(aksamEnd.getTime() - 30 * 60 * 1000);
    windows.push({
      type: 'sunset',
      label: 'Akşam Kerahat Vakti',
      description: 'Güneş batmaya başladığı andan akşam vakti girene kadar nafile namaz kılınmaz.',
      start, end: aksamEnd,
    });
  }

  return windows;
}

/**
 * Şu an aktif olan yasak vakti döndürür (varsa).
 */
export function getActiveForbiddenWindow(
  gunes: string,
  ogle: string,
  aksam: string,
  now: Date = new Date(),
): ForbiddenWindow | null {
  const windows = getForbiddenWindows(gunes, ogle, aksam);
  return windows.find((w) => now >= w.start && now < w.end) ?? null;
}
