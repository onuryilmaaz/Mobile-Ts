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

const BOOKMARKS_KEY = 'QURAN_BOOKMARKS';
const SURAH_CACHE_PREFIX = 'QURAN_SURAH_CACHE_';

type Props = NativeStackScreenProps<SurahsStackParamList, 'SurahDetail'>;

const RECITERS = [
  { id: 'ar.alafasy', label: 'Alafasy' },
  { id: 'ar.abdullahbasfar', label: 'Basfar' },
];

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

  const activeIdxRef = useRef(-1);
  const reciterIdxRef = useRef(0);
  const versesRef = useRef(verses);
  const durationRef = useRef(0);
  const barWidthRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => { versesRef.current = verses; }, [verses]);
  useEffect(() => { reciterIdxRef.current = reciterIdx; }, [reciterIdx]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  const setActiveBoth = useCallback((idx: number) => {
    activeIdxRef.current = idx;
    setActiveIdx(idx);
    onActiveVerseChange(idx);
  }, [onActiveVerseChange]);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
    return () => {
      isMountedRef.current = false;
      statusSubRef.current?.remove();
      soundRef.current?.remove();
    };
  }, []);

  const unload = () => {
    statusSubRef.current?.remove();
    statusSubRef.current = null;
    if (soundRef.current) {
      soundRef.current.remove();
      soundRef.current = null;
    }
  };

  const playVerseAt = async (idx: number) => {
    if (!isMountedRef.current) return;
    const vList = versesRef.current;

    if (idx >= vList.length || idx < 0) {
      await unload();
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
      if (!isMountedRef.current) return;

      const url = `https://cdn.islamic.network/quran/audio/128/${RECITERS[reciterIdxRef.current].id}/${vList[idx].id}.mp3`;
      const player = createAudioPlayer({ uri: url });

      statusSubRef.current = player.addListener('playbackStatusUpdate', (status) => {
        if (!isMountedRef.current || !status.isLoaded) return;
        setPosition((status.currentTime || 0) * 1000);
        setDuration((status.duration || 0) * 1000);
        if (status.didJustFinish) {
          playVerseAt(activeIdxRef.current + 1);
        }
      });

      player.play();
      if (!isMountedRef.current) { player.remove(); return; }
      soundRef.current = player;
      setPlayState('playing');
    } catch {
      if (isMountedRef.current) setPlayState('idle');
    }
  };

  // playVerseAt ref — useImperativeHandle her zaman güncel versiyonu çağırsın
  const playVerseAtRef = useRef(playVerseAt);
  useEffect(() => { playVerseAtRef.current = playVerseAt; });

  useImperativeHandle(ref, () => ({
    playFromIndex: (idx: number) => playVerseAtRef.current(idx),
  }), []);

  useEffect(() => {
    unload();
    if (!isMountedRef.current) return;
    setPlayState('idle');
    setActiveBoth(-1);
    setPosition(0);
    setDuration(0);
  }, [reciterIdx]);

  // Seek bar — PanResponder refs ile stale closure olmadan çalışır
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

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;
  const isActive = playState === 'playing' || playState === 'paused';

  return (
    <View className="mx-4 mb-4 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
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
            onLayout={(e) => { barWidthRef.current = e.nativeEvent.layout.width; }}
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

        {isActive && (
          <TouchableOpacity
            onPress={handleStop}
            className="ml-3 h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Ionicons name="stop" size={16} color={isDark ? '#94a3b8' : '#475569'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

export default function SurahDetailScreen({ route }: Props) {
  const { surahId, surahName } = route.params;
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [activeVerseIdx, setActiveVerseIdx] = useState(-1);
  const { isDark } = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const verseYPositions = useRef<number[]>([]);

  useEffect(() => {
    fetchVerses();
    AsyncStorage.getItem(BOOKMARKS_KEY).then((val) => {
      if (val) setBookmarks(new Set(JSON.parse(val)));
    });
  }, []);

  useEffect(() => {
    if (activeVerseIdx < 0 || verseYPositions.current[activeVerseIdx] == null) return;
    const y = verseYPositions.current[activeVerseIdx];
    scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
  }, [activeVerseIdx]);

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

  const toggleBookmark = (verseKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(verseKey) ? next.delete(verseKey) : next.add(verseKey);
      AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]));
      return next;
    });
  };

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

          {verses.map((verse, index) => {
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
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                  }`}>
                  {isActive && (
                    <View className="absolute left-0 top-0 h-full w-1 rounded-l-3xl bg-teal-500" />
                  )}

                  <View
                    className={`flex-row items-center justify-between border-b px-6 py-3 ${
                      isActive
                        ? 'border-teal-200 bg-teal-100/60 dark:border-teal-500/30 dark:bg-teal-500/15'
                        : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                    }`}>
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full ${
                        isActive ? 'bg-teal-500' : 'bg-teal-600 dark:bg-teal-500'
                      }`}>
                      <Text className="text-xs font-black text-white">{verse.verse_number}</Text>
                    </View>
                    <View className="flex-row items-center gap-4">
                      <TouchableOpacity
                        onPress={() => toggleBookmark(`${surahId}:${verse.verse_number}`)}>
                        <Ionicons
                          name={
                            bookmarks.has(`${surahId}:${verse.verse_number}`)
                              ? 'bookmark'
                              : 'bookmark-outline'
                          }
                          size={18}
                          color={
                            bookmarks.has(`${surahId}:${verse.verse_number}`)
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
