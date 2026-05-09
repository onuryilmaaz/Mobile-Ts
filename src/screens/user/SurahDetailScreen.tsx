/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Platform, Share, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SurahsStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { Verse } from '@/services/quran.service';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = 'QURAN_BOOKMARKS';

type Props = NativeStackScreenProps<SurahsStackParamList, 'SurahDetail'>;

const RECITERS = [
  { id: 'ar.alafasy', label: 'Alafasy' },
  { id: 'ar.abdurrahmaansudais', label: 'Sudais' },
  { id: 'ar.abdullahbasfar', label: 'Basfar' },
];

function AudioPlayer({ surahId }: { surahId: number }) {
  const { isDark } = useTheme();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle');
  const [reciterIdx, setReciterIdx] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  useEffect(() => {
    if (status === 'playing' || status === 'paused') {
      stop();
    }
  }, [reciterIdx]);

  const getAudioUrl = () =>
    `https://cdn.islamic.network/quran/audio-surah/128/${RECITERS[reciterIdx].id}/${surahId}.mp3`;

  const onPlaybackStatus = useCallback((s: any) => {
    if (s.isLoaded) {
      setPosition(s.positionMillis || 0);
      setDuration(s.durationMillis || 0);
      if (s.didJustFinish) setStatus('idle');
    }
  }, []);

  const play = async () => {
    try {
      setStatus('loading');
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: getAudioUrl() },
        { shouldPlay: true },
        onPlaybackStatus
      );
      soundRef.current = sound;
      setStatus('playing');
    } catch {
      setStatus('error');
    }
  };

  const pause = async () => {
    await soundRef.current?.pauseAsync();
    setStatus('paused');
  };

  const resume = async () => {
    await soundRef.current?.playAsync();
    setStatus('playing');
  };

  const stop = async () => {
    await soundRef.current?.stopAsync();
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    setStatus('idle');
    setPosition(0);
    setDuration(0);
  };

  const handleMain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (status === 'idle' || status === 'error') play();
    else if (status === 'playing') pause();
    else if (status === 'paused') resume();
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View className="mx-4 mb-4 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center p-4">
        {/* Play/Pause */}
        <TouchableOpacity
          onPress={handleMain}
          className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-teal-600 dark:bg-teal-500"
          activeOpacity={0.8}>
          {status === 'loading' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons
              name={status === 'playing' ? 'pause' : 'play'}
              size={22}
              color="#fff"
              style={{ marginLeft: status === 'playing' ? 0 : 2 }}
            />
          )}
        </TouchableOpacity>

        <View className="flex-1">
          {/* Reciter selector */}
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

          {/* Progress bar */}
          <View className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <View
              className="h-full rounded-full bg-teal-500"
              style={{ width: `${progress * 100}%` }}
            />
          </View>

          {/* Time */}
          {duration > 0 && (
            <View className="mt-1 flex-row justify-between">
              <Text className="text-[10px] text-slate-400">{formatTime(position)}</Text>
              <Text className="text-[10px] text-slate-400">{formatTime(duration)}</Text>
            </View>
          )}
          {status === 'error' && (
            <Text className="mt-1 text-[10px] text-red-500">Ses yüklenemedi. Tekrar deneyin.</Text>
          )}
        </View>

        {/* Stop */}
        {(status === 'playing' || status === 'paused') && (
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); stop(); }}
            className="ml-3 h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Ionicons name="stop" size={16} color={isDark ? '#94a3b8' : '#475569'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function SurahDetailScreen({ route }: Props) {
  const { surahId, surahName } = route.params;
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const { isDark } = useTheme();

  useEffect(() => {
    fetchVerses();
    AsyncStorage.getItem(BOOKMARKS_KEY).then((val) => {
      if (val) setBookmarks(new Set(JSON.parse(val)));
    });
  }, []);

  const fetchVerses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.acikkuran.com/surah/${surahId}`);
      const result = await response.json();
      setVerses(result.data.verses);
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
          className="flex-1"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}>
          {/* Audio Player */}
          <AudioPlayer surahId={surahId} />

          {verses.map((verse, index) => (
            <Animated.View
              key={verse.id}
              entering={FadeInUp.delay(index * 50).duration(400)}
              className="mx-4 mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <View className="flex-row items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-teal-600 dark:bg-teal-500">
                  <Text className="text-xs font-black text-white">{verse.verse_number}</Text>
                </View>
                <View className="flex-row items-center gap-4">
                  <TouchableOpacity onPress={() => toggleBookmark(`${surahId}:${verse.verse_number}`)}>
                    <Ionicons
                      name={bookmarks.has(`${surahId}:${verse.verse_number}`) ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={bookmarks.has(`${surahId}:${verse.verse_number}`) ? '#f59e0b' : isDark ? 'rgba(240,244,255,0.55)' : '#475569'}
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

                <Text className="text-base font-medium italic leading-7 text-slate-600 dark:text-slate-300">
                  "{verse.translation.text}"
                </Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
