import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { gamificationApi } from '@/modules/gamification/gamification.api';
import { toast } from '@/components/feedback/Toast';
import type { HomeStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const { width, height } = Dimensions.get('window');

type WrapData = {
  year: number;
  prayers: {
    total: number;
    kaza: number;
    active_days: number;
    top_month?: { name: string; count: number } | null;
    top_weekday?: { name: string; count: number } | null;
    by_time: { prayer_time: string; label: string; count: number }[];
  };
  streaks: { highest: number; total_points: number };
  tracker: {
    quran_pages: number;
    dhikr_count: number;
    fasting_days: number;
    sadaka: number;
    dua_minutes: number;
    ayet_new: number;
  };
  hifz: { memorized_surahs: number };
  kaza_completed: number;
};

// ─── Slide bg gradients (CSS-style) ──────────────────────────────────────────

const SCENES = [
  { id: 'hello',    bg: ['#0c4a6e', '#0e7490'] }, // sky/teal
  { id: 'prayers',  bg: ['#065f46', '#10b981'] }, // emerald
  { id: 'days',     bg: ['#7c2d12', '#f59e0b'] }, // amber
  { id: 'top',      bg: ['#581c87', '#a855f7'] }, // purple
  { id: 'streak',   bg: ['#7f1d1d', '#ef4444'] }, // red
  { id: 'kuran',    bg: ['#1e3a8a', '#3b82f6'] }, // blue
  { id: 'tracker',  bg: ['#134e4a', '#0d9488'] }, // teal
  { id: 'finale',   bg: ['#0f172a', '#1e293b'] }, // slate
] as const;

// ─── Floating background dots ────────────────────────────────────────────────

function FloatingOrbs() {
  const a = useSharedValue(0);
  useEffect(() => {
    a.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -20 + a.value * 40 }, { scale: 1 + a.value * 0.15 }],
    opacity: 0.15 + a.value * 0.2,
  }));
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: -120,
            right: -100,
            width: 320,
            height: 320,
            borderRadius: 160,
            backgroundColor: '#ffffff',
          },
          aStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 260,
            height: 260,
            borderRadius: 130,
            backgroundColor: '#ffffff',
          },
          aStyle,
        ]}
      />
    </>
  );
}

// ─── Scene templates ─────────────────────────────────────────────────────────

