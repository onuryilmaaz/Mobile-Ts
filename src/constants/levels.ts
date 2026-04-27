// Seviye sistemi sabitleri — backend ile senkronize tutulmalı
export const LEVELS = [
  { level: 1,  name: 'Başlangıç', minPoints: 0,     maxPoints: 99,        tier: 'bronze',  color: '#cd7f32', icon: 'leaf'    },
  { level: 2,  name: 'Mümin',     minPoints: 100,   maxPoints: 299,       tier: 'bronze',  color: '#cd7f32', icon: 'leaf'    },
  { level: 3,  name: 'Salik',     minPoints: 300,   maxPoints: 599,       tier: 'silver',  color: '#9ca3af', icon: 'shield'  },
  { level: 4,  name: 'Abid',      minPoints: 600,   maxPoints: 999,       tier: 'silver',  color: '#9ca3af', icon: 'shield'  },
  { level: 5,  name: 'Zahid',     minPoints: 1000,  maxPoints: 1999,      tier: 'gold',    color: '#fbbf24', icon: 'star'    },
  { level: 6,  name: 'Arif',      minPoints: 2000,  maxPoints: 3499,      tier: 'gold',    color: '#fbbf24', icon: 'star'    },
  { level: 7,  name: 'Veli',      minPoints: 3500,  maxPoints: 4999,      tier: 'diamond', color: '#60a5fa', icon: 'diamond' },
  { level: 8,  name: 'Muhlis',    minPoints: 5000,  maxPoints: 7499,      tier: 'diamond', color: '#60a5fa', icon: 'diamond' },
  { level: 9,  name: 'Âşık',      minPoints: 7500,  maxPoints: 9999,      tier: 'legend',  color: '#a855f7', icon: 'planet'  },
  { level: 10, name: 'Efsane',    minPoints: 10000, maxPoints: Infinity,  tier: 'legend',  color: '#a855f7', icon: 'planet'  },
];
