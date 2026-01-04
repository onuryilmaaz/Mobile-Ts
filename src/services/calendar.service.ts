export interface ReligiousDay {
  id: string;
  name: string;
  date: Date;
  hijriDate?: string;
  isHoliday?: boolean;
}

const RELIGIOUS_DAYS_2026: ReligiousDay[] = [
  { id: 'mirac', name: 'Miraç Kandili', date: new Date('2026-01-15'), hijriDate: '26 Receb 1447' },
  { id: 'berat', name: 'Berat Kandili', date: new Date('2026-02-02'), hijriDate: '14 Şaban 1447' },
  {
    id: 'ramazan_arife',
    name: 'Ramazan Arifesi',
    date: new Date('2026-02-18'),
    hijriDate: '29 Şaban 1447',
    isHoliday: true,
  },
  {
    id: 'ramazan_start',
    name: 'Ramazan Başlangıcı',
    date: new Date('2026-02-19'),
    hijriDate: '1 Ramazan 1447',
  },
  { id: 'kadir', name: 'Kadir Gecesi', date: new Date('2026-03-16'), hijriDate: '26 Ramazan 1447' },
  {
    id: 'ramazan_bayram_arife',
    name: 'Ramazan Bayramı Arifesi',
    date: new Date('2026-03-19'),
    hijriDate: '29 Ramazan 1447',
    isHoliday: true,
  },
  {
    id: 'ramazan_bayram_1',
    name: 'Ramazan Bayramı 1. Gün',
    date: new Date('2026-03-20'),
    hijriDate: '1 Şevval 1447',
    isHoliday: true,
  },
  {
    id: 'ramazan_bayram_2',
    name: 'Ramazan Bayramı 2. Gün',
    date: new Date('2026-03-21'),
    hijriDate: '2 Şevval 1447',
    isHoliday: true,
  },
  {
    id: 'ramazan_bayram_3',
    name: 'Ramazan Bayramı 3. Gün',
    date: new Date('2026-03-22'),
    hijriDate: '3 Şevval 1447',
    isHoliday: true,
  },
  {
    id: 'kurban_bayram_arife',
    name: 'Kurban Bayramı Arifesi',
    date: new Date('2026-05-26'),
    hijriDate: '9 Zilhicce 1447',
    isHoliday: true,
  },
  {
    id: 'kurban_bayram_1',
    name: 'Kurban Bayramı 1. Gün',
    date: new Date('2026-05-27'),
    hijriDate: '10 Zilhicce 1447',
    isHoliday: true,
  },
  {
    id: 'kurban_bayram_2',
    name: 'Kurban Bayramı 2. Gün',
    date: new Date('2026-05-28'),
    hijriDate: '11 Zilhicce 1447',
    isHoliday: true,
  },
  {
    id: 'kurban_bayram_3',
    name: 'Kurban Bayramı 3. Gün',
    date: new Date('2026-05-29'),
    hijriDate: '12 Zilhicce 1447',
    isHoliday: true,
  },
  {
    id: 'kurban_bayram_4',
    name: 'Kurban Bayramı 4. Gün',
    date: new Date('2026-05-30'),
    hijriDate: '13 Zilhicce 1447',
    isHoliday: true,
  },
  {
    id: 'hicri_yilbasi',
    name: 'Hicri Yılbaşı',
    date: new Date('2026-06-16'),
    hijriDate: '1 Muharrem 1448',
  },
  { id: 'asure', name: 'Aşure Günü', date: new Date('2026-06-25'), hijriDate: '10 Muharrem 1448' },
  {
    id: 'mevlid',
    name: 'Mevlid Kandili',
    date: new Date('2026-08-24'),
    hijriDate: '12 Rebiulevvel 1448',
  },
  {
    id: 'uc_aylar',
    name: 'Üç Ayların Başlangıcı',
    date: new Date('2026-12-10'),
    hijriDate: '1 Receb 1448',
  },
  { id: 'regaib', name: 'Regaib Kandili', date: new Date('2026-12-10'), hijriDate: '1 Receb 1448' },
];

const HIJRI_MONTHS = [
  'Muharrem',
  'Safer',
  'Rebiulevvel',
  'Rebiulahir',
  'Cemaziyelevvel',
  'Cemaziyelahir',
  'Receb',
  'Şaban',
  'Ramazan',
  'Şevval',
  'Zilkade',
  'Zilhicce',
];

export const calendarService = {
  getReligiousDays() {
    return RELIGIOUS_DAYS_2026;
  },

  getNextReligiousDay() {
    const now = new Date();
    return RELIGIOUS_DAYS_2026.find((day) => day.date >= now) || null;
  },

  getTodayHijri() {
    const now = new Date();
    const referenceDate = new Date('2026-01-15');
    const referenceHijriDay = 26;
    const referenceHijriMonth = 6;
    const referenceHijriYear = 1447;

    const diffTime = now.getTime() - referenceDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let hDay = referenceHijriDay + diffDays;
    let hMonth = referenceHijriMonth;
    let hYear = referenceHijriYear;

    while (hDay <= 0) {
      hMonth--;
      if (hMonth < 0) {
        hMonth = 11;
        hYear--;
      }
      hDay += 29;
    }
    while (hDay > 30) {
      hDay -= 30;
      hMonth++;
      if (hMonth > 11) {
        hMonth = 0;
        hYear++;
      }
    }

    return `${hDay} ${HIJRI_MONTHS[hMonth]} ${hYear}`;
  },
};