function Hero({
  topLabel,
  big,
  subLine,
  bottomLabel,
}: {
  topLabel: string;
  big: string;
  subLine?: string;
  bottomLabel?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Animated.View entering={FadeInUp.delay(120).duration(500)}>
        <Text className="mb-4 text-center text-[11px] font-black uppercase tracking-[4px] text-white/65">
          {topLabel}
        </Text>
      </Animated.View>
      <Animated.View entering={ZoomIn.delay(220).duration(600)}>
        <Text
          className="text-center text-[88px] font-black leading-none text-white"
          style={{ letterSpacing: -2 }}>
          {big}
        </Text>
      </Animated.View>
      {subLine && (
        <Animated.View entering={FadeInUp.delay(420).duration(500)}>
          <Text className="mt-4 text-center text-xl font-bold text-white/90">{subLine}</Text>
        </Animated.View>
      )}
      {bottomLabel && (
        <Animated.View entering={FadeIn.delay(620).duration(500)}>
          <Text className="mt-2 max-w-[280px] text-center text-sm font-medium text-white/65">
            {bottomLabel}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function WrappedScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WrapData | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await gamificationApi.getYearlyWrap();
        const wrap = res.data?.data;
        setData(wrap);

        // AI anlatısını arka planda getir (kritik değil, sessizce geç).
        if (wrap) {
          gamificationApi
            .getYearlyNarrative({
              year: wrap.year,
              totalPrayers: wrap.prayers?.total ?? 0,
              activeDays: wrap.prayers?.active_days ?? 0,
              highestStreak: wrap.streaks?.highest ?? 0,
              topMonth: wrap.prayers?.top_month?.name ?? null,
              quranPages: wrap.tracker?.quran_pages ?? 0,
              memorizedSurahs: wrap.hifz?.memorized_surahs ?? 0,
            })
            .then((r) => setNarrative(r.data?.data?.message ?? null))
            .catch(() => {});
        }
      } catch {
        toast.error('Hata', 'Yıllık özet alınamadı.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const scenes = data ? buildScenes(data, narrative) : [];

  // Auto-advance every 5s
  useEffect(() => {
    if (loading || scenes.length === 0) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      if (index < scenes.length - 1) {
        setIndex((i) => i + 1);
        Haptics.selectionAsync();
      }
    }, 5000);
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, [index, loading, scenes.length]);

  const handleTap = useCallback(
    (side: 'left' | 'right') => {
      Haptics.selectionAsync();
      if (side === 'left' && index > 0) setIndex((i) => i - 1);
      else if (side === 'right' && index < scenes.length - 1) setIndex((i) => i + 1);
    },
    [index, scenes.length],
  );

  const handleShare = async () => {
    if (!data) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const msg = [
      `🌙 Salah ${data.year} Özetim`,
      ``,
      `🕌 ${data.prayers.total} namaz · ${data.prayers.active_days} aktif gün`,
      data.tracker.quran_pages > 0 ? `📖 ${data.tracker.quran_pages} sayfa Kuran` : '',
      data.tracker.dhikr_count > 0 ? `📿 ${data.tracker.dhikr_count.toLocaleString('tr-TR')} zikir` : '',
      data.streaks.highest > 0 ? `🔥 En uzun seri: ${data.streaks.highest} gün` : '',
      '',
      'salah-app.com',
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await Share.share({ message: msg });
    } catch {}
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text className="mt-4 text-sm font-semibold text-slate-400">Yıl özetiniz hazırlanıyor…</Text>
      </View>
    );
  }

  if (!data || scenes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 px-8">
        <StatusBar barStyle="light-content" />
        <Ionicons name="hourglass-outline" size={48} color="#475569" />
        <Text className="mt-4 text-center text-base font-bold text-slate-300">
          Bu yıl için yeterli veri yok
        </Text>
        <Text className="mt-2 text-center text-sm text-slate-500">
          Namaz takibi yapmaya başla, yıl sonu özetin burada olacak.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-6 rounded-2xl bg-slate-800 px-6 py-3">
          <Text className="text-sm font-bold text-white">Geri</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scene = scenes[index]!;
  const palette = SCENES[scene.theme]!;
  const isFinale = index === scenes.length - 1;

  return (
    <View className="flex-1" style={{ backgroundColor: palette.bg[1] }}>
      <StatusBar barStyle="light-content" />

      {/* Gradient mock — two stacked colored layers */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: palette.bg[0],
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: height * 0.4, left: 0, right: 0, bottom: 0,
          backgroundColor: palette.bg[1],
          opacity: 0.85,
        }}
      />

      <FloatingOrbs />

      {/* Progress bars */}
      <View
        className="flex-row gap-1 px-3"
        style={{ paddingTop: insets.top + 12 }}>
        {scenes.map((_, i) => (
          <View key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <View
              className="h-full bg-white"
              style={{ width: i < index ? '100%' : i === index ? '100%' : '0%' }}
            />
          </View>
        ))}
      </View>

      {/* Close button */}
      <View style={{ position: 'absolute', top: insets.top + 24, right: 16, zIndex: 50 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="h-9 w-9 items-center justify-center rounded-full bg-black/30">
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tap zones — invisible, cover left/right half */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => handleTap('left')}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: width / 3, zIndex: 5 }}
      />
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => handleTap('right')}
        style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: width / 3, zIndex: 5 }}
      />

      {/* Scene content */}
      <Animated.View
        key={index}
        entering={FadeIn.duration(350)}
        className="flex-1"
        style={{ zIndex: 1 }}>
        {scene.render()}
      </Animated.View>

      {/* Bottom action — visible only on finale */}
      {isFinale && (
        <Animated.View
          entering={FadeInUp.delay(800).duration(500)}
          style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24, zIndex: 10 }}>
          <TouchableOpacity
            onPress={handleShare}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-white py-4"
            activeOpacity={0.85}>
            <Ionicons name="share-outline" size={18} color="#0f172a" />
            <Text className="text-sm font-black text-slate-900">Özetimi Paylaş</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Scene builder ───────────────────────────────────────────────────────────

