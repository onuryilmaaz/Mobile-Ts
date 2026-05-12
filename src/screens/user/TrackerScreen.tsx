/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useTrackerStore } from '@/modules/tracker/tracker.store';
import { useTheme } from '@/hooks/useTheme';
import { ACTIVITY_META, type ActivityType, type TrackerLog } from '@/modules/tracker/tracker.types';
import { liveActivityService } from '@/modules/liveActivity/liveActivity.service';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const TABS = ['Bugün', 'Haftalık', 'Aylık'] as const;
type Tab = (typeof TABS)[number];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTurkishDate(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getValueLabel(log: TrackerLog): string {
  const { activity_type: type, value: v } = log;
  switch (type) {
    case 'quran':
      return `${v.pages} sayfa${v.minutes ? ` · ${v.minutes} dk` : ''}`;
    case 'dhikr':
      return `${v.name ?? v.type} · ${v.count} kez`;
    case 'nafile':
      return `${nafileLabel(v.type)} · ${v.rakaat} rekat`;
    case 'fasting':
      return fastingLabel(v.type);
    case 'sadaka':
      return `${v.amount}₺${v.description ? ` · ${v.description}` : ''}`;
    case 'dua':
      return `${v.minutes} dakika${v.type ? ` · ${v.type}` : ''}`;
    case 'memorization':
      return `${v.new_ayets} yeni${v.revision_ayets ? ` · ${v.revision_ayets} tekrar` : ''} ayet`;
    default:
      return '';
  }
}

function nafileLabel(type: string) {
  const map: Record<string, string> = {
    teheccud: 'Teheccüd',
    duha: 'Duha',
    evvabin: 'Evvabin',
    teravih: 'Teravih',
    diger: 'Diğer',
  };
  return map[type] ?? type;
}

function fastingLabel(type: string) {
  const map: Record<string, string> = {
    nafile: 'Nafile Oruç',
    pazartesi_persembe: 'Pzt–Prş Orucu',
    kaza: 'Kaza Orucu',
  };
  return map[type] ?? type;
}

function aggregateToday(logs: TrackerLog[], type: ActivityType): number {
  const filtered = logs.filter((l) => l.activity_type === type);
  if (!filtered.length) return 0;
  switch (type) {
    case 'quran':
      return filtered.reduce((s, l) => s + (l.value.pages ?? 0), 0);
    case 'dhikr':
      return filtered.reduce((s, l) => s + (l.value.count ?? 0), 0);
    case 'nafile':
      return filtered.reduce((s, l) => s + (l.value.rakaat ?? 0), 0);
    case 'fasting':
      return filtered.length;
    case 'sadaka':
      return filtered.reduce((s, l) => s + (l.value.amount ?? 0), 0);
    case 'dua':
      return filtered.reduce((s, l) => s + (l.value.minutes ?? 0), 0);
    case 'memorization':
      return filtered.reduce(
        (s, l) => s + (l.value.new_ayets ?? 0) + (l.value.revision_ayets ?? 0),
        0
      );
    default:
      return 0;
  }
}

// ─── Log Entry Input Form ────────────────────────────────────────────────────

interface LogFormProps {
  type: ActivityType;
  onSubmit: (value: Record<string, any>, notes?: string) => void;
  onClose: () => void;
  isDark: boolean;
}

function LogForm({ type, onSubmit, onClose, isDark }: LogFormProps) {
  const meta = ACTIVITY_META[type];
  const inputCls = `rounded-2xl border px-4 py-3 text-base ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`;
  const labelCls = `mb-1.5 text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`;

  // Quran
  const [pages, setPages] = useState('');
  const [minutes, setMinutes] = useState('');
  // Dhikr
  const [dhikrType, setDhikrType] = useState('subhanallah');
  const [dhikrCustomName, setDhikrCustomName] = useState('');
  const [dhikrCount, setDhikrCount] = useState('');
  // Nafile
  const [nafileType, setNafileType] = useState('teheccud');
  const [rakaat, setRakaat] = useState('');
  // Fasting
  const [fastingType, setFastingType] = useState('nafile');
  // Sadaka
  const [sadakaAmount, setSadakaAmount] = useState('');
  const [sadakaDesc, setSadakaDesc] = useState('');
  // Dua
  const [duaMinutes, setDuaMinutes] = useState('');
  // Memorization
  const [newAyets, setNewAyets] = useState('');
  const [revisionAyets, setRevisionAyets] = useState('');
  // Notes
  const [notes, setNotes] = useState('');

  const DHIKR_TYPES = [
    { value: 'subhanallah', label: 'Subhanallah' },
    { value: 'alhamdulillah', label: 'Elhamdülillah' },
    { value: 'allahuakbar', label: 'Allahu Ekber' },
    { value: 'lailahe', label: 'La ilahe illallah' },
    { value: 'salavat', label: 'Salavat' },
    { value: 'custom', label: 'Diğer...' },
  ];

  const NAFILE_TYPES = [
    { value: 'teheccud', label: 'Teheccüd' },
    { value: 'duha', label: 'Duha' },
    { value: 'evvabin', label: 'Evvabin' },
    { value: 'teravih', label: 'Teravih' },
    { value: 'diger', label: 'Diğer' },
  ];

  const FASTING_TYPES = [
    { value: 'nafile', label: 'Nafile Oruç' },
    { value: 'pazartesi_persembe', label: 'Pazartesi–Perşembe' },
    { value: 'kaza', label: 'Kaza Orucu' },
  ];

  const chipCls = (active: boolean, color: string) =>
    `mr-2 mb-2 rounded-full px-3 py-1.5 border ${active ? `border-transparent` : isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`;

  const handleSubmit = () => {
    let value: Record<string, any> = {};
    switch (type) {
      case 'quran':
        if (!pages || Number(pages) < 1) return Alert.alert('Hata', 'Sayfa sayısı giriniz');
        value = { pages: Number(pages), ...(minutes ? { minutes: Number(minutes) } : {}) };
        break;
      case 'dhikr':
        if (!dhikrCount || Number(dhikrCount) < 1)
          return Alert.alert('Hata', 'Zikir sayısı giriniz');
        if (dhikrType === 'custom' && !dhikrCustomName)
          return Alert.alert('Hata', 'Zikir adı giriniz');
        value = {
          type: dhikrType,
          count: Number(dhikrCount),
          ...(dhikrType === 'custom' ? { name: dhikrCustomName } : {}),
        };
        break;
      case 'nafile':
        if (!rakaat || Number(rakaat) < 1) return Alert.alert('Hata', 'Rekat sayısı giriniz');
        value = { type: nafileType, rakaat: Number(rakaat) };
        break;
      case 'fasting':
        value = { type: fastingType };
        break;
      case 'sadaka':
        if (!sadakaAmount || Number(sadakaAmount) < 0) return Alert.alert('Hata', 'Miktar giriniz');
        value = {
          amount: Number(sadakaAmount),
          ...(sadakaDesc ? { description: sadakaDesc } : {}),
        };
        break;
      case 'dua':
        if (!duaMinutes || Number(duaMinutes) < 1) return Alert.alert('Hata', 'Dakika giriniz');
        value = { minutes: Number(duaMinutes) };
        break;
      case 'memorization':
        if (!newAyets && !revisionAyets) return Alert.alert('Hata', 'En az bir alan doldurunuz');
        value = {
          new_ayets: Number(newAyets) || 0,
          ...(revisionAyets ? { revision_ayets: Number(revisionAyets) } : {}),
        };
        break;
    }
    onSubmit(value, notes || undefined);
  };

  return (
    <View
      className={`rounded-t-3xl pt-3 ${isDark ? 'bg-slate-900' : 'bg-white'}`}
      style={{ maxHeight: SCREEN_H * 0.82 }}>
      {/* Handle */}
      <View className="mb-3 items-center">
        <View className="h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
      </View>

      {/* Title */}
      <View className="mb-4 flex-row items-center gap-3 border-b border-slate-100 px-5 pb-4 dark:border-slate-800">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: meta.bgColor }}>
          <Ionicons name={meta.icon as any} size={20} color={meta.color} />
        </View>
        <View>
          <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {meta.label}
          </Text>
          <Text className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {meta.description}
          </Text>
        </View>
      </View>

      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 8, paddingTop: 4 }}>
        {/* ── QURAN ── */}
        {type === 'quran' && (
          <View className="gap-4">
            <View>
              <Text className={labelCls}>Sayfa sayısı *</Text>
              <NumberStepper value={pages} onChange={setPages} className={inputCls} />
            </View>
            <View>
              <Text className={labelCls}>Kaç dakika? (opsiyonel)</Text>
              <TextInput
                className={inputCls}
                placeholder="örn: 20"
                keyboardType="numeric"
                value={minutes}
                onChangeText={setMinutes}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>
        )}

        {/* ── DHIKR ── */}
        {type === 'dhikr' && (
          <View className="gap-4">
            <View>
              <Text className={labelCls}>Zikir türü</Text>
              <View className="flex-row flex-wrap">
                {DHIKR_TYPES.map((d) => (
                  <TouchableOpacity
                    key={d.value}
                    onPress={() => setDhikrType(d.value)}
                    className={chipCls(dhikrType === d.value, meta.color)}
                    style={dhikrType === d.value ? { backgroundColor: meta.color } : {}}>
                    <Text
                      className={`text-xs font-bold ${dhikrType === d.value ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {dhikrType === 'custom' && (
              <View>
                <Text className={labelCls}>Zikir adı</Text>
                <TextInput
                  className={inputCls}
                  placeholder="örn: Estağfirullah"
                  value={dhikrCustomName}
                  onChangeText={setDhikrCustomName}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            )}
            <View>
              <Text className={labelCls}>Kaç kez? *</Text>
              <NumberStepper
                value={dhikrCount}
                onChange={setDhikrCount}
                className={inputCls}
                step={33}
              />
            </View>
          </View>
        )}

        {/* ── NAFILE ── */}
        {type === 'nafile' && (
          <View className="gap-4">
            <View>
              <Text className={labelCls}>Namaz türü</Text>
              <View className="flex-row flex-wrap">
                {NAFILE_TYPES.map((n) => (
                  <TouchableOpacity
                    key={n.value}
                    onPress={() => setNafileType(n.value)}
                    className={chipCls(nafileType === n.value, meta.color)}
                    style={nafileType === n.value ? { backgroundColor: meta.color } : {}}>
                    <Text
                      className={`text-xs font-bold ${nafileType === n.value ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {n.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text className={labelCls}>Rekat sayısı *</Text>
              <NumberStepper value={rakaat} onChange={setRakaat} className={inputCls} step={2} />
            </View>
          </View>
        )}

        {/* ── FASTING ── */}
        {type === 'fasting' && (
          <View>
            <Text className={labelCls}>Oruç türü</Text>
            <View className="flex-row flex-wrap">
              {FASTING_TYPES.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => setFastingType(f.value)}
                  className={chipCls(fastingType === f.value, meta.color)}
                  style={fastingType === f.value ? { backgroundColor: meta.color } : {}}>
                  <Text
                    className={`text-xs font-bold ${fastingType === f.value ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── SADAKA ── */}
        {type === 'sadaka' && (
          <View className="gap-4">
            <View>
              <Text className={labelCls}>Miktar (₺) *</Text>
              <TextInput
                className={inputCls}
                placeholder="örn: 100"
                keyboardType="numeric"
                value={sadakaAmount}
                onChangeText={setSadakaAmount}
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View>
              <Text className={labelCls}>Açıklama (opsiyonel)</Text>
              <TextInput
                className={inputCls}
                placeholder="örn: yemek yardımı"
                value={sadakaDesc}
                onChangeText={setSadakaDesc}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>
        )}

        {/* ── DUA ── */}
        {type === 'dua' && (
          <View>
            <Text className={labelCls}>Kaç dakika? *</Text>
            <NumberStepper
              value={duaMinutes}
              onChange={setDuaMinutes}
              className={inputCls}
              step={5}
            />
          </View>
        )}

        {/* ── MEMORIZATION ── */}
        {type === 'memorization' && (
          <View className="gap-4">
            <View>
              <Text className={labelCls}>Yeni ezberlenen ayet sayısı</Text>
              <NumberStepper value={newAyets} onChange={setNewAyets} className={inputCls} />
            </View>
            <View>
              <Text className={labelCls}>Tekrar edilen ayet sayısı</Text>
              <NumberStepper
                value={revisionAyets}
                onChange={setRevisionAyets}
                className={inputCls}
              />
            </View>
          </View>
        )}

        {/* Notes */}
        <View className="mt-4">
          <Text className={labelCls}>Not (opsiyonel)</Text>
          <TextInput
            className={`${inputCls} min-h-[60px]`}
            placeholder="Bir not ekle..."
            multiline
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </ScrollView>

      {/* Sabit alt butonlar */}
      <View className="flex-row gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
        <TouchableOpacity
          onPress={onClose}
          className="flex-1 items-center rounded-2xl border border-slate-200 py-3.5 dark:border-slate-700">
          <Text className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>İptal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          className="flex-1 items-center rounded-2xl py-3.5"
          style={{ backgroundColor: meta.color }}>
          <Text className="font-black text-white">Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Number Stepper ───────────────────────────────────────────────────────────

function NumberStepper({
  value,
  onChange,
  className,
  step = 1,
}: {
  value: string;
  onChange: (v: string) => void;
  className: string;
  step?: number;
}) {
  const num = Number(value) || 0;
  return (
    <View className="flex-row items-center gap-3">
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange(String(Math.max(0, num - step)));
        }}
        className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Ionicons name="remove" size={20} color="#64748b" />
      </TouchableOpacity>
      <TextInput
        className={`flex-1 text-center ${className}`}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        placeholder="0"
        placeholderTextColor="#94a3b8"
      />
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange(String(num + step));
        }}
        className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Ionicons name="add" size={20} color="#64748b" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({
  type,
  todayLogs,
  onPress,
  isDark,
}: {
  type: ActivityType;
  todayLogs: TrackerLog[];
  onPress: () => void;
  isDark: boolean;
}) {
  const meta = ACTIVITY_META[type];
  const total = aggregateToday(todayLogs, type);
  const hasEntries = todayLogs.some((l) => l.activity_type === type);
  const entryCount = todayLogs.filter((l) => l.activity_type === type).length;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="mb-3 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
      <View className="flex-row items-center gap-4 p-4">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: hasEntries ? `${meta.color}20` : isDark ? '#1e293b' : '#f8fafc',
          }}>
          <Ionicons
            name={meta.icon as any}
            size={22}
            color={hasEntries ? meta.color : isDark ? '#475569' : '#94a3b8'}
          />
        </View>
        <View className="flex-1">
          <Text className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {meta.label}
          </Text>
          {hasEntries ? (
            <Text style={{ color: meta.color }} className="text-xs font-semibold">
              {total > 0 ? `${total} ${meta.unit}` : `${entryCount} kayıt`}
              {entryCount > 1 ? ` · ${entryCount} giriş` : ''}
            </Text>
          ) : (
            <Text className="text-xs text-slate-400 dark:text-slate-600">Henüz kayıt yok</Text>
          )}
        </View>
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{
            backgroundColor: hasEntries ? `${meta.color}15` : isDark ? '#1e293b' : '#f1f5f9',
          }}>
          <Ionicons
            name="add"
            size={18}
            color={hasEntries ? meta.color : isDark ? '#475569' : '#94a3b8'}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Weekly Stats View ────────────────────────────────────────────────────────

function WeeklyView({ isDark }: { isDark: boolean }) {
  const { weeklyStats } = useTrackerStore();

  if (!weeklyStats)
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-slate-400">Veriler yükleniyor...</Text>
      </View>
    );

  const DAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const types = Object.keys(ACTIVITY_META) as ActivityType[];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}>
      {/* Weekly Grid */}
      <View
        className={`mx-4 mb-4 rounded-3xl border p-5 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
        <Text className={`mb-4 font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Son 7 Gün
        </Text>
        <View className="flex-row justify-between">
          {weeklyStats.days.map((day, i) => {
            const d = new Date(day.date);
            const hasAny = Object.keys(day.activities).length > 0;
            const actCount = Object.keys(day.activities).length;
            return (
              <View key={i} className="items-center gap-1.5">
                <View
                  className={`h-10 w-10 items-center justify-center rounded-2xl ${hasAny ? 'bg-teal-500/[12%]' : isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  {hasAny ? (
                    <Text className="text-xs font-black text-teal-500">{actCount}</Text>
                  ) : (
                    <Text className="text-[10px] text-slate-400">—</Text>
                  )}
                </View>
                <Text
                  className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {DAYS_TR[d.getDay()]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Per-activity totals */}
      <View
        className={`mx-4 mb-4 rounded-3xl border p-5 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
        <Text className={`mb-4 font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Haftalık Özet
        </Text>
        {types.map((type) => {
          const meta = ACTIVITY_META[type];
          const total = weeklyStats.totals[type] ?? 0;
          if (total === 0) return null;
          return (
            <Animated.View
              key={type}
              entering={FadeInDown.duration(300)}
              className="mb-3 flex-row items-center gap-3">
              <View
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: meta.bgColor }}>
                <Ionicons name={meta.icon as any} size={16} color={meta.color} />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {meta.label}
                </Text>
              </View>
              <Text className="text-base font-black" style={{ color: meta.color }}>
                {total}
                {meta.unit ? ` ${meta.unit}` : ''}
              </Text>
            </Animated.View>
          );
        })}
        {Object.keys(weeklyStats.totals).length === 0 && (
          <Text className="text-sm text-slate-400">Bu hafta henüz kayıt yok.</Text>
        )}
      </View>

      {/* Daily breakdown */}
      {weeklyStats.days
        .slice()
        .reverse()
        .map((day, i) => {
          if (Object.keys(day.activities).length === 0) return null;
          const d = new Date(day.date);
          return (
            <View
              key={i}
              className={`mx-4 mb-3 rounded-3xl border p-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
              <Text
                className={`mb-3 text-xs font-black uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </Text>
              {(Object.entries(day.activities) as [ActivityType, any][]).map(([type, data]) => {
                const meta = ACTIVITY_META[type];
                if (!meta) return null;
                return (
                  <View key={type} className="mb-1.5 flex-row items-center gap-2">
                    <Ionicons name={meta.icon as any} size={14} color={meta.color} />
                    <Text
                      className={`flex-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {meta.label}
                    </Text>
                    <Text className="text-sm font-bold" style={{ color: meta.color }}>
                      {data.entry_count} giriş
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
    </ScrollView>
  );
}

// ─── Monthly Stats View ───────────────────────────────────────────────────────

function MonthlyView({ isDark }: { isDark: boolean }) {
  const { monthlyStats, fetchMonthlyStats } = useTrackerStore();
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);

  const MONTHS_TR = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];

  const navigate = (dir: -1 | 1) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
    fetchMonthlyStats(y, m);
  };

  const types = Object.keys(ACTIVITY_META) as ActivityType[];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}>
      {/* Month navigator */}
      <View
        className={`mx-4 mb-4 flex-row items-center justify-between rounded-3xl border px-5 py-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
        <TouchableOpacity
          onPress={() => navigate(-1)}
          className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
          <Ionicons name="chevron-back" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>
        <Text className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {MONTHS_TR[viewMonth - 1]} {viewYear}
        </Text>
        <TouchableOpacity
          onPress={() => navigate(1)}
          className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
          <Ionicons name="chevron-forward" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>
      </View>

      {/* Summary cards */}
      {monthlyStats && (
        <>
          <View className="mx-4 mb-4 flex-row gap-3">
            <View
              className={`flex-1 items-center rounded-3xl border py-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
              <Text className="text-2xl font-black text-teal-500">{monthlyStats.active_days}</Text>
              <Text
                className={`mt-0.5 text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Aktif Gün
              </Text>
            </View>
            <View
              className={`flex-1 items-center rounded-3xl border py-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
              <Text className="text-2xl font-black text-indigo-500">
                {Object.values(monthlyStats.totals).reduce((s, v) => s + v, 0)}
              </Text>
              <Text
                className={`mt-0.5 text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Toplam Kayıt
              </Text>
            </View>
          </View>

          {/* Per-activity totals */}
          <View
            className={`mx-4 mb-4 rounded-3xl border p-5 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
            <Text className={`mb-4 font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Aylık Toplam
            </Text>
            {types.map((type) => {
              const meta = ACTIVITY_META[type];
              const total = monthlyStats.totals[type] ?? 0;
              return (
                <View key={type} className="mb-4">
                  <View className="mb-1.5 flex-row items-center gap-2">
                    <Ionicons name={meta.icon as any} size={14} color={meta.color} />
                    <Text
                      className={`flex-1 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {meta.label}
                    </Text>
                    <Text className="text-sm font-black" style={{ color: meta.color }}>
                      {total}
                      {meta.unit ? ` ${meta.unit}` : ''}
                    </Text>
                  </View>
                  {/* Mini progress bar relative to 30-day "ideal" */}
                  <View className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                    <View
                      className="h-1.5 rounded-full"
                      style={{
                        backgroundColor: meta.color,
                        width: `${Math.min(100, (total / Math.max(1, total + 1)) * 100)}%`,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Heatmap – active days in month grid */}
          <MonthHeatmap
            year={viewYear}
            month={viewMonth}
            daily={monthlyStats.daily}
            isDark={isDark}
          />
        </>
      )}
    </ScrollView>
  );
}

function MonthHeatmap({
  year,
  month,
  daily,
  isDark,
}: {
  year: number;
  month: number;
  daily: Record<string, any>;
  isDark: boolean;
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const DAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const cells: (number | null)[] = Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View
      className={`mx-4 mb-4 rounded-3xl border p-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
      <Text className={`mb-3 font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Takvim</Text>
      <View className="mb-2 flex-row">
        {DAYS_TR.map((d) => (
          <View key={d} className="flex-1 items-center">
            <Text
              className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {d}
            </Text>
          </View>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} className="mb-1 flex-row">
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (!day) return <View key={col} style={{ flex: 1, height: 32 }} />;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasActivity = !!daily[dateStr];
            const actCount = hasActivity ? Object.keys(daily[dateStr]).length : 0;
            const today = new Date();
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() + 1 === month &&
              today.getDate() === day;
            return (
              <View key={col} className="h-8 flex-1 items-center justify-center">
                <View
                  className={`h-7 w-7 items-center justify-center rounded-xl ${isToday ? 'border-2 border-teal-500' : ''}`}
                  style={
                    hasActivity ? { backgroundColor: '#14b8a6' + (actCount >= 3 ? '' : '60') } : {}
                  }>
                  <Text
                    className={`text-[11px] font-bold ${hasActivity ? 'text-white' : isToday ? 'text-teal-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {day}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TrackerScreen() {
  const { isAuthenticated } = useAuthStore();
  const { todayLogs, fetchTodayLogs, fetchWeeklyStats, fetchMonthlyStats, logActivity, deleteLog } =
    useTrackerStore();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('Bugün');
  const [modalType, setModalType] = useState<ActivityType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([fetchTodayLogs(), fetchWeeklyStats(), fetchMonthlyStats()]);
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  useEffect(() => {
    const types = [...new Set(todayLogs.map((l) => l.activity_type))];
    liveActivityService.updateAmelData({
      types,
      totalCount: todayLogs.length,
      date: new Date().toISOString().slice(0, 10),
    });
  }, [todayLogs]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  const openModal = (type: ActivityType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalType(type);
  };

  const handleLogSubmit = async (value: Record<string, any>, notes?: string) => {
    if (!modalType) return;
    try {
      await logActivity(modalType, value, notes);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalType(null);
    } catch {
      Alert.alert('Hata', 'Kayıt eklenirken bir sorun oluştu.');
    }
  };

  const handleDelete = (log: TrackerLog) => {
    Alert.alert('Kaydı Sil', 'Bu kaydı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteLog(log.id);
        },
      },
    ]);
  };

  const types = Object.keys(ACTIVITY_META) as ActivityType[];

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Tab Selector */}
      <View
        className={`mx-4 mt-3 flex-row rounded-2xl p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
            className={`flex-1 items-center rounded-xl py-2.5 ${activeTab === tab ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}>
            <Text
              className={`text-sm font-black ${activeTab === tab ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TODAY TAB ── */}
      {activeTab === 'Bugün' && (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#14b8a6" />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16, paddingTop: 16 }}>
          {/* Date header */}
          <Animated.View entering={FadeIn.duration(300)} className="mb-4">
            <Text
              className={`text-lg font-black capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatTurkishDate()}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {todayLogs.length} kayıt · {new Set(todayLogs.map((l) => l.activity_type)).size}{' '}
              farklı aktivite
            </Text>
          </Animated.View>

          {/* Activity cards */}
          {types.map((type, i) => (
            <Animated.View key={type} entering={FadeInDown.delay(i * 40).duration(300)}>
              <ActivityCard
                type={type}
                todayLogs={todayLogs}
                onPress={() => openModal(type)}
                isDark={isDark}
              />
            </Animated.View>
          ))}

          {/* Today's log list */}
          {todayLogs.length > 0 && (
            <View
              className={`mt-2 rounded-3xl border p-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
              <Text className={`mb-3 font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bugünkü Kayıtlar
              </Text>
              {todayLogs.map((log, i) => {
                const meta = ACTIVITY_META[log.activity_type];
                if (!meta) return null;
                return (
                  <Animated.View
                    key={log.id}
                    entering={ZoomIn.delay(i * 30)}
                    className="mb-2 flex-row items-center gap-3">
                    <View
                      className="h-8 w-8 items-center justify-center rounded-xl"
                      style={{ backgroundColor: meta.bgColor }}>
                      <Ionicons name={meta.icon as any} size={14} color={meta.color} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {meta.label}
                      </Text>
                      <Text className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {getValueLabel(log)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(log)}
                      className="h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Ionicons
                        name="trash-outline"
                        size={13}
                        color={isDark ? '#64748b' : '#94a3b8'}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── WEEKLY TAB ── */}
      {activeTab === 'Haftalık' && <WeeklyView isDark={isDark} />}

      {/* ── MONTHLY TAB ── */}
      {activeTab === 'Aylık' && <MonthlyView isDark={isDark} />}

      {/* Log Form Modal */}
      <Modal
        visible={!!modalType}
        animationType="slide"
        transparent
        onRequestClose={() => setModalType(null)}>
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity
            className="absolute inset-0 bg-black/50"
            activeOpacity={1}
            onPress={() => setModalType(null)}
          />
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            {modalType && (
              <LogForm
                type={modalType}
                onSubmit={handleLogSubmit}
                onClose={() => setModalType(null)}
                isDark={isDark}
              />
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
