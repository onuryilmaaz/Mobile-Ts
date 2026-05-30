/* eslint-disable no-unused-expressions */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Platform,
  Share,
  TouchableOpacity,
  PanResponder,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SurahsStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { Verse } from '@/services/quran.service';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer as ExpoAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuranStore } from '@/store/quran.store';

const SURAH_CACHE_PREFIX = 'QURAN_SURAH_CACHE_';

type Props = NativeStackScreenProps<SurahsStackParamList, 'SurahDetail'>;

const RECITERS = [
  { id: 'ar.alafasy', label: 'Alafasy' },
  { id: 'ar.abdullahbasfar', label: 'Basfar' },
];

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];
type RepeatMode = 'off' | 'single' | 'surah';

type AudioPlayerRef = {
  playFromIndex: (idx: number) => void;
};

const AudioPlayer = React.forwardRef<
  AudioPlayerRef,
  { verses: Verse[]; onActiveVerseChange: (idx: number) => void }
>(function AudioPlayer({ verses, onActiveVerseChange }, ref) {
  const { isDark } = useTheme();
  const soundRef = useRef<ExpoAudioPlayer | null>(null);
  const statusSubRef = useRef<{ remove: () => void } | null>(null);
  const [playState, setPlayState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const [reciterIdx, setReciterIdx] = useState(0);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [expanded, setExpanded] = useState(false);

  const activeIdxRef = useRef(-1);
  const reciterIdxRef = useRef(0);
  const versesRef = useRef(verses);
  const durationRef = useRef(0);
  const barWidthRef = useRef(0);
  const isMountedRef = useRef(true);
  const playIdRef = useRef(0);
  const speedRef = useRef(1.0);
  const repeatModeRef = useRef<RepeatMode>('off');

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);
  useEffect(() => {
    reciterIdxRef.current = reciterIdx;
  }, [reciterIdx]);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);
  useEffect(() => {
    speedRef.current = speed;
    // Apply speed to live player
    if (soundRef.current) {
      try { (soundRef.current as any).playbackRate = speed; } catch {}
    }
  }, [speed]);
  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  const setActiveBoth = useCallback(
    (idx: number) => {
      activeIdxRef.current = idx;
      setActiveIdx(idx);
      onActiveVerseChange(idx);
    },
    [onActiveVerseChange]
  );

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true } as any);
    return () => {
      isMountedRef.current = false;
      statusSubRef.current?.remove();
      try { soundRef.current?.pause(); } catch {}
      soundRef.current?.remove();
    };
  }, []);

  const unload = () => {
    statusSubRef.current?.remove();
    statusSubRef.current = null;
    if (soundRef.current) {
      try { soundRef.current.pause(); } catch {}
      soundRef.current.remove();
      soundRef.current = null;
    }
  };

  const playVerseAt = async (idx: number) => {
    if (!isMountedRef.current) return;
    const myId = ++playIdRef.current;
    const vList = versesRef.current;

    if (idx >= vList.length || idx < 0) {
      unload();
      if (!isMountedRef.current) return;
      setPlayState('idle');
      setActiveBoth(-1);
      setPosition(0);
      setDuration(0);
      return;
    }

    setPlayState('loading');
    setPosition(0);
    setDuration(0);
    setActiveBoth(idx);

    try {
      unload();
      if (!isMountedRef.current || myId !== playIdRef.current) return;

      const url = `https://cdn.islamic.network/quran/audio/128/${RECITERS[reciterIdxRef.current].id}/${vList[idx].id}.mp3`;
      const player = createAudioPlayer({ uri: url });

      statusSubRef.current = player.addListener('playbackStatusUpdate', (status) => {
        if (!isMountedRef.current || myId !== playIdRef.current || !status.isLoaded) return;
        setPosition((status.currentTime || 0) * 1000);
        setDuration((status.duration || 0) * 1000);
        if (status.didJustFinish) {
          const mode = repeatModeRef.current;
          const current = activeIdxRef.current;
          const total = versesRef.current.length;
          if (mode === 'single') {
            playVerseAt(current);
          } else if (mode === 'surah' && current >= total - 1) {
            playVerseAt(0);
          } else {
            playVerseAt(current + 1);
          }
        }
      });

      player.play();
      try { (player as any).playbackRate = speedRef.current; } catch {}
      if (!isMountedRef.current || myId !== playIdRef.current) {
        player.remove();
        return;
      }
      soundRef.current = player;
      setPlayState('playing');
    } catch {
      if (isMountedRef.current) setPlayState('idle');
    }
  };

  // playVerseAt ref — useImperativeHandle her zaman güncel versiyonu çağırsın
  const playVerseAtRef = useRef(playVerseAt);
  useEffect(() => {
    playVerseAtRef.current = playVerseAt;
  });

  useImperativeHandle(
    ref,
    () => ({
      playFromIndex: (idx: number) => playVerseAtRef.current(idx),
    }),
    []
  );

  useEffect(() => {
    unload();
    if (!isMountedRef.current) return;
    setPlayState('idle');
    setActiveBoth(-1);
    setPosition(0);
    setDuration(0);
  }, [reciterIdx]);

  const seekBarResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => durationRef.current > 0,
      onMoveShouldSetPanResponder: () => durationRef.current > 0,
      onPanResponderGrant: (evt) => {
        const ratio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / barWidthRef.current));
        const ms = ratio * durationRef.current;
        setPosition(ms);
        soundRef.current?.seekTo(ms / 1000);
      },
      onPanResponderMove: (evt) => {
        const ratio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / barWidthRef.current));
        const ms = ratio * durationRef.current;
        setPosition(ms);
        soundRef.current?.seekTo(ms / 1000);
      },
    })
  ).current;

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playState === 'idle') {
      playVerseAt(0);
    } else if (playState === 'playing') {
      soundRef.current?.pause();
      setPlayState('paused');
    } else if (playState === 'paused') {
      soundRef.current?.play();
      setPlayState('playing');
    }
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    unload();
    setPlayState('idle');
    setActiveBoth(-1);
    setPosition(0);
    setDuration(0);
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = Math.max(0, (activeIdxRef.current >= 0 ? activeIdxRef.current : 0) - 1);
    playVerseAt(target);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = Math.min(
      versesRef.current.length - 1,
      (activeIdxRef.current >= 0 ? activeIdxRef.current : 0) + 1,
    );
    playVerseAt(target);
  };

  const cycleRepeat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next: RepeatMode = repeatMode === 'off' ? 'single' : repeatMode === 'single' ? 'surah' : 'off';
    setRepeatMode(next);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;
  const isActive = playState === 'playing' || playState === 'paused';

  return (
    <View className="mx-4 mb-4 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
      <View className="flex-row items-center p-4">
        <TouchableOpacity
          onPress={handlePlayPause}
          className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-teal-600 dark:bg-teal-500"
          activeOpacity={0.8}>
          {playState === 'loading' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons
              name={playState === 'playing' ? 'pause' : 'play'}
              size={22}
              color="#fff"
              style={{ marginLeft: playState === 'playing' ? 0 : 2 }}
            />
          )}
        </TouchableOpacity>

        <View className="flex-1">
          <View className="mb-2 flex-row gap-1.5">
            {RECITERS.map((r, i) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setReciterIdx(i);
                }}
                className={`rounded-lg border px-2.5 py-1 ${
                  reciterIdx === i
                    ? 'border-teal-500 bg-teal-50 dark:border-teal-500/60 dark:bg-teal-500/15'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                }`}>
                <Text
                  className={`text-[11px] font-bold ${
                    reciterIdx === i
                      ? 'text-teal-700 dark:text-teal-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Seek bar — geniş dokunma alanı için py-3 wrapper */}
          <View
            onLayout={(e) => {
              barWidthRef.current = e.nativeEvent.layout.width;
            }}
            className="py-3"
            {...seekBarResponder.panHandlers}>
            <View className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <View
                className="h-full rounded-full bg-teal-500"
                style={{ width: `${progress * 100}%` }}
              />
            </View>
          </View>

          {activeIdx >= 0 ? (
            <Text className="text-[10px] text-slate-400">
              {activeIdx + 1}. ayet
              {duration > 0 ? ` · ${formatTime(position)} / ${formatTime(duration)}` : ''}
            </Text>
          ) : (
            <Text className="text-[10px] text-slate-400">{verses.length} ayet</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExpanded((v) => !v); }}
          className="ml-3 h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Ionicons name={expanded ? 'chevron-up' : 'options-outline'} size={16} color={isDark ? '#94a3b8' : '#475569'} />
        </TouchableOpacity>
      </View>

      {/* Expanded controls */}
      {expanded && (
        <View className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          {/* Transport controls */}
          <View className="flex-row items-center justify-center gap-4 pb-3">
            <TouchableOpacity
              onPress={handlePrev}
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Ionicons name="play-skip-back" size={16} color={isDark ? '#cbd5e1' : '#475569'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={cycleRepeat}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  repeatMode === 'off'
                    ? isDark ? '#1e293b' : '#f1f5f9'
                    : repeatMode === 'single' ? '#14b8a620' : '#a78bfa20',
              }}>
              <View>
                <Ionicons
                  name={repeatMode === 'single' ? 'repeat' : repeatMode === 'surah' ? 'repeat' : 'repeat-outline'}
                  size={16}
                  color={repeatMode === 'off' ? (isDark ? '#94a3b8' : '#475569') : repeatMode === 'single' ? '#14b8a6' : '#a78bfa'}
                />
                {repeatMode === 'single' && (
                  <View className="absolute -bottom-1 -right-1 rounded-full bg-teal-500 px-1">
                    <Text className="text-[7px] font-black text-white">1</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleStop}
              disabled={!isActive}
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
              style={{ opacity: isActive ? 1 : 0.4 }}>
              <Ionicons name="stop" size={16} color={isDark ? '#94a3b8' : '#475569'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Ionicons name="play-skip-forward" size={16} color={isDark ? '#cbd5e1' : '#475569'} />
            </TouchableOpacity>
          </View>

          {/* Speed control */}
          <View>
            <Text className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Hız
            </Text>
            <View className="flex-row gap-2">
              {SPEEDS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSpeed(s); }}
                  className={`flex-1 items-center rounded-xl border px-2 py-1.5 ${
                    speed === s
                      ? 'border-teal-500 bg-teal-50 dark:border-teal-500/60 dark:bg-teal-500/15'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                  }`}>
                  <Text
                    className={`text-[11px] font-black ${
                      speed === s ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                    {s === 1.0 ? '1x' : `${s}x`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {repeatMode !== 'off' && (
            <View className="mt-3 flex-row items-center gap-1.5 self-start rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
              <Ionicons
                name="repeat"
                size={11}
                color={repeatMode === 'single' ? '#14b8a6' : '#a78bfa'}
              />
              <Text
                className="text-[10px] font-bold"
                style={{ color: repeatMode === 'single' ? '#14b8a6' : '#a78bfa' }}>
                {repeatMode === 'single' ? 'Tek ayet tekrarı' : 'Sure tekrarı'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

export default function SurahDetailScreen({ route }: Props) {
  const { surahId, surahName, focusVerse } = route.params;
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVerseIdx, setActiveVerseIdx] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const { isDark } = useTheme();
  const { addBookmark, removeBookmark, isBookmarked, setLastRead, load: loadQuran } = useQuranStore();

  const scrollViewRef = useRef<ScrollView>(null);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const verseYPositions = useRef<number[]>([]);
  const focusedRef = useRef(false);
  const lastReadSavedRef = useRef(false);

  useEffect(() => {
    fetchVerses();
    loadQuran();
  }, []);

  useEffect(() => {
    if (activeVerseIdx < 0 || verseYPositions.current[activeVerseIdx] == null) return;
    const y = verseYPositions.current[activeVerseIdx];
    scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
  }, [activeVerseIdx]);

  // Save last read once verses load (after a small delay so user sees the screen)
  useEffect(() => {
    if (verses.length === 0 || lastReadSavedRef.current) return;
    lastReadSavedRef.current = true;
    const targetVerse = focusVerse ?? 1;
    setLastRead({ surahId, surahName, verseNumber: targetVerse });
  }, [verses, focusVerse, surahId, surahName]);

  // Jump to focused verse after layout
  useEffect(() => {
    if (!focusVerse || verses.length === 0 || focusedRef.current) return;
    const idx = verses.findIndex((v) => v.verse_number === focusVerse);
    if (idx < 0) return;
    // Wait for onLayout positions to populate
    const t = setTimeout(() => {
      const y = verseYPositions.current[idx];
      if (y != null) {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
        focusedRef.current = true;
      }
    }, 400);
    return () => clearTimeout(t);
  }, [focusVerse, verses]);

  const fetchVerses = async () => {
    try {
      setLoading(true);
      const cacheKey = `${SURAH_CACHE_PREFIX}${surahId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setVerses(JSON.parse(cached));
        setLoading(false);
        return;
      }
      const response = await fetch(`https://api.acikkuran.com/surah/${surahId}`);
      const result = await response.json();
      const fetched: Verse[] = result.data.verses;
      setVerses(fetched);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(fetched));
    } catch (error) {
      console.error('Error fetching verses:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (verse: Verse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const id = `${surahId}:${verse.verse_number}`;
    if (isBookmarked(surahId, verse.verse_number)) {
      removeBookmark(id);
    } else {
      addBookmark({
        surahId,
        surahName,
        verseNumber: verse.verse_number,
        preview: verse.translation.text?.slice(0, 120),
      });
    }
  };

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/[âā]/g, 'a')
      .replace(/[îī]/g, 'i')
      .replace(/[ûū]/g, 'u')
      .replace(/[öô]/g, 'o')
      .replace(/[üû]/g, 'u')
      .replace(/[ş]/g, 's')
      .replace(/[ç]/g, 'c')
      .replace(/[ğ]/g, 'g');

  const displayedVerses = searchQuery.trim()
    ? verses.filter((v) => {
        const q = normalize(searchQuery.trim());
        return (
          v.verse_number.toString() === searchQuery.trim() ||
          normalize(v.translation?.text ?? '').includes(q) ||
          normalize(v.transcription ?? '').includes(q)
        );
      })
    : verses;

  const shareVerse = async (verse: Verse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${surahName} Suresi, ${verse.verse_number}. Ayet: \n\n"${verse.translation.text}"\n\n#SalahApp`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#14b8a6' : '#0f766e'} />
          <Text className="mt-4 text-base font-semibold text-slate-600 dark:text-slate-400">
            Ayetler yükleniyor...
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}>
          <AudioPlayer
            ref={audioPlayerRef}
            verses={verses}
            onActiveVerseChange={setActiveVerseIdx}
          />

          {/* Search bar */}
          <View className="mx-4 mb-4">
            {!searchVisible ? (
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSearchVisible(true); }}
                className="flex-row items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
                <Ionicons name="search" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">Ayet ara</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <Ionicons name="search" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  placeholder="Ayet metni, numara veya kelime"
                  placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                  className="flex-1 text-sm text-slate-900 dark:text-white"
                />
                <TouchableOpacity
                  onPress={() => { setSearchQuery(''); setSearchVisible(false); }}
                  hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={isDark ? '#475569' : '#94a3b8'} />
                </TouchableOpacity>
              </View>
            )}
            {searchQuery && (
              <Text className="ml-2 mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {displayedVerses.length} sonuç
              </Text>
            )}
          </View>

          {displayedVerses.length === 0 && searchQuery && (
            <View className="mx-4 items-center py-8">
              <Ionicons name="search-outline" size={32} color={isDark ? '#475569' : '#94a3b8'} />
              <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">Eşleşen ayet yok</Text>
            </View>
          )}

          {displayedVerses.map((verse) => {
            const index = verses.indexOf(verse);
            const isActive = index === activeVerseIdx;
            return (
              <TouchableOpacity
                key={verse.id}
                activeOpacity={0.88}
                onLayout={(e) => {
                  verseYPositions.current[index] = e.nativeEvent.layout.y;
                }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  audioPlayerRef.current?.playFromIndex(index);
                }}>
                <Animated.View
                  entering={FadeInUp.delay(index * 50).duration(400)}
                  className={`mx-4 mb-6 overflow-hidden rounded-3xl border shadow-sm shadow-black/5 dark:shadow-none ${
                    isActive
                      ? 'border-teal-500/60 bg-teal-50 dark:border-teal-500/40 dark:bg-teal-500/10'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
                  }`}>
                  {isActive && (
                    <View className="absolute left-0 top-0 h-full w-1 rounded-l-3xl bg-teal-500" />
                  )}

                  <View
                    className={`flex-row items-center justify-between border-b px-6 py-3 ${
                      isActive
                        ? 'border-teal-200 bg-teal-100/60 dark:border-teal-500/30 dark:bg-teal-500/15'
                        : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950'
                    }`}>
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full ${
                        isActive ? 'bg-teal-500' : 'bg-teal-600 dark:bg-teal-500'
                      }`}>
                      <Text className="text-xs font-black text-white">{verse.verse_number}</Text>
                    </View>
                    <View className="flex-row items-center gap-4">
                      <TouchableOpacity onPress={() => toggleBookmark(verse)}>
                        <Ionicons
                          name={isBookmarked(surahId, verse.verse_number) ? 'bookmark' : 'bookmark-outline'}
                          size={18}
                          color={
                            isBookmarked(surahId, verse.verse_number)
                              ? '#f59e0b'
                              : isDark
                                ? 'rgba(240,244,255,0.55)'
                                : '#475569'
                          }
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => shareVerse(verse)}>
                        <Ionicons
                          name="share-outline"
                          size={18}
                          color={isDark ? 'rgba(240,244,255,0.55)' : '#475569'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="px-4 py-1">
                    <Text
                      className={`mb-1 text-2xl text-slate-900 dark:text-white ${Platform.OS === 'ios' ? 'font-sans' : 'font-serif'}`}
                      style={{ lineHeight: 50 }}>
                      {verse.transcription}
                    </Text>
                    <Text
                      className={`mb-1 text-right text-xl text-slate-900 dark:text-white ${Platform.OS === 'ios' ? 'font-sans' : 'font-serif'}`}
                      style={{ lineHeight: 50 }}>
                      {verse.verse_simplified}
                    </Text>

                    <View className="my-2 h-[1px] w-full bg-slate-200 dark:bg-white/10" />

                    <Text
                      className={`text-base font-medium italic leading-7 ${
                        isActive
                          ? 'text-teal-700 dark:text-teal-300'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}>
                      {`"${verse.translation.text}"`}
                    </Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}
