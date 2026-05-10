export type ActivityType =
  | 'quran'
  | 'dhikr'
  | 'nafile'
  | 'fasting'
  | 'sadaka'
  | 'dua'
  | 'memorization';

export interface TrackerLog {
  id: string;
  date: string;
  activity_type: ActivityType;
  value: Record<string, any>;
  notes?: string;
  created_at: string;
}

export interface QuranValue {
  pages: number;
  minutes?: number;
}

export interface DhikrValue {
  type: string; // subhanallah | alhamdulillah | allahuakbar | lailahe | salavat | custom
  name?: string;
  count: number;
}

export interface NafileValue {
  type: string; // teheccud | duha | evvabin | teravih | diger
  rakaat: number;
}

export interface FastingValue {
  type: string; // nafile | pazartesi_persembe | kaza
}

export interface SadakaValue {
  amount: number;
  description?: string;
}

export interface DuaValue {
  minutes: number;
  type?: string; // sabah_aksam | genel | kunut
}

export interface MemorizationValue {
  new_ayets: number;
  revision_ayets?: number;
}

export interface ActivityMeta {
  type: ActivityType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  unit: string;
  description: string;
}

export const ACTIVITY_META: Record<ActivityType, ActivityMeta> = {
  quran: {
    type: 'quran',
    label: 'Kuran Okuma',
    icon: 'book',
    color: '#8b5cf6',
    bgColor: '#8b5cf615',
    unit: 'sayfa',
    description: 'Bugün okuduğun sayfa sayısını gir',
  },
  dhikr: {
    type: 'dhikr',
    label: 'Zikir',
    icon: 'radio-button-on',
    color: '#06b6d4',
    bgColor: '#06b6d415',
    unit: 'adet',
    description: 'Çektiğin zikri ve sayısını kaydet',
  },
  nafile: {
    type: 'nafile',
    label: 'Nafile Namaz',
    icon: 'star',
    color: '#f59e0b',
    bgColor: '#f59e0b15',
    unit: 'rekat',
    description: 'Kıldığın nafile namazı kaydet',
  },
  fasting: {
    type: 'fasting',
    label: 'Oruç',
    icon: 'nutrition',
    color: '#10b981',
    bgColor: '#10b98115',
    unit: '',
    description: 'Bugün tuttuğun orucu kaydet',
  },
  sadaka: {
    type: 'sadaka',
    label: 'Sadaka',
    icon: 'heart',
    color: '#ef4444',
    bgColor: '#ef444415',
    unit: '₺',
    description: 'Verdiğin sadakayı kaydet',
  },
  dua: {
    type: 'dua',
    label: 'Dua & Zikir Vakti',
    icon: 'hand-left',
    color: '#ec4899',
    bgColor: '#ec489915',
    unit: 'dk',
    description: 'Dua için ayırdığın süreyi kaydet',
  },
  memorization: {
    type: 'memorization',
    label: 'Hafızlık / Tekrar',
    icon: 'library',
    color: '#3b82f6',
    bgColor: '#3b82f615',
    unit: 'ayet',
    description: 'Ezberleyip tekrar ettiğin ayetleri kaydet',
  },
};

export interface WeeklyDay {
  date: string;
  activities: Record<string, { entry_count: number; values: any[] }>;
}

export interface WeeklyStats {
  days: WeeklyDay[];
  totals: Record<string, number>;
}

export interface MonthlyStats {
  year: number;
  month: number;
  daily: Record<string, Record<string, { entry_count: number; values: any[] }>>;
  totals: Record<string, number>;
  active_days: number;
}
