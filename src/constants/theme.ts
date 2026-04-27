import { useThemeStore } from '@/store/theme.store';

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT PALETTE
// ─────────────────────────────────────────────────────────────────────────────
export const LIGHT = {
  bg:           '#f8fafc',
  card:         '#ffffff',
  cardBorder:   '#e2e8f0',
  glass:        'rgba(0,0,0,0.03)',
  glassBorder:  '#e2e8f0',

  textPrimary:   '#0f172a',
  textSecondary: '#475569',
  textMuted:     '#94a3b8',

  teal:      '#0f766e',
  tealDim:   '#f0fdf4',
  gold:      '#d97706',
  goldDim:   '#fef3c7',
  indigo:    '#4f46e5',
  indigoDim: '#eef2ff',
  purple:    '#7c3aed',
  purpleDim: '#f5f3ff',

  // Component-specific
  countdownBg:    '#0f766e',
  countdownGlow:  'rgba(15,118,110,0.15)',
  gridBg:         '#ffffff',
  gridItemBg:     '#f8fafc',
  gridItemActive: '#f0fdf4',
  gridBorder:     '#e2e8f0',
  gridActiveBorder:'#0f766e',
  inputBg:        '#ffffff',
  tabBar:         '#ffffff',
  tabBarBorder:   '#f1f5f9',
  tabActive:      '#0f766e',
  tabInactive:    '#94a3b8',
  headerBg:       '#0f766e',
  settingsBg:     '#f8fafc',
  settingsItem:   '#f1f5f9',
  trackerHeader:  '#0f766e',
  trackerCard:    '#ffffff',
  trackerCardBorder:'#e2e8f0',
  shadow:         'rgba(0,0,0,0.08)',
};

// ─────────────────────────────────────────────────────────────────────────────
// DARK PALETTE
// ─────────────────────────────────────────────────────────────────────────────
export const DARK = {
  bg:           '#0a0f1e',
  card:         '#111827',
  cardBorder:   'rgba(255,255,255,0.07)',
  glass:        'rgba(255,255,255,0.05)',
  glassBorder:  'rgba(255,255,255,0.12)',

  textPrimary:   '#F0F4FF',
  textSecondary: 'rgba(240,244,255,0.55)',
  textMuted:     'rgba(240,244,255,0.30)',

  teal:      '#14b8a6',
  tealDim:   'rgba(20,184,166,0.15)',
  gold:      '#f6c358',
  goldDim:   'rgba(246,195,88,0.15)',
  indigo:    '#818cf8',
  indigoDim: 'rgba(129,140,248,0.15)',
  purple:    '#a855f7',
  purpleDim: 'rgba(168,85,247,0.15)',

  countdownBg:    '#0d1f2d',
  countdownGlow:  'rgba(20,184,166,0.12)',
  gridBg:         '#111827',
  gridItemBg:     'rgba(255,255,255,0.04)',
  gridItemActive: 'rgba(20,184,166,0.15)',
  gridBorder:     'rgba(255,255,255,0.06)',
  gridActiveBorder:'rgba(20,184,166,0.45)',
  inputBg:        '#1e293b',
  tabBar:         '#0d1320',
  tabBarBorder:   'rgba(255,255,255,0.07)',
  tabActive:      '#14b8a6',
  tabInactive:    'rgba(240,244,255,0.35)',
  headerBg:       '#0a0f1e',
  settingsBg:     '#111827',
  settingsItem:   'rgba(255,255,255,0.06)',
  trackerHeader:  '#0c4a3e',
  trackerCard:    '#111827',
  trackerCardBorder:'rgba(255,255,255,0.08)',
  shadow:         'rgba(0,0,0,0.35)',
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — use anywhere in the app
// ─────────────────────────────────────────────────────────────────────────────
export function useAppTheme() {
  const isDark = useThemeStore((s) => s.isDark);
  return { colors: isDark ? DARK : LIGHT, isDark };
}