function buildScenes(
  d: WrapData,
  narrative: string | null,
): { theme: number; render: () => React.ReactElement }[] {
  const list: { theme: number; render: () => React.ReactElement }[] = [];

  // 0 — Hello
  list.push({
    theme: 0,
    render: () => (
      <Hero
        topLabel={`${d.year} özetin`}
        big="🌙"
        subLine="Bu yıl ne yaptın?"
        bottomLabel="Birkaç saniye sürer · İlerlemek için dokun"
      />
    ),
  });

  // 1 — Total prayers
  if (d.prayers.total > 0) {
    list.push({
      theme: 1,
      render: () => (
        <Hero
          topLabel="Toplam Namaz"
          big={d.prayers.total.toLocaleString('tr-TR')}
          subLine={`vakit kıldın`}
          bottomLabel={
            d.prayers.kaza > 0
              ? `+${d.prayers.kaza} kaza ile birlikte`
              : 'Her birinin karşılığını Rabbim versin'
          }
        />
      ),
    });
  }

  // 2 — Active days
  if (d.prayers.active_days > 0) {
    list.push({
      theme: 2,
      render: () => (
        <Hero
          topLabel="Aktif Gün"
          big={d.prayers.active_days.toString()}
          subLine={`günde namaz kaydettin`}
          bottomLabel={`Yılın ${Math.round((d.prayers.active_days / 365) * 100)}'ında aktiftin`}
        />
      ),
    });
  }

  // 3 — Top month / weekday
  if (d.prayers.top_month) {
    list.push({
      theme: 3,
      render: () => (
        <Hero
          topLabel="En Aktif Ay"
          big={d.prayers.top_month!.name}
          subLine={`${d.prayers.top_month!.count} namaz`}
          bottomLabel={
            d.prayers.top_weekday
              ? `En aktif günün: ${d.prayers.top_weekday.name}`
              : undefined
          }
        />
      ),
    });
  }

  // 4 — Streak
  if (d.streaks.highest > 0) {
    list.push({
      theme: 4,
      render: () => (
        <Hero
          topLabel="En Uzun Seri"
          big={d.streaks.highest.toString()}
          subLine="gün üst üste"
          bottomLabel={`Toplam ${d.streaks.total_points.toLocaleString('tr-TR')} puan kazandın`}
        />
      ),
    });
  }

  // 5 — Quran reading
  if (d.tracker.quran_pages > 0 || d.hifz.memorized_surahs > 0) {
    const bigLine = d.tracker.quran_pages > 0
      ? d.tracker.quran_pages.toLocaleString('tr-TR')
      : d.hifz.memorized_surahs.toString();
    const sub = d.tracker.quran_pages > 0 ? 'sayfa Kuran okudun' : 'sure ezberledin';
    list.push({
      theme: 5,
      render: () => (
        <Hero
          topLabel="Kuran"
          big={bigLine}
          subLine={sub}
          bottomLabel={
            d.hifz.memorized_surahs > 0 && d.tracker.quran_pages > 0
              ? `${d.hifz.memorized_surahs} sure ezberindeyken`
              : undefined
          }
        />
      ),
    });
  }

  // 6 — Tracker activities
  if (d.tracker.dhikr_count > 0 || d.tracker.fasting_days > 0 || d.tracker.dua_minutes > 0) {
    const big = d.tracker.dhikr_count > 0
      ? d.tracker.dhikr_count.toLocaleString('tr-TR')
      : d.tracker.fasting_days > 0
        ? d.tracker.fasting_days.toString()
        : d.tracker.dua_minutes.toString();
    const sub = d.tracker.dhikr_count > 0
      ? 'zikir çektin'
      : d.tracker.fasting_days > 0
        ? 'gün oruç tuttun'
        : 'dakika dua ettin';
    list.push({
      theme: 6,
      render: () => (
        <Hero
          topLabel="Diğer İbadetler"
          big={big}
          subLine={sub}
          bottomLabel={[
            d.tracker.fasting_days > 0 && `${d.tracker.fasting_days} gün oruç`,
            d.tracker.sadaka > 0 && `${d.tracker.sadaka.toLocaleString('tr-TR')}₺ sadaka`,
            d.tracker.dua_minutes > 0 && `${d.tracker.dua_minutes} dk dua`,
          ]
            .filter(Boolean)
            .join(' · ')}
        />
      ),
    });
  }

  // AI anlatısı — finale'den hemen önce (varsa)
  if (narrative) {
    list.push({
      theme: 6,
      render: () => (
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View entering={FadeInUp.duration(500)}>
            <Text className="text-center text-5xl">✨</Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <Text className="mt-6 text-center text-xs font-black uppercase tracking-widest text-white/50">
              Yılın Hikayesi
            </Text>
            <Text className="mt-4 max-w-[300px] text-center text-xl font-bold leading-8 text-white">
              {narrative}
            </Text>
          </Animated.View>
        </View>
      ),
    });
  }

  // 7 — Finale
  list.push({
    theme: 7,
    render: () => (
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View entering={ZoomIn.duration(600)}>
          <Text className="text-center text-7xl">🤲</Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Text className="mt-6 text-center text-3xl font-black text-white">
            {d.year} Yılı{'\n'}Hayırlı Olsun
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(500).duration(500)}>
          <Text className="mt-3 max-w-[280px] text-center text-base font-medium text-white/75">
            Rabbim ibadetlerini kabul etsin. Yeni yılda nice güzel anlar dileriz.
          </Text>
        </Animated.View>
      </View>
    ),
  });

  return list;
}
